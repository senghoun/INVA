import { HrCompanyGuard, HrCompanyPermission } from '../guards/hr-company.guard';
import { EmployeeAccessService, EmployeeAccessDto } from '../services/employee-access.service';
import { HrPermissionsGuard, HrPermission, HrSelfPermission } from '../guards/hr-permissions.guard';
import {
  Controller,
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
  NotFoundException,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { HrService } from '../services/hr.service';
import { HrConfigService } from '../services/hr-config.service';
import {
  CreateEmployeeProfileDto,
  UpdateEmployeeProfileDto,
  CreateDepartmentDto,
} from '../dto/employee-profile.dto';
import { EmployeeQueryDto } from '../dto/employee-query.dto';
import {
  UpdateHrConfigDto,
  CreateHrRoleDto,
  UpdateHrRoleDto,
} from '../dto/hr-config.dto';
import {
  JwtAuthGuard,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('hr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, HrPermissionsGuard)

@RequireUserType('INTERNAL')
@Controller('hr')
export class HrController {
  constructor(
    private readonly employeeAccess: EmployeeAccessService,
    private readonly hrService: HrService,
    private readonly hrConfigService: HrConfigService,
  ) {}

  @Get('me')
  @HrPermission('hr:self:read')
  getOwnEmployee(@CurrentUser() actor: JwtPayload) {
    if (!actor.employeeId) throw new NotFoundException('No employee profile linked to your login account.');
    return this.hrService.getEmployeeById(actor.employeeId);
  }

  @Get('access/me')
  @HrPermission()
  getMyAccess(@CurrentUser() actor: JwtPayload) {
    const mapped: Record<string, string> = { 'hr.employee.view': 'hr:employees:read', 'hr.employee.manage': 'hr:employees:write', 'hr.employee.delete': 'hr:employees:delete', 'hr.employee.access.manage': 'hr:roles:manage', 'hr.attendance.view': 'hr:attendance:read', 'hr.attendance.clock': 'hr:attendance:clock', 'hr.attendance.manage': 'hr:attendance:write', 'hr.leave.view': 'hr:leaves:read', 'hr.leave.request': 'hr:leaves:request', 'hr.leave.manage': 'hr:leaves:manage', 'hr.leave.approve': 'hr:leaves:approve' };
    const scoped = actor.companyScope?.permissions.map(permission => mapped[permission]).filter(Boolean) || [];
    return { employeeId: actor.employeeId, permissions: [...scoped, ...(actor.permissions || []).filter(permission => !permission.startsWith('hr:employees:') && !permission.startsWith('hr:leaves:') && !permission.startsWith('hr:attendance:') && permission !== 'hr:roles:manage')], administrator: actor.roles.includes('ADMIN') || actor.roles.includes('HR_ADMIN') };
  }

  @Get('employees/:id/access')
  @HrPermission('hr:roles:manage')
  getEmployeeAccess(@Param('id', ParseUUIDPipe) id: string) { return this.employeeAccess.get(id); }

  @Put('employees/:id/access')
  @HrPermission('hr:roles:manage')
  updateEmployeeAccess(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EmployeeAccessDto, @CurrentUser() actor: JwtPayload, @Headers('authorization') authorization: string) {
    return this.employeeAccess.update(id, dto, actor, authorization);
  }

  // ─── Employees ───────────────────────────────────────────────────────────

  @Get('employees')

  @ApiOperation({ summary: '[INTERNAL] List or search employee profiles with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated employee profiles or array' })
  @HrPermission('hr:employees:read')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.view')
  getEmployees(@Query() query: EmployeeQueryDto, @CurrentUser() actor: JwtPayload) {
    if (query.page !== undefined || query.limit !== undefined) {
      return this.hrService.getEmployeesPaginated(query, actor.companyScope!);
    }
    return this.hrService.getAllEmployees(query, actor.companyScope!);
  }

  @Get('employees/counts')

  @ApiOperation({ summary: '[INTERNAL] Get active/inactive employee count statistics' })
  @ApiQuery({ name: 'companyId', required: false })
  @HrPermission('hr:employees:read')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.view')
  getEmployeeCounts(@CurrentUser() actor: JwtPayload) {
    return this.hrService.getEmployeeCounts(actor.companyScope!);
  }

  @Get('employees/:id')

  @ApiOperation({ summary: '[INTERNAL] Get a single employee profile by ID' })
  @ApiResponse({ status: 200, description: 'Employee profile' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @HrPermission('hr:employees:read')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.view')
  getEmployee(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.hrService.getEmployeeById(id, actor.companyScope!);
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new employee profile' })
  @ApiResponse({ status: 201, description: 'Created employee profile' })
  @ApiResponse({ status: 409, description: 'Profile already exists for this authUserId' })
  @HrPermission('hr:employees:write')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.manage')
  createEmployee(
    @Body() dto: CreateEmployeeProfileDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.hrService.createEmployee(dto, actor.companyScope!);
  }

  @Put('employees/:id')
  @ApiOperation({ summary: '[INTERNAL] Update an employee profile' })
  @ApiResponse({ status: 200, description: 'Updated employee profile' })
  @HrPermission('hr:employees:write')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.manage')
  updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeProfileDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.hrService.updateEmployee(id, dto, actor.companyScope!);
  }

  @Put('employees/:id/toggle-status')
  @ApiOperation({ summary: '[INTERNAL] Toggle active/inactive status of an employee' })
  @HrPermission('hr:employees:write')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.manage')
  toggleEmployeeStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.hrService.toggleEmployeeStatus(id, actor.companyScope!);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete an employee profile' })
  @HrPermission('hr:employees:delete')
  @UseGuards(HrCompanyGuard)
  @HrCompanyPermission('hr.employee.delete')
  deleteEmployee(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.hrService.deleteEmployee(id, actor.companyScope!);
  }

  // ─── Departments ─────────────────────────────────────────────────────────

  @Get('departments')

  @ApiOperation({ summary: '[INTERNAL] List root departments with children' })
  @HrPermission('hr:departments:read', 'hr:departments:manage')
  getAllDepartments() {
    return this.hrService.getAllDepartments();
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new department' })
  @HrPermission('hr:departments:manage')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.hrService.createDepartment(dto);
  }

  // ─── HR Configuration ─────────────────────────────────────────────────────

  @Get('config')

  @ApiOperation({ summary: '[INTERNAL] Get HR domain configuration' })
  @ApiResponse({ status: 200, description: 'HR configuration' })
  @HrPermission('hr:config:manage')
  getConfig() {
    return this.hrConfigService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: '[INTERNAL] Update HR domain configuration' })
  @ApiResponse({ status: 200, description: 'Updated HR configuration' })
  @HrPermission('hr:config:manage')
  updateConfig(
    @Body() dto: UpdateHrConfigDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.hrConfigService.updateConfig(dto, actor?.email || actor?.sub);
  }

  // ─── HR Roles & Permissions ───────────────────────────────────────────────

  @Get('roles')

  @ApiOperation({ summary: '[INTERNAL] List all HR roles and permissions' })
  @ApiResponse({ status: 200, description: 'Array of HR roles' })
  @HrPermission('hr:roles:manage')
  getRoles() {
    return this.hrConfigService.getRoles();
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new custom HR role' })
  @ApiResponse({ status: 201, description: 'Created HR role' })
  @HrPermission('hr:roles:manage')
  createRole(@Body() dto: CreateHrRoleDto) {
    return this.hrConfigService.createRole(dto);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: '[INTERNAL] Update an HR role' })
  @ApiResponse({ status: 200, description: 'Updated HR role' })
  @HrPermission('hr:roles:manage')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHrRoleDto,
  ) {
    return this.hrConfigService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete a custom HR role' })
  @ApiResponse({ status: 200, description: 'Deleted HR role' })
  @HrPermission('hr:roles:manage')
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.hrConfigService.deleteRole(id);
  }
}
