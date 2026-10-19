import { CompanyScope, employeeScope } from '../guards/hr-company.guard';
import { ForbiddenException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { HrPrismaService } from '../database/hr-prisma.service';
import { EmployeeProfile, Department, WorkingSchedule, Prisma } from '@prisma/client-hr';
import { EmployeeQueryDto } from '../dto/employee-query.dto';

export type EmployeeWithRelations = Prisma.EmployeeProfileGetPayload<{
  include: {
    department: true;
    company: true;
    branch: true;
    position: true;
    sector: true;
    employmentType: true;
    manager: true;
    leader: true;
    workingSchedule: true;
  };
}>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HrRepository {
  constructor(private readonly prisma: HrPrismaService) {}

  private employeeWhere(query: EmployeeQueryDto, scope?: CompanyScope): Prisma.EmployeeProfileWhereInput {
    const where: Prisma.EmployeeProfileWhereInput = scope ? employeeScope(scope) : {};

    if (query.status && query.status !== 'ALL') {
      where.isActive = query.status === 'ACTIVE';
    }

    if (query.companyId) {
      if (scope && query.companyId !== scope.companyId) throw new ForbiddenException('Company is outside your access scope.');
      where.companyId = query.companyId;
    }
    if (query.branchId) {
      if (scope?.branchIds.length && !scope.branchIds.includes(query.branchId)) throw new ForbiddenException('Branch is outside your access scope.');
      where.branchId = query.branchId;
    }
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.positionId) where.positionId = query.positionId;

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { employeeCode: { contains: s, mode: 'insensitive' } },
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { englishName: { contains: s, mode: 'insensitive' } },
        { khmerName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { jobTitle: { contains: s, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  // ─── Employee Profiles ──────────────────────────────────────────────────

  async findAllEmployees(query?: EmployeeQueryDto, scope?: CompanyScope): Promise<EmployeeProfile[]> {
    return this.prisma.employeeProfile.findMany({
      include: {
        department: true,
        company: true,
        branch: true,
        position: true,
        manager: true,
        leader: true,
      },
      where: this.employeeWhere(query || {}, scope),
      orderBy: { lastName: 'asc' },
    });
  }

  async findEmployeesPaginated(query: EmployeeQueryDto, scope?: CompanyScope): Promise<PaginatedResult<EmployeeProfile>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = this.employeeWhere(query, scope);

    const orderBy: Prisma.EmployeeProfileOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder || 'desc';

    if (['firstName', 'lastName', 'employeeCode', 'hireDate', 'createdAt'].includes(sortField)) {
      (orderBy as any)[sortField] = sortDir;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, data] = await Promise.all([
      this.prisma.employeeProfile.count({ where }),
      this.prisma.employeeProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          company: true,
          branch: true,
          department: true,
          position: true,
          sector: true,
          employmentType: true,
          manager: true,
          leader: true,
          workingSchedule: true,
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countEmployeesByStatus(scope?: CompanyScope): Promise<{ active: number; inactive: number; total: number }> {
    const whereBase: Prisma.EmployeeProfileWhereInput = scope ? employeeScope(scope) : {};

    // Single round-trip: groupBy replaces two sequential counts
    const groups = await this.prisma.employeeProfile.groupBy({
      by: ['isActive'],
      where: whereBase,
      _count: { _all: true },
    });
    let active = 0;
    let inactive = 0;
    for (const g of groups) {
      if (g.isActive) active = g._count._all;
      else inactive = g._count._all;
    }

    return {
      active,
      inactive,
      total: active + inactive,
    };
  }

  async findEmployeeById(id: string, scope?: CompanyScope): Promise<EmployeeWithRelations | null> {
    return this.prisma.employeeProfile.findFirst({
      where: { id, ...(scope ? employeeScope(scope) : {}) },
      include: {
        department: true,
        company: true,
        branch: true,
        position: true,
        sector: true,
        employmentType: true,
        manager: true,
        leader: true,
        workingSchedule: true,
      },
    });
  }

  async findEmployeeByCode(employeeCode: string): Promise<EmployeeProfile | null> {
    return this.prisma.employeeProfile.findUnique({ where: { employeeCode } });
  }

  async findEmployeeByAuthUserId(authUserId: string): Promise<EmployeeProfile | null> {
    return this.prisma.employeeProfile.findUnique({ where: { authUserId } });
  }

  async validateEmployeeReferences(data: Record<string, unknown>, scope: CompanyScope, client: Prisma.TransactionClient = this.prisma) {
    if (data.companyId && data.companyId !== scope.companyId) throw new ForbiddenException('Company is outside your access scope.');
    if (data.branchId) {
      const branch = await client.branch.findFirst({ where: { id: String(data.branchId), companyId: scope.companyId, status: 'ACTIVE', ...(scope.branchIds.length ? { id: { in: scope.branchIds.filter(id => id === data.branchId) } } : {}) } });
      if (!branch) throw new ForbiddenException('Branch is outside your active company access.');
    }
    for (const [field, model] of [['departmentId', 'department'], ['positionId', 'position'], ['sectorId', 'sector']] as const) {
      if (!data[field]) continue;
      const where = model === 'department' ? { id: String(data[field]), companyId: scope.companyId } : { id: String(data[field]), department: { companyId: scope.companyId } };
      const record = await (client[model] as any).findFirst({ where });
      if (!record) throw new ForbiddenException('Employment reference is outside the selected company.');
    }
    for (const field of ['managerId', 'leaderId']) {
      if (data[field] && !await client.employeeProfile.findFirst({ where: { id: String(data[field]), ...employeeScope(scope), isActive: true } })) throw new ForbiddenException('Reporting employee is outside your access scope.');
    }
  }

  private async lockEmploymentReferences(client: Prisma.TransactionClient, data: any, scope: CompanyScope) {
    await client.$queryRaw`SELECT id FROM companies WHERE id = ${scope.companyId}::uuid FOR SHARE`;
    if (!await client.company.findFirst({ where: { id: scope.companyId, status: 'ACTIVE' } })) throw new ForbiddenException('Company is not active.');
    const references: Record<string, unknown> = {};
    const fields: Record<string, string> = { branch: 'branches', department: 'departments', position: 'positions', sector: 'sectors', manager: 'employee_profiles', leader: 'employee_profiles' };
    for (const [relation, table] of Object.entries(fields)) {
      const id = data[relation]?.connect?.id;
      if (!id) continue;
      // Table names are fixed above; values remain bound parameters.
      await client.$queryRaw(Prisma.sql`SELECT id FROM ${Prisma.raw(table)} WHERE id = ${id}::uuid FOR SHARE`);
      references[`${relation}Id`] = id;
    }
    await this.validateEmployeeReferences(references, scope, client);
  }

  async createEmployee(
    data: Prisma.EmployeeProfileCreateInput,
    scope?: CompanyScope,
  ): Promise<EmployeeProfile> {
    return this.prisma.$transaction(async client => {
      if (scope) await this.lockEmploymentReferences(client, data, scope);
      return client.employeeProfile.create({
      data,
      include: {
        department: true,
        company: true,
        branch: true,
        position: true,
      },
    });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async updateEmployee(
    id: string,
    data: Prisma.EmployeeProfileUpdateInput,
    scope?: CompanyScope,
  ): Promise<EmployeeProfile> {
    return this.prisma.$transaction(async client => {
      if (scope) await this.lockEmploymentReferences(client, data, scope);
      return client.employeeProfile.update({
      where: { id, ...(scope ? employeeScope(scope) : {}) },
      data,
      include: {
        department: true,
        company: true,
        branch: true,
        position: true,
      },
    });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async deleteEmployee(id: string, scope?: CompanyScope): Promise<EmployeeProfile> {
    return this.prisma.employeeProfile.delete({ where: { id, ...(scope ? employeeScope(scope) : {}) } });
  }

  // ─── Departments ─────────────────────────────────────────────────────────

  async findAllDepartments(): Promise<Department[]> {
    return this.prisma.department.findMany({
      include: { children: true, company: true, branch: true },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(
    data: Prisma.DepartmentCreateInput,
  ): Promise<Department> {
    return this.prisma.department.create({ data });
  }
}
