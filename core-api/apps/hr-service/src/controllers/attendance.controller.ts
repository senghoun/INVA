import { HrCompanyGuard, HrCompanyPermission } from '../guards/hr-company.guard';
import { HrPermissionsGuard, HrPermission, HrSelfPermission } from '../guards/hr-permissions.guard';
import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import {
  ClockInDto,
  ClockOutDto,
  CreateLateRequestDto,
  ReviewLateRequestDto,
  AttendanceQueryDto,
  LateRequestQueryDto,
} from '../dto/attendance.dto';
import {
  JwtAuthGuard,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('hr-attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, HrPermissionsGuard)

@RequireUserType('INTERNAL')
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private ownClockTarget(dto: { employeeId?: string }, actor: JwtPayload) {
    if (!actor.companyScope!.permissions.includes('hr.attendance.manage')) {
      if (!actor.employeeId || (dto.employeeId && dto.employeeId !== actor.employeeId)) throw new ForbiddenException('You may record attendance only for your own employee record.');
      dto.employeeId = actor.employeeId;
    }
  }

  @Get('today-status')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.attendance.view', 'hr.attendance.clock', 'hr.attendance.manage'])

  @ApiOperation({ summary: '[INTERNAL] Get current employee clock-in status for today' })
  @HrSelfPermission('hr:self:read', 'hr:attendance:read')
  getTodayStatus(@CurrentUser() actor: JwtPayload) {
    return this.attendanceService.getMyTodayStatus(actor.sub, actor.companyScope!);
  }

  @Post('check-in')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.attendance.clock', 'hr.attendance.manage'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[INTERNAL] Clock in for work today' })
  @HrSelfPermission('hr:attendance:clock', 'hr:attendance:write')
  clockIn(
    @Body() dto: ClockInDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    this.ownClockTarget(dto, actor);
    return this.attendanceService.clockIn(dto, actor.sub, actor.companyScope);
  }

  @Post('check-out')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.attendance.clock', 'hr.attendance.manage'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[INTERNAL] Clock out for work today' })
  @HrSelfPermission('hr:attendance:clock', 'hr:attendance:write')
  clockOut(
    @Body() dto: ClockOutDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    this.ownClockTarget(dto, actor);
    return this.attendanceService.clockOut(dto, actor.sub, actor.companyScope);
  }

  @Get('records')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.attendance.view')

  @ApiOperation({ summary: '[INTERNAL] List attendance records (monthly or date range)' })
  @HrSelfPermission('hr:self:read', 'hr:attendance:read')
  getRecords(@Query() query: AttendanceQueryDto, @CurrentUser() actor: JwtPayload) {
    return this.attendanceService.getAttendanceRecords(query, actor.companyScope);
  }

  @Get('late-requests')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.attendance.view')

  @ApiOperation({ summary: '[INTERNAL] List late attendance requests' })
  @HrSelfPermission('hr:self:read', 'hr:attendance:read')
  getLateRequests(
    @Query() query: LateRequestQueryDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.attendanceService.getLateRequests(query.employeeId, query.status, actor.companyScope);
  }

  @Post('late-requests')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.attendance.clock', 'hr.attendance.manage'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Submit request for late attendance' })
  @HrSelfPermission('hr:attendance:clock', 'hr:attendance:write')
  submitLateRequest(
    @Body() dto: CreateLateRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    this.ownClockTarget(dto, actor);
    return this.attendanceService.submitLateRequest(dto, actor.sub, actor.companyScope);
  }

  @Put('late-requests/:id/review')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.attendance.manage')
  @ApiOperation({ summary: '[INTERNAL] Approve or reject late request' })
  @HrPermission('hr:attendance:write')
  reviewLateRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLateRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.attendanceService.reviewLateRequest(id, dto, actor?.email || actor?.sub, actor.companyScope);
  }
}
