import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { HrPrismaService } from '../database/hr-prisma.service';
import {
  AttendanceRecord,
  LateAttendanceRequest,
  WorkingSchedule,
  Prisma,
} from '@prisma/client-hr';
import { CompanyScope, employeeScope } from '../guards/hr-company.guard';
import { AttendanceQueryDto } from '../dto/attendance.dto';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: HrPrismaService) {}

  private async lockEmployee(tx: Prisma.TransactionClient, employeeId: string, scope?: CompanyScope) {
    if (scope) {
      await tx.$queryRaw`SELECT id FROM companies WHERE id = ${scope.companyId}::uuid FOR SHARE`;
      if (!await tx.company.findFirst({ where: { id: scope.companyId, status: 'ACTIVE' } })) throw new ConflictException('Company is not active.');
    }
    await tx.$queryRaw`SELECT id FROM employee_profiles WHERE id = ${employeeId}::uuid FOR UPDATE`;
    const employee = await tx.employeeProfile.findFirst({ where: { id: employeeId, ...(scope ? employeeScope(scope) : {}) } });
    if (!employee) throw new NotFoundException('Employee not found in the selected scope.');
    if (!employee.isActive) throw new ConflictException('Employee is inactive.');
    return employee;
  }

  // ─── Daily Attendance ──────────────────────────────────────────────────────

  async findTodayRecord(employeeId: string, date: Date, scope?: CompanyScope): Promise<AttendanceRecord | null> {
    // Encode the local calendar date at UTC midnight for database DATE comparisons.
    const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    return this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: startOfDay,
        ...(scope ? { employee: employeeScope(scope) } : {}),
      },
      include: {
        lateRequests: { where: { employeeId } },
      },
    });
  }

  async recordClockIn(
    employeeId: string,
    date: Date,
    checkInTime: Date,
    latitude?: number,
    longitude?: number,
    isLate: boolean = false,
    lateMinutes: number = 0,
    notes?: string,
    scope?: CompanyScope,
  ): Promise<AttendanceRecord> {
    // Encode the local calendar date at UTC midnight for database DATE comparisons.
    const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    return this.prisma.$transaction(async tx => {
      await this.lockEmployee(tx, employeeId, scope);
      const key = { employeeId, date: startOfDay };
      const existing = await tx.attendanceRecord.findUnique({ where: { employeeId_date: key } });
      if (existing?.checkInTime) return existing; // Retries retain the original attendance evidence.
      if (existing?.checkOutTime) throw new ConflictException('The existing record requires reconciliation before clock-in.');
      const data = { checkInTime, checkInLat: latitude, checkInLng: longitude, isLate, lateMinutes,
        status: isLate ? 'LATE' : 'PRESENT', notes };
      return tx.attendanceRecord.upsert({ where: { employeeId_date: key }, update: data, create: { ...key, ...data } });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async recordClockOut(
    employeeId: string,
    date: Date,
    checkOutTime: Date,
    latitude?: number,
    longitude?: number,
    notes?: string,
    scope?: CompanyScope,
  ): Promise<AttendanceRecord> {
    // Encode the local calendar date at UTC midnight for database DATE comparisons.
    const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    return this.prisma.$transaction(async tx => {
      await this.lockEmployee(tx, employeeId, scope);
      const key = { employeeId, date: startOfDay };
      const existing = await tx.attendanceRecord.findUnique({ where: { employeeId_date: key } });
      if (!existing?.checkInTime) throw new BadRequestException('Cannot clock out before clocking in for today.');
      if (existing.checkOutTime) return existing;
      if (checkOutTime < existing.checkInTime) throw new BadRequestException('Clock-out cannot precede clock-in.');
      return tx.attendanceRecord.update({ where: { id: existing.id }, data: {
        checkOutTime, checkOutLat: latitude, checkOutLng: longitude,
        checkOutNotes: notes, // Keep the original check-in note separately.
      } });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async findAttendanceRecords(query: AttendanceQueryDto, scope?: CompanyScope): Promise<{
    data: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 31;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceRecordWhereInput = scope ? { employee: employeeScope(scope) } : {};

    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.departmentId) where.AND = [{ employee: { departmentId: query.departmentId } }];
    if (query.status) where.status = query.status;

    if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    } else if (query.month && query.year) {
      const start = new Date(Date.UTC(query.year, query.month - 1, 1));
      const end = new Date(Date.UTC(query.year, query.month, 1));
      where.date = { gte: start, lt: end };
    }

    const [total, data] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
          lateRequests: scope ? { where: { employee: employeeScope(scope) } } : true,
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Late Attendance Requests ──────────────────────────────────────────────

  async createLateRequest(
    data: Prisma.LateAttendanceRequestCreateInput,
    scope?: CompanyScope,
  ): Promise<LateAttendanceRequest> {
    return this.prisma.$transaction(async tx => {
      const employeeId = data.employee.connect?.id;
      if (!employeeId) throw new BadRequestException('Employee is required.');
      await this.lockEmployee(tx, employeeId, scope);
      return tx.lateAttendanceRequest.create({ data });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async findLateRequests(employeeId?: string, status?: string, scope?: CompanyScope): Promise<LateAttendanceRequest[]> {
    return this.prisma.lateAttendanceRequest.findMany({
      where: {
        employeeId: employeeId || undefined,
        status: status && status !== 'ALL' ? status : undefined,
        ...(scope ? { employee: employeeScope(scope) } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewLateRequest(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    decisionNotes?: string,
    scope?: CompanyScope,
  ): Promise<LateAttendanceRequest> {
    return this.prisma.$transaction(async tx => {
      const initial = await tx.lateAttendanceRequest.findFirst({ where: { id, ...(scope ? { employee: employeeScope(scope) } : {}) } });
      if (!initial) throw new NotFoundException('Late request not found.');
      await this.lockEmployee(tx, initial.employeeId, scope);
      const request = await tx.lateAttendanceRequest.findUniqueOrThrow({ where: { id } });
      if (request.status === status) return request;
      if (request.status !== 'PENDING') throw new ConflictException('This attendance decision is final.');
      return tx.lateAttendanceRequest.update({ where: { id }, data: { status, approvedBy, decisionNotes } });
    }, { isolationLevel: 'ReadCommitted' });
  }

  // ─── Working Schedules ─────────────────────────────────────────────────────

  async findAllSchedules(): Promise<WorkingSchedule[]> {
    return this.prisma.workingSchedule.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { title: 'asc' },
    });
  }

  async createSchedule(data: Prisma.WorkingScheduleCreateInput): Promise<WorkingSchedule> {
    return this.prisma.workingSchedule.create({ data });
  }
}
