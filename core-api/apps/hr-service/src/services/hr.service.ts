import { CompanyScope } from '../guards/hr-company.guard';
import { ForbiddenException } from '@nestjs/common';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { HrRepository, PaginatedResult } from '../repositories/hr.repository';
import { CreateEmployeeProfileDto, UpdateEmployeeProfileDto, CreateDepartmentDto } from '../dto/employee-profile.dto';
import { EmployeeQueryDto } from '../dto/employee-query.dto';
import { EmployeeProfile, Department } from '@prisma/client-hr';

@Injectable()
export class HrService {
  constructor(private readonly hrRepository: HrRepository) {}

  async getAllEmployees(query?: EmployeeQueryDto, scope?: CompanyScope): Promise<EmployeeProfile[]> {
    return (await this.hrRepository.findAllEmployees(query, scope)).map(employee => this.protect(employee, scope));
  }

  async getEmployeesPaginated(query: EmployeeQueryDto, scope?: CompanyScope): Promise<PaginatedResult<EmployeeProfile>> {
    const result = await this.hrRepository.findEmployeesPaginated(query, scope);
    return { ...result, data: result.data.map(employee => this.protect(employee, scope)) };
  }

  async getEmployeeCounts(scope?: CompanyScope): Promise<{ active: number; inactive: number; total: number }> {
    return this.hrRepository.countEmployeesByStatus(scope);
  }

  async getEmployeeById(id: string, scope?: CompanyScope): Promise<EmployeeProfile> {
    const employee = await this.hrRepository.findEmployeeById(id, scope);
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found.`);
    }
    return this.protect(employee, scope);
  }

  async createEmployee(dto: CreateEmployeeProfileDto, scope?: CompanyScope): Promise<EmployeeProfile> {


    if (scope) {
      await this.hrRepository.validateEmployeeReferences(dto as unknown as Record<string, unknown>, scope);
      this.checkFinancialWrite(dto, scope, true);
      dto = { ...dto, companyId: scope.companyId };
      if (scope.branchIds.length && !dto.branchId) throw new ForbiddenException('A permitted branch is required.');
    }
    const existingCode = await this.hrRepository.findEmployeeByCode(dto.employeeCode);
    if (existingCode) {
      throw new ConflictException(
        `Employee with code "${dto.employeeCode}" already exists.`,
      );
    }

    const saved = await this.hrRepository.createEmployee({
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      englishName: dto.englishName || `${dto.lastName} ${dto.firstName}`,
      khmerName: dto.khmerName,
      gender: dto.gender,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      nationalId: dto.nationalId,
      maritalStatus: dto.maritalStatus,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      jobTitle: dto.jobTitle,
      hireDate: new Date(dto.hireDate),
      probationEnd: dto.probationEnd ? new Date(dto.probationEnd) : undefined,
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      baseSalary: dto.baseSalary,
      isActive: dto.isActive ?? true,
      company: dto.companyId ? { connect: { id: dto.companyId } } : undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
      position: dto.positionId ? { connect: { id: dto.positionId } } : undefined,
      sector: dto.sectorId ? { connect: { id: dto.sectorId } } : undefined,
      employmentType: dto.employmentTypeId ? { connect: { id: dto.employmentTypeId } } : undefined,
      manager: dto.managerId ? { connect: { id: dto.managerId } } : undefined,
      leader: dto.leaderId ? { connect: { id: dto.leaderId } } : undefined,
      workingSchedule: dto.workingScheduleId ? { connect: { id: dto.workingScheduleId } } : undefined,
    }, scope);
    return this.protect(saved, scope);
  }

  async updateEmployee(
    id: string,
    dto: UpdateEmployeeProfileDto,
    scope?: CompanyScope,
  ): Promise<EmployeeProfile> {
    await this.getEmployeeById(id, scope);

    if (scope) { await this.hrRepository.validateEmployeeReferences(dto as Record<string, unknown>, scope); this.checkFinancialWrite(dto, scope); }
    const saved = await this.hrRepository.updateEmployee(id, {
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      englishName: dto.englishName,
      khmerName: dto.khmerName,
      gender: dto.gender,
      dob: dto.dob === null ? null : dto.dob ? new Date(dto.dob) : undefined,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      nationalId: dto.nationalId,
      maritalStatus: dto.maritalStatus,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      jobTitle: dto.jobTitle,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      probationEnd: dto.probationEnd === null ? null : dto.probationEnd ? new Date(dto.probationEnd) : undefined,
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      baseSalary: dto.baseSalary,
      isActive: dto.isActive,
      company: dto.companyId ? { connect: { id: dto.companyId } } : undefined,
      branch: dto.branchId === null ? { disconnect: true } : dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      department: dto.departmentId === null ? { disconnect: true } : dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
      position: dto.positionId === null ? { disconnect: true } : dto.positionId ? { connect: { id: dto.positionId } } : undefined,
      sector: dto.sectorId === null ? { disconnect: true } : dto.sectorId ? { connect: { id: dto.sectorId } } : undefined,
      employmentType: dto.employmentTypeId === null ? { disconnect: true } : dto.employmentTypeId ? { connect: { id: dto.employmentTypeId } } : undefined,
      manager: dto.managerId === null ? { disconnect: true } : dto.managerId ? { connect: { id: dto.managerId } } : undefined,
      leader: dto.leaderId === null ? { disconnect: true } : dto.leaderId ? { connect: { id: dto.leaderId } } : undefined,
      workingSchedule: dto.workingScheduleId === null ? { disconnect: true } : dto.workingScheduleId ? { connect: { id: dto.workingScheduleId } } : undefined,
    }, scope);
    return this.protect(saved, scope);
  }

  async toggleEmployeeStatus(id: string, scope?: CompanyScope): Promise<EmployeeProfile> {
    const emp = await this.getEmployeeById(id, scope);
    return this.protect(await this.hrRepository.updateEmployee(id, {
      isActive: !emp.isActive,
    }, scope), scope);
  }

  async deleteEmployee(id: string, scope?: CompanyScope): Promise<EmployeeProfile> {
    await this.getEmployeeById(id, scope);
    return this.protect(await this.hrRepository.deleteEmployee(id, scope), scope);
  }

  private checkFinancialWrite(dto: UpdateEmployeeProfileDto, scope: CompanyScope, creating = false) {
    if (!scope.permissions.includes('hr.payroll.manage') && (dto.bankName !== undefined || dto.bankAccountNumber !== undefined || (dto.baseSalary !== undefined && (!creating || dto.baseSalary !== 0)))) throw new ForbiddenException('Payroll permission is required for financial employee fields.');
  }
  private protect<T extends EmployeeProfile>(employee: T, scope?: CompanyScope): T {
    if (!scope) return employee;
    const result: any = { ...employee };
    if (!scope.permissions.includes('hr.payroll.view')) { result.baseSalary = null; result.bankName = null; result.bankAccountNumber = null; }
    if (!scope.permissions.includes('hr.employee.private.view')) for (const field of ['nationalId', 'dob', 'address', 'emergencyContact', 'emergencyPhone']) result[field] = null;
    for (const field of ['manager', 'leader']) if (result[field]) result[field] = result[field].companyId === scope.companyId && (!scope.branchIds.length || scope.branchIds.includes(result[field].branchId)) ? this.protect(result[field], scope) : null;
    return result;
  }

  // ─── Departments (Delegated / Backward Compatible) ─────────────────────────

  async getAllDepartments(): Promise<Department[]> {
    return this.hrRepository.findAllDepartments();
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    return this.hrRepository.createDepartment({
      name: dto.name,
      code: dto.code,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }
}
