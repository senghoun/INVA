import { HrCompanyGuard, HrCompanyPermission } from '../guards/hr-company.guard';
import { HrPermissionsGuard, HrPermission, HrSelfPermission } from '../guards/hr-permissions.guard';
import {
  Controller,
  BadRequestException,
  ForbiddenException,
  Get,
  Post,
  Put,
  Delete,
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
import { LeaveService } from '../services/leave.service';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveEntitlementDto,
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  LeaveQueryDto,
  LeaveEntitlementQueryDto,
} from '../dto/leave.dto';
import {
  JwtAuthGuard,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
  RolesGuard,
  RequireRoles,
} from '@common';

@ApiTags('hr-leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, HrPermissionsGuard)

@RequireUserType('INTERNAL')
@Controller('hr/leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // ─── Leave Types ───────────────────────────────────────────────────────────

  @Get('types')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.leave.view', 'hr.leave.request', 'hr.leave.manage', 'hr.leave.approve'])

  @ApiOperation({ summary: '[INTERNAL] List all leave types' })
  @HrPermission('hr:self:read', 'hr:leaves:read', 'hr:leaves:manage')
  getLeaveTypes() {
    return this.leaveService.getAllLeaveTypes();
  }

  @Post('types')
  @UseGuards(RolesGuard)
  @RequireRoles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new leave type' })
  @HrPermission('hr:leaves:write', 'hr:leaves:manage')
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveService.createLeaveType(dto);
  }

  @Put('types/:id')
  @UseGuards(RolesGuard)
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: '[INTERNAL] Update leave type' })
  @HrPermission('hr:leaves:write', 'hr:leaves:manage')
  updateLeaveType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.leaveService.updateLeaveType(id, dto);
  }

  @Delete('types/:id')
  @UseGuards(RolesGuard)
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: '[INTERNAL] Delete leave type' })
  @HrPermission('hr:leaves:write', 'hr:leaves:manage')
  deleteLeaveType(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveService.deleteLeaveType(id);
  }

  // ─── Entitlements ──────────────────────────────────────────────────────────

  @Get('entitlements')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.leave.view')

  @ApiOperation({ summary: '[INTERNAL] Get leave balances and entitlements' })
  @HrSelfPermission('hr:self:read', 'hr:leaves:read', 'hr:leaves:manage')
  getEntitlements(
    @Query() query: LeaveEntitlementQueryDto,
    @CurrentUser() actor?: JwtPayload,
  ) {
    const targetId = query.employeeId || actor?.employeeId;
    if (!targetId) throw new BadRequestException('Specify an employee or link your login account to an employee.');
    return this.leaveService.getEntitlements(targetId, query.year, actor!.companyScope);
  }

  @Post('entitlements')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.leave.manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Set annual leave entitlement for an employee' })
  @HrPermission('hr:leaves:write', 'hr:leaves:manage')
  setEntitlement(@Body() dto: CreateLeaveEntitlementDto, @CurrentUser() actor: JwtPayload) {
    return this.leaveService.setEntitlement(dto, actor.companyScope, actor.sub);
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  @Get('requests')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.leave.view')

  @ApiOperation({ summary: '[INTERNAL] List leave requests (paginated, with filters)' })
  @HrSelfPermission('hr:self:read', 'hr:leaves:read', 'hr:leaves:manage')
  getLeaveRequests(@Query() query: LeaveQueryDto, @CurrentUser() actor: JwtPayload) {
    return this.leaveService.getLeaveRequests(query, actor.companyScope);
  }

  @Post('requests')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission(['hr.leave.request', 'hr.leave.manage'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Submit a new leave request' })
  @HrSelfPermission('hr:leaves:request', 'hr:leaves:manage')
  submitLeaveRequest(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    if (!actor.companyScope!.permissions.includes('hr.leave.manage')) {
      if (!actor.employeeId || (dto.employeeId && dto.employeeId !== actor.employeeId)) throw new ForbiddenException('You may submit leave only for your own employee record.');
      dto.employeeId = actor.employeeId;
    }
    return this.leaveService.submitLeaveRequest(dto, actor.sub, actor.companyScope);
  }

  @Put('requests/:id/review')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.leave.approve')
  @ApiOperation({ summary: '[INTERNAL] Approve or reject a leave request' })
  @HrPermission('hr:leaves:approve')
  reviewLeaveRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.leaveService.reviewLeaveRequest(id, dto, actor?.email || actor?.sub, actor.companyScope, actor.sub);
  }
}
