import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CompanyScope } from '../guards/hr-company.guard';
import { LeaveRepository } from '../repositories/leave.repository';
import { HrRepository } from '../repositories/hr.repository';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveEntitlementDto,
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  LeaveQueryDto,
} from '../dto/leave.dto';
import { LeaveType, LeaveEntitlement, LeaveRequest } from '@prisma/client-hr';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepo: LeaveRepository,
    private readonly hrRepo: HrRepository,
  ) {}

  private async resolveEmployeeId(explicitId?: string, authUserId?: string): Promise<string> {
    if (explicitId) return explicitId;
    if (authUserId) {
      const emp = await this.hrRepo.findEmployeeByAuthUserId(authUserId);
      if (emp) return emp.id;
    }
    throw new BadRequestException('Could not resolve employee profile for leave action');
  }

  // ─── Leave Types ───────────────────────────────────────────────────────────

  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return this.leaveRepo.findAllLeaveTypes();
  }

  async getLeaveTypeById(id: string): Promise<LeaveType> {
    const type = await this.leaveRepo.findLeaveTypeById(id);
    if (!type) throw new NotFoundException(`Leave type "${id}" not found`);
    return type;
  }

  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveType> {
    const existing = await this.leaveRepo.findLeaveTypeByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Leave type with code "${dto.code}" already exists`);
    }

    return this.leaveRepo.createLeaveType({
      name: dto.name,
      code: dto.code,
      defaultDaysPerYear: dto.defaultDaysPerYear ?? 18,
      isPaid: dto.isPaid ?? true,
      allowCarryover: dto.allowCarryover ?? false,
    });
  }

  async updateLeaveType(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
    await this.getLeaveTypeById(id);
    return this.leaveRepo.updateLeaveType(id, dto);
  }

  async deleteLeaveType(id: string): Promise<LeaveType> {
    await this.getLeaveTypeById(id);
    return this.leaveRepo.deleteLeaveType(id);
  }

  // ─── Entitlements ──────────────────────────────────────────────────────────

  async getEntitlements(employeeIdOrAuthId: string, year?: number, scope?: CompanyScope): Promise<LeaveEntitlement[]> {
    let empId = employeeIdOrAuthId;
    const emp = await this.hrRepo.findEmployeeByAuthUserId(employeeIdOrAuthId);
    if (emp) empId = emp.id;

    if (scope && !await this.hrRepo.findEmployeeById(empId, scope)) throw new NotFoundException('Employee not found.');
    return this.leaveRepo.findEntitlements(empId, year);
  }

  async setEntitlement(dto: CreateLeaveEntitlementDto, scope?: CompanyScope, actor?: string): Promise<LeaveEntitlement> {
    if (!Number.isInteger(dto.totalDays * 2)) throw new BadRequestException('Entitlements must use half-day increments.');
    return this.leaveRepo.upsertEntitlement(
      dto.employeeId,
      dto.leaveTypeId,
      dto.year,
      dto.totalDays,
      scope,
      actor,
    );
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  async submitLeaveRequest(
    dto: CreateLeaveRequestDto,
    authUserId?: string,
    scope?: CompanyScope,
  ): Promise<LeaveRequest> {
    const employeeId = await this.resolveEmployeeId(dto.employeeId, authUserId);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) throw new BadRequestException('Split leave into separate requests for each entitlement year.');
    const calendarDays = (endDate.getTime() - startDate.getTime()) / 86400000 + 1;
    if (dto.durationDays > calendarDays || !Number.isInteger(dto.durationDays * 2)) throw new BadRequestException('Duration must use half-day increments within the date range.');

    // Verify leave type exists
    await this.getLeaveTypeById(dto.leaveTypeId);

    return this.leaveRepo.createLeaveRequest({
      employee: { connect: { id: employeeId } },
      leaveType: { connect: { id: dto.leaveTypeId } },
      startDate,
      endDate,
      durationDays: dto.durationDays,
      reason: dto.reason,
      status: 'PENDING',
    }, scope, authUserId);
  }

  async getLeaveRequests(query: LeaveQueryDto, scope?: CompanyScope) {
    return this.leaveRepo.findLeaveRequests(query, scope);
  }

  async reviewLeaveRequest(
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewerEmail?: string,
    scope?: CompanyScope,
    actor?: string,
  ): Promise<LeaveRequest> {
    return this.leaveRepo.reviewLeaveRequest(id, dto.status, reviewerEmail || 'System Admin', dto.reviewNotes, scope, actor);
  }
}
