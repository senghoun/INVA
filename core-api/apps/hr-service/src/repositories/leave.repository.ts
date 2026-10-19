import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HrPrismaService } from '../database/hr-prisma.service';
import {
  LeaveType,
  LeaveEntitlement,
  LeaveRequest,
  Prisma,
} from '@prisma/client-hr';
import { LeaveQueryDto } from '../dto/leave.dto';
import { CompanyScope, employeeScope } from '../guards/hr-company.guard';

@Injectable()
export class LeaveRepository {
  constructor(private readonly prisma: HrPrismaService) {}

  // ─── Leave Types ───────────────────────────────────────────────────────────

  async findAllLeaveTypes(): Promise<LeaveType[]> {
    return this.prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findLeaveTypeById(id: string): Promise<LeaveType | null> {
    return this.prisma.leaveType.findUnique({ where: { id } });
  }

  async findLeaveTypeByCode(code: string): Promise<LeaveType | null> {
    return this.prisma.leaveType.findUnique({ where: { code } });
  }

  async createLeaveType(data: Prisma.LeaveTypeCreateInput): Promise<LeaveType> {
    return this.prisma.leaveType.create({ data });
  }

  async updateLeaveType(id: string, data: Prisma.LeaveTypeUpdateInput): Promise<LeaveType> {
    return this.prisma.leaveType.update({ where: { id }, data });
  }

  async deleteLeaveType(id: string): Promise<LeaveType> {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM leave_types WHERE id = ${id}::uuid FOR UPDATE`;
      const references = await tx.leaveType.findUnique({ where: { id }, include: { _count: { select: { requests: true, entitlements: true } } } });
      if (!references) throw new NotFoundException('Leave type not found.');
      if (references._count.requests || references._count.entitlements) throw new ConflictException('Leave types with requests or entitlements must be retained.');
      return tx.leaveType.delete({ where: { id } });
    }, { isolationLevel: 'ReadCommitted' });
  }

  // ─── Leave Entitlements ────────────────────────────────────────────────────

  async findEntitlements(employeeId: string, year?: number): Promise<LeaveEntitlement[]> {
    const currentYear = year || new Date().getUTCFullYear();
    return this.prisma.leaveEntitlement.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
      orderBy: { leaveType: { name: 'asc' } },
    });
  }

  async findEntitlement(
    employeeId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<LeaveEntitlement | null> {
    return this.prisma.leaveEntitlement.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
    });
  }

  private async lockEmployee(tx: Prisma.TransactionClient, employeeId: string, scope?: CompanyScope) {
    // Match employment-write ordering: company before employee to avoid transfer/deactivation deadlocks.
    if (scope) {
      await tx.$queryRaw`SELECT id FROM companies WHERE id = ${scope.companyId}::uuid FOR SHARE`;
      if (!await tx.company.findFirst({ where: { id: scope.companyId, status: 'ACTIVE' } })) throw new ConflictException('Company is not active.');
    }
    await tx.$queryRaw`SELECT id FROM employee_profiles WHERE id = ${employeeId}::uuid FOR UPDATE`;
    const employee = await tx.employeeProfile.findFirst({ where: { id: employeeId, ...(scope ? employeeScope(scope) : {}) } });
    if (!employee) throw new NotFoundException('Employee not found in the selected scope.');
    return employee;
  }

  async upsertEntitlement(employeeId: string, leaveTypeId: string, year: number, totalDays: number, scope?: CompanyScope, actor?: string): Promise<LeaveEntitlement> {
    return this.prisma.$transaction(async tx => {
      const employee = await this.lockEmployee(tx, employeeId, scope);
      const key = { employeeId, leaveTypeId, year };
      const existing = await tx.leaveEntitlement.findUnique({ where: { employeeId_leaveTypeId_year: key } });
      const usedDays = existing?.usedDays ?? 0;
      if (totalDays < usedDays) throw new ConflictException('Entitlement cannot be reduced below already used days.');
      const result = await tx.leaveEntitlement.upsert({
        where: { employeeId_leaveTypeId_year: key },
        update: { totalDays, remainingDays: totalDays - usedDays },
        create: { ...key, totalDays, usedDays: 0, remainingDays: totalDays },
      });
      await tx.hrLeaveEvent.create({ data: { companyId: employee.companyId, employeeId, resourceId: result.id, actor,
        action: 'ENTITLEMENT_SET', metadata: { year, totalDays, previousTotalDays: existing?.totalDays ?? null, usedDays } } });
      return result;
    }, { isolationLevel: 'ReadCommitted' });
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  async findLeaveRequests(query: LeaveQueryDto, scope?: CompanyScope): Promise<{
    data: LeaveRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveRequestWhereInput = scope ? { employee: employeeScope(scope) } : {};

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.leaveTypeId) where.leaveTypeId = query.leaveTypeId;
    if (query.status && query.status !== 'ALL') where.status = query.status;

    if (query.year) {
      const start = new Date(Date.UTC(query.year, 0, 1));
      const end = new Date(Date.UTC(query.year + 1, 0, 1));
      where.startDate = { gte: start, lt: end };
    }

    const [total, data] = await Promise.all([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leaveType: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async findLeaveRequestById(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        leaveType: true,
        employee: true,
      },
    });
  }

  async createLeaveRequest(data: Prisma.LeaveRequestCreateInput, scope?: CompanyScope, actor?: string): Promise<LeaveRequest> {
    return this.prisma.$transaction(async tx => {
      const employeeId = data.employee.connect?.id;
      if (!employeeId) throw new BadRequestException('Employee is required.');
      const employee = await this.lockEmployee(tx, employeeId, scope);
      if (!employee.isActive) throw new ConflictException('Employee is inactive.');
      const overlap = await tx.leaveRequest.findFirst({ where: {
        employeeId, status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: data.endDate }, endDate: { gte: data.startDate },
      } });
      if (overlap) throw new ConflictException('Leave overlaps an existing pending or approved request.');
      const result = await tx.leaveRequest.create({ data, include: { leaveType: true } });
      await tx.hrLeaveEvent.create({ data: { companyId: employee.companyId, employeeId, resourceId: result.id, actor,
        action: 'LEAVE_SUBMITTED', metadata: { status: result.status, startDate: result.startDate.toISOString().slice(0, 10), endDate: result.endDate.toISOString().slice(0, 10), durationDays: result.durationDays } } });
      return result;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async reviewLeaveRequest(
    id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED', approvedBy: string,
    reviewNotes?: string, scope?: CompanyScope, actor?: string,
  ): Promise<LeaveRequest> {
    return this.prisma.$transaction(async tx => {
      const initial = await tx.leaveRequest.findFirst({ where: { id, ...(scope ? { employee: employeeScope(scope) } : {}) } });
      if (!initial) throw new NotFoundException('Leave request not found.');
      const employee = await this.lockEmployee(tx, initial.employeeId, scope);
      await tx.$queryRaw`SELECT id FROM leave_requests WHERE id = ${id}::uuid FOR UPDATE`;
      const request = await tx.leaveRequest.findUniqueOrThrow({ where: { id } });
      if (status === 'APPROVED' && actor && employee.authUserId === actor) throw new ForbiddenException('You cannot approve your own leave.');
      if (request.durationDays < 0.5 || !Number.isInteger(request.durationDays * 2)) throw new ConflictException('The stored duration requires reconciliation before review.');
      if (request.status === status) return request; // Replays never charge or refund twice.
      if (request.status !== 'PENDING' && !(request.status === 'APPROVED' && status === 'CANCELLED')) {
        throw new ConflictException('This leave decision is final; create a new request.');
      }
      if (status === 'APPROVED' || request.status === 'APPROVED') {
        const year = request.startDate.getUTCFullYear();
        if (year !== request.endDate.getUTCFullYear()) throw new BadRequestException('Split leave into separate requests for each entitlement year.');
        const entitlement = await tx.leaveEntitlement.findUnique({ where: { employeeId_leaveTypeId_year: {
          employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year,
        } } });
        if (!entitlement) throw new ConflictException('An explicit leave entitlement is required.');
        const usedDays = entitlement.usedDays + (status === 'APPROVED' ? request.durationDays : -request.durationDays);
        if (usedDays < 0 || usedDays > entitlement.totalDays) throw new ConflictException('Insufficient or inconsistent leave balance.');
        await tx.leaveEntitlement.update({ where: { id: entitlement.id }, data: { usedDays, remainingDays: entitlement.totalDays - usedDays } });
      }
      const result = await tx.leaveRequest.update({ where: { id }, data: { status, approvedBy, reviewNotes }, include: { leaveType: true } });
      await tx.hrLeaveEvent.create({ data: { companyId: employee.companyId, employeeId: request.employeeId, resourceId: id, actor: actor ?? approvedBy,
        action: 'LEAVE_REVIEWED', metadata: { previousStatus: request.status, status, durationDays: request.durationDays } } });
      return result;
    }, { isolationLevel: 'ReadCommitted' });
  }
}
