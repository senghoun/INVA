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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateBranchDto,
  UpdateBranchDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreatePositionDto,
  UpdatePositionDto,
  CreateSectorDto,
  CreateEmploymentTypeDto,
} from '../dto/organization.dto';
import {
  JwtAuthGuard,
  UserTypeGuard,
  RequireUserType,
} from '@common';

@ApiTags('hr-organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, HrPermissionsGuard)

@RequireUserType('INTERNAL')
@Controller('hr/organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ─── Companies ─────────────────────────────────────────────────────────────

  @Get('companies')

  @ApiOperation({ summary: '[INTERNAL] List all companies' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getCompanies() {
    return this.orgService.getAllCompanies();
  }

  @Get('companies/:id')

  @ApiOperation({ summary: '[INTERNAL] Get single company by ID' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getCompanyById(id);
  }

  @Post('companies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new company' })
  @HrPermission('hr:organizations:write')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.orgService.createCompany(dto);
  }

  @Put('companies/:id')
  @ApiOperation({ summary: '[INTERNAL] Update company' })
  @HrPermission('hr:organizations:write')
  updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.orgService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete company' })
  @HrPermission('hr:organizations:write')
  deleteCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.deleteCompany(id);
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  @Get('branches')

  @ApiOperation({ summary: '[INTERNAL] List branches (optionally by companyId)' })
  @ApiQuery({ name: 'companyId', required: false })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getBranches(@Query('companyId') companyId?: string) {
    return this.orgService.getBranches(companyId);
  }

  @Get('branches/:id')

  @ApiOperation({ summary: '[INTERNAL] Get branch by ID' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getBranch(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getBranchById(id);
  }

  @Post('branches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create a new branch' })
  @HrPermission('hr:organizations:write')
  createBranch(@Body() dto: CreateBranchDto) {
    return this.orgService.createBranch(dto);
  }

  @Put('branches/:id')
  @ApiOperation({ summary: '[INTERNAL] Update branch' })
  @HrPermission('hr:organizations:write')
  updateBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.orgService.updateBranch(id, dto);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete branch' })
  @HrPermission('hr:organizations:write')
  deleteBranch(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.deleteBranch(id);
  }

  // ─── Departments ───────────────────────────────────────────────────────────

  @Get('departments')

  @ApiOperation({ summary: '[INTERNAL] List departments (hierarchical, with company/branch filters)' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getDepartments(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.orgService.getAllDepartments(companyId, branchId);
  }

  @Get('departments/:id')

  @ApiOperation({ summary: '[INTERNAL] Get department by ID' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getDepartmentById(id);
  }

  @Post('departments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create department' })
  @HrPermission('hr:departments:manage', 'hr:organizations:write')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.orgService.createDepartment(dto);
  }

  @Put('departments/:id')
  @ApiOperation({ summary: '[INTERNAL] Update department' })
  @HrPermission('hr:departments:manage', 'hr:organizations:write')
  updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.orgService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete department' })
  @HrPermission('hr:departments:manage', 'hr:organizations:write')
  deleteDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.deleteDepartment(id);
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  @Get('positions')

  @ApiOperation({ summary: '[INTERNAL] List positions (optionally by departmentId)' })
  @ApiQuery({ name: 'departmentId', required: false })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getPositions(@Query('departmentId') departmentId?: string) {
    return this.orgService.getPositions(departmentId);
  }

  @Get('positions/:id')

  @ApiOperation({ summary: '[INTERNAL] Get position by ID' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getPosition(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.getPositionById(id);
  }

  @Post('positions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create position' })
  @HrPermission('hr:organizations:write')
  createPosition(@Body() dto: CreatePositionDto) {
    return this.orgService.createPosition(dto);
  }

  @Put('positions/:id')
  @ApiOperation({ summary: '[INTERNAL] Update position' })
  @HrPermission('hr:organizations:write')
  updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.orgService.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete position' })
  @HrPermission('hr:organizations:write')
  deletePosition(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.deletePosition(id);
  }

  // ─── Sectors ───────────────────────────────────────────────────────────────

  @Get('sectors')

  @ApiOperation({ summary: '[INTERNAL] List sectors' })
  @ApiQuery({ name: 'departmentId', required: false })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getSectors(@Query('departmentId') departmentId?: string) {
    return this.orgService.getSectors(departmentId);
  }

  @Post('sectors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create sector' })
  @HrPermission('hr:organizations:write')
  createSector(@Body() dto: CreateSectorDto) {
    return this.orgService.createSector(dto);
  }

  @Delete('sectors/:id')
  @ApiOperation({ summary: '[INTERNAL] Delete sector' })
  @HrPermission('hr:organizations:write')
  deleteSector(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.deleteSector(id);
  }

  // ─── Employment Types ──────────────────────────────────────────────────────

  @Get('employment-types')

  @ApiOperation({ summary: '[INTERNAL] List employment types' })
  @HrPermission('hr:departments:read', 'hr:departments:manage', 'hr:organizations:read', 'hr:organizations:write')
  getEmploymentTypes() {
    return this.orgService.getEmploymentTypes();
  }

  @Post('employment-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[INTERNAL] Create employment type' })
  @HrPermission('hr:organizations:write')
  createEmploymentType(@Body() dto: CreateEmploymentTypeDto) {
    return this.orgService.createEmploymentType(dto);
  }
}
