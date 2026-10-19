import { Injectable } from '@nestjs/common';
import { HrPrismaService } from '../database/hr-prisma.service';
import {
  Company,
  Branch,
  Department,
  Position,
  Sector,
  EmploymentType,
  Prisma,
} from '@prisma/client-hr';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: HrPrismaService) {}

  // ─── Companies ─────────────────────────────────────────────────────────────

  async findAllCompanies(): Promise<Company[]> {
    return this.prisma.company.findMany({
      include: {
        _count: {
          select: { branches: true, departments: true, employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCompanyById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        departments: true,
        _count: { select: { employees: true } },
      },
    });
  }

  async findCompanyByCode(code: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { code } });
  }

  async createCompany(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({ data });
  }

  async updateCompany(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data });
  }

  async deleteCompany(id: string): Promise<Company> {
    return this.prisma.company.delete({ where: { id } });
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  async findBranches(companyId?: string): Promise<Branch[]> {
    return this.prisma.branch.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
        _count: { select: { departments: true, employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBranchById(id: string): Promise<Branch | null> {
    return this.prisma.branch.findUnique({
      where: { id },
      include: { company: true, departments: true },
    });
  }

  async createBranch(data: Prisma.BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({ data });
  }

  async updateBranch(id: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async deleteBranch(id: string): Promise<Branch> {
    return this.prisma.branch.delete({ where: { id } });
  }

  // ─── Departments ───────────────────────────────────────────────────────────

  async findAllDepartments(filters?: { companyId?: string; branchId?: string }): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: {
        companyId: filters?.companyId || undefined,
        branchId: filters?.branchId || undefined,
      },
      include: {
        company: true,
        branch: true,
        children: true,
        positions: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findDepartmentById(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        company: true,
        branch: true,
        parent: true,
        children: true,
        positions: true,
        sectors: true,
      },
    });
  }

  async createDepartment(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return this.prisma.department.create({ data });
  }

  async updateDepartment(id: string, data: Prisma.DepartmentUpdateInput): Promise<Department> {
    return this.prisma.department.update({ where: { id }, data });
  }

  async deleteDepartment(id: string): Promise<Department> {
    return this.prisma.department.delete({ where: { id } });
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  async findPositions(departmentId?: string): Promise<Position[]> {
    return this.prisma.position.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: true,
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPositionById(id: string): Promise<Position | null> {
    return this.prisma.position.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  async createPosition(data: Prisma.PositionCreateInput): Promise<Position> {
    return this.prisma.position.create({ data });
  }

  async updatePosition(id: string, data: Prisma.PositionUpdateInput): Promise<Position> {
    return this.prisma.position.update({ where: { id }, data });
  }

  async deletePosition(id: string): Promise<Position> {
    return this.prisma.position.delete({ where: { id } });
  }

  // ─── Sectors ───────────────────────────────────────────────────────────────

  async findSectors(departmentId?: string): Promise<Sector[]> {
    return this.prisma.sector.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSector(data: Prisma.SectorCreateInput): Promise<Sector> {
    return this.prisma.sector.create({ data });
  }

  async deleteSector(id: string): Promise<Sector> {
    return this.prisma.sector.delete({ where: { id } });
  }

  // ─── Employment Types ──────────────────────────────────────────────────────

  async findEmploymentTypes(): Promise<EmploymentType[]> {
    return this.prisma.employmentType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createEmploymentType(data: Prisma.EmploymentTypeCreateInput): Promise<EmploymentType> {
    return this.prisma.employmentType.create({ data });
  }
}
