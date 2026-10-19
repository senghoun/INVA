import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationRepository } from '../repositories/organization.repository';
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
  UpdateSectorDto,
  CreateEmploymentTypeDto,
} from '../dto/organization.dto';
import { Company, Branch, Department, Position, Sector, EmploymentType } from '@prisma/client-hr';

@Injectable()
export class OrganizationService {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  // ─── Companies ─────────────────────────────────────────────────────────────

  async getAllCompanies(): Promise<Company[]> {
    return this.orgRepo.findAllCompanies();
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.orgRepo.findCompanyById(id);
    if (!company) throw new NotFoundException(`Company "${id}" not found`);
    return company;
  }

  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.orgRepo.findCompanyByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Company with code "${dto.code}" already exists`);
    }

    return this.orgRepo.createCompany({
      name: dto.name,
      code: dto.code,
      logo: dto.logo,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      address: dto.address,
      status: dto.status || 'ACTIVE',
    });
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.getCompanyById(id);
    return this.orgRepo.updateCompany(id, dto);
  }

  async deleteCompany(id: string): Promise<Company> {
    await this.getCompanyById(id);
    return this.orgRepo.deleteCompany(id);
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  async getBranches(companyId?: string): Promise<Branch[]> {
    return this.orgRepo.findBranches(companyId);
  }

  async getBranchById(id: string): Promise<Branch> {
    const branch = await this.orgRepo.findBranchById(id);
    if (!branch) throw new NotFoundException(`Branch "${id}" not found`);
    return branch;
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    return this.orgRepo.createBranch({
      name: dto.name,
      code: dto.code,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusMeters: dto.radiusMeters ?? 100.0,
      status: dto.status || 'ACTIVE',
      company: { connect: { id: dto.companyId } },
    });
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const current = await this.getBranchById(id);
    if (dto.companyId && dto.companyId !== current.companyId) throw new BadRequestException('A branch cannot be reassigned to another company. Use a controlled employment transfer.');
    const { companyId, ...changes } = dto;
    return this.orgRepo.updateBranch(id, changes);
  }

  async deleteBranch(id: string): Promise<Branch> {
    await this.getBranchById(id);
    return this.orgRepo.deleteBranch(id);
  }

  // ─── Departments ───────────────────────────────────────────────────────────

  async getAllDepartments(companyId?: string, branchId?: string): Promise<Department[]> {
    return this.orgRepo.findAllDepartments({ companyId, branchId });
  }

  async getDepartmentById(id: string): Promise<Department> {
    const dept = await this.orgRepo.findDepartmentById(id);
    if (!dept) throw new NotFoundException(`Department "${id}" not found`);
    return dept;
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    if (dto.branchId) {
      const branch = await this.getBranchById(dto.branchId);
      if (dto.companyId && dto.companyId !== branch.companyId) throw new BadRequestException('Branch and department company must match.');
      dto = { ...dto, companyId: branch.companyId };
    }
    if (dto.parentId) {
      const parent = await this.getDepartmentById(dto.parentId);
      if (dto.companyId && parent.companyId !== dto.companyId) throw new BadRequestException('Parent and department company must match.');
      dto = { ...dto, companyId: dto.companyId || parent.companyId || undefined };
    }
    return this.orgRepo.createDepartment({
      name: dto.name,
      code: dto.code,
      company: dto.companyId ? { connect: { id: dto.companyId } } : undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const current = await this.getDepartmentById(id);
    if (dto.companyId && current.companyId && dto.companyId !== current.companyId) throw new BadRequestException('Department company reassignment requires a controlled transfer.');
    if (dto.branchId) {
      const branch = await this.getBranchById(dto.branchId);
      if (branch.companyId !== (dto.companyId || current.companyId)) throw new BadRequestException('Branch and department company must match.');
    }
    return this.orgRepo.updateDepartment(id, {
      name: dto.name,
      code: dto.code,
      company: dto.companyId ? { connect: { id: dto.companyId } } : undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  async deleteDepartment(id: string): Promise<Department> {
    await this.getDepartmentById(id);
    return this.orgRepo.deleteDepartment(id);
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  async getPositions(departmentId?: string): Promise<Position[]> {
    return this.orgRepo.findPositions(departmentId);
  }

  async getPositionById(id: string): Promise<Position> {
    const pos = await this.orgRepo.findPositionById(id);
    if (!pos) throw new NotFoundException(`Position "${id}" not found`);
    return pos;
  }

  async createPosition(dto: CreatePositionDto): Promise<Position> {
    return this.orgRepo.createPosition({
      name: dto.name,
      code: dto.code,
      level: dto.level ?? 1,
      description: dto.description,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
    });
  }

  async updatePosition(id: string, dto: UpdatePositionDto): Promise<Position> {
    await this.getPositionById(id);
    return this.orgRepo.updatePosition(id, {
      name: dto.name,
      code: dto.code,
      level: dto.level,
      description: dto.description,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
    });
  }

  async deletePosition(id: string): Promise<Position> {
    await this.getPositionById(id);
    return this.orgRepo.deletePosition(id);
  }

  // ─── Sectors ───────────────────────────────────────────────────────────────

  async getSectors(departmentId?: string): Promise<Sector[]> {
    return this.orgRepo.findSectors(departmentId);
  }

  async createSector(dto: CreateSectorDto): Promise<Sector> {
    return this.orgRepo.createSector({
      name: dto.name,
      code: dto.code,
      department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
    });
  }

  async deleteSector(id: string): Promise<Sector> {
    return this.orgRepo.deleteSector(id);
  }

  // ─── Employment Types ──────────────────────────────────────────────────────

  async getEmploymentTypes(): Promise<EmploymentType[]> {
    return this.orgRepo.findEmploymentTypes();
  }

  async createEmploymentType(dto: CreateEmploymentTypeDto): Promise<EmploymentType> {
    return this.orgRepo.createEmploymentType(dto);
  }
}
