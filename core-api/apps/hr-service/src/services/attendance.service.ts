import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyScope } from '../guards/hr-company.guard';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { HrRepository } from '../repositories/hr.repository';
import {
  ClockInDto,
  ClockOutDto,
  CreateLateRequestDto,
  ReviewLateRequestDto,
  AttendanceQueryDto,
} from '../dto/attendance.dto';
import { AttendanceRecord, LateAttendanceRequest } from '@prisma/client-hr';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly hrRepo: HrRepository,
  ) {}

  private async resolveEmployeeId(explicitId?: string, authUserId?: string): Promise<string> {
    if (explicitId) return explicitId;
    if (authUserId) {
      const emp = await this.hrRepo.findEmployeeByAuthUserId(authUserId);
      if (emp) return emp.id;
    }
    throw new BadRequestException('Could not resolve employee profile for attendance action');
  }

  async getMyTodayStatus(authUserId: string, scope: CompanyScope) {
    const employee = await this.hrRepo.findEmployeeByAuthUserId(authUserId);
    if (!employee || !await this.hrRepo.findEmployeeById(employee.id, scope)) {
      return { status: 'NO_EMPLOYEE_PROFILE' as const, hasClockedIn: false, hasClockedOut: false, record: null };
    }
    return this.getTodayStatus(employee.id, scope);
  }

  async getTodayStatus(employeeId: string, scope?: CompanyScope): Promise<{
    status: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
    hasClockedIn: boolean;
    hasClockedOut: boolean;
    record: AttendanceRecord | null;
  }> {
    if (scope && !await this.hrRepo.findEmployeeById(employeeId, scope)) throw new NotFoundException('Employee not found.');
    const record = await this.attendanceRepo.findTodayRecord(employeeId, new Date(), scope);
    return {
      status: record?.checkOutTime ? 'CHECKED_OUT' : record?.checkInTime ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
      hasClockedIn: !!record?.checkInTime,
      hasClockedOut: !!record?.checkOutTime,
      record,
    };
  }

  async clockIn(dto: ClockInDto, authUserId?: string, scope?: CompanyScope): Promise<AttendanceRecord> {
    const employeeId = await this.resolveEmployeeId(dto.employeeId, authUserId);
    const now = new Date();

    // Check if employee has a schedule to calculate lateness
    const employee = await this.hrRepo.findEmployeeById(employeeId, scope);
    let isLate = false;
    let lateMinutes = 0;

    if (employee?.workingSchedule) {
      const schedule = employee.workingSchedule;
      const [schedHours, schedMins] = schedule.checkInTime.split(':').map(Number);
      const scheduleTime = new Date(now);
      scheduleTime.setHours(schedHours, schedMins + schedule.lateGraceMinutes, 0, 0);

      if (now > scheduleTime) {
        isLate = true;
        const diffMs = now.getTime() - scheduleTime.getTime();
        lateMinutes = Math.floor(diffMs / 60000);
      }
    }

    return this.attendanceRepo.recordClockIn(
      employeeId,
      now,
      now,
      dto.latitude,
      dto.longitude,
      isLate,
      lateMinutes,
      dto.notes,
      scope,
    );
  }

  async clockOut(dto: ClockOutDto, authUserId?: string, scope?: CompanyScope): Promise<AttendanceRecord> {
    const employeeId = await this.resolveEmployeeId(dto.employeeId, authUserId);
    const now = new Date();

    return this.attendanceRepo.recordClockOut(
      employeeId,
      now,
      now,
      dto.latitude,
      dto.longitude,
      dto.notes,
      scope,
    );
  }

  async getAttendanceRecords(query: AttendanceQueryDto, scope?: CompanyScope) {
    if (!!query.startDate !== !!query.endDate || (!!query.month !== !!query.year)) throw new BadRequestException('Provide both dates or both month and year.');
    if (query.startDate && query.endDate && query.startDate > query.endDate) throw new BadRequestException('Start date cannot be after end date.');
    return this.attendanceRepo.findAttendanceRecords(query, scope);
  }

  // ─── Late Attendance Requests ──────────────────────────────────────────────

  async submitLateRequest(
    dto: CreateLateRequestDto,
    authUserId?: string,
    scope?: CompanyScope,
  ): Promise<LateAttendanceRequest> {
    const employeeId = await this.resolveEmployeeId(dto.employeeId, authUserId);

    return this.attendanceRepo.createLateRequest({
      employee: { connect: { id: employeeId } },
      date: new Date(dto.date),
      expectedArrival: dto.expectedArrival,
      reason: dto.reason,
      status: 'PENDING',
    }, scope);
  }

  async getLateRequests(employeeId?: string, status?: string, scope?: CompanyScope): Promise<LateAttendanceRequest[]> {
    return this.attendanceRepo.findLateRequests(employeeId, status, scope);
  }

  async reviewLateRequest(
    id: string,
    dto: ReviewLateRequestDto,
    reviewerEmail?: string,
    scope?: CompanyScope,
  ): Promise<LateAttendanceRequest> {
    return this.attendanceRepo.reviewLateRequest(
      id,
      dto.status,
      reviewerEmail || 'System Admin',
      dto.decisionNotes,
      scope,
    );
  }
}
