import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HrPrismaService } from '../database/hr-prisma.service';
import {
  UpdateHrConfigDto,
  CreateHrRoleDto,
  UpdateHrRoleDto,
} from '../dto/hr-config.dto';

const STANDARD_HR_ROLES = [
  {
    name: 'HR_ADMIN',
    description: 'Full administrative control over all HR modules, policies, and payroll',
    isSystem: true,
    permissions: [
      'hr:employees:read',
      'hr:employees:write',
      'hr:employees:delete',
      'hr:attendance:read',
      'hr:attendance:write',
      'hr:organizations:read',
      'hr:organizations:write',
      'hr:departments:manage',
      'hr:leaves:manage',
      'hr:leaves:approve',
      'hr:payroll:manage',
      'hr:payroll:execute',
      'hr:roles:manage',
      'hr:config:manage',
    ],
  },
  {
    name: 'HR_MANAGER',
    description: 'Department oversight, employee reviews, and leave approvals',
    isSystem: true,
    permissions: [
      'hr:employees:read',
      'hr:employees:write',
      'hr:departments:manage',
      'hr:leaves:manage',
      'hr:leaves:approve',
      'hr:payroll:read',
    ],
  },
  {
    name: 'RECRUITER',
    description: 'Talent acquisition, job postings, and onboarding',
    isSystem: true,
    permissions: [
      'hr:employees:read',
      'hr:employees:write',
      'hr:departments:read',
    ],
  },
  {
    name: 'PAYROLL_OFFICER',
    description: 'Payroll processing, tax adjustments, and salary records',
    isSystem: true,
    permissions: [
      'hr:employees:read',
      'hr:payroll:manage',
      'hr:payroll:execute',
      'hr:payroll:read',
    ],
  },
  {
    name: 'EMPLOYEE',
    description: 'Self-service portal: view personal profile, request leave, and download payslips',
    isSystem: true,
    permissions: [
      'hr:self:read',
      'hr:attendance:clock',
      'hr:leaves:request',
      'hr:payroll:view_own',
    ],
  },
];

@Injectable()
export class HrConfigService {
  private readonly logger = new Logger(HrConfigService.name);

  constructor(private readonly prisma: HrPrismaService) {}

  // ─── HR Configuration ─────────────────────────────────────────────────────

  async getConfig() {
    let config = await this.prisma.hrConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      this.logger.log('Initializing default HR Configuration in inva_hr_db...');
      config = await this.prisma.hrConfig.create({
        data: {
          portalDomain: 'hr.invaestate.com',
          portalTitle: 'INVA HR Portal',
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          dailyWorkHours: 8.0,
          clockInGraceMinutes: 15,
          annualLeaveDays: 18,
          sickLeaveDays: 14,
          allowLeaveCarryover: true,
          payrollFrequency: 'MONTHLY',
          payrollCutoffDay: 25,
          currency: 'USD',
          updatedBy: 'SYSTEM',
        },
      });
    }

    return config;
  }

  async updateConfig(dto: UpdateHrConfigDto, updatedBy?: string) {
    const existing = await this.getConfig();

    const dataToUpdate: any = {
      updatedBy: updatedBy || 'SUPER_ADMIN',
    };

    if (dto.portalDomain !== undefined) dataToUpdate.portalDomain = dto.portalDomain;
    if (dto.portalTitle !== undefined) dataToUpdate.portalTitle = dto.portalTitle;
    if (dto.workDays !== undefined) dataToUpdate.workDays = dto.workDays;
    if (dto.dailyWorkHours !== undefined) dataToUpdate.dailyWorkHours = dto.dailyWorkHours;
    if (dto.clockInGraceMinutes !== undefined) dataToUpdate.clockInGraceMinutes = dto.clockInGraceMinutes;
    if (dto.annualLeaveDays !== undefined) dataToUpdate.annualLeaveDays = dto.annualLeaveDays;
    if (dto.sickLeaveDays !== undefined) dataToUpdate.sickLeaveDays = dto.sickLeaveDays;
    if (dto.allowLeaveCarryover !== undefined) dataToUpdate.allowLeaveCarryover = dto.allowLeaveCarryover;
    if (dto.payrollFrequency !== undefined) dataToUpdate.payrollFrequency = dto.payrollFrequency;
    if (dto.payrollCutoffDay !== undefined) dataToUpdate.payrollCutoffDay = dto.payrollCutoffDay;
    if (dto.currency !== undefined) dataToUpdate.currency = dto.currency;

    return this.prisma.hrConfig.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });
  }

  // ─── HR Domain Roles & Permissions ────────────────────────────────────────

  async getRoles() {
    let roles = await this.prisma.hrRole.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (roles.length === 0) {
      this.logger.log('Seeding standard HR Roles into inva_hr_db...');
      for (const roleDef of STANDARD_HR_ROLES) {
        await this.prisma.hrRole.create({ data: roleDef });
      }
      roles = await this.prisma.hrRole.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return roles;
  }

  async createRole(dto: CreateHrRoleDto) {
    const name = dto.name.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.hrRole.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Role with name "${name}" already exists.`);
    }

    return this.prisma.hrRole.create({
      data: {
        name,
        description: dto.description || null,
        permissions: dto.permissions || [],
        isSystem: false,
      },
    });
  }

  async updateRole(id: string, dto: UpdateHrRoleDto) {
    const role = await this.prisma.hrRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`HR Role with ID ${id} not found.`);
    }

    const dataToUpdate: any = {};
    if (dto.name && !role.isSystem) {
      dataToUpdate.name = dto.name.trim().toUpperCase().replace(/\s+/g, '_');
    }
    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description;
    }
    if (dto.permissions !== undefined) {
      dataToUpdate.permissions = dto.permissions;
    }

    return this.prisma.hrRole.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.hrRole.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`HR Role with ID ${id} not found.`);
    }
    if (role.isSystem) {
      throw new BadRequestException('Standard system roles cannot be deleted.');
    }

    return this.prisma.hrRole.delete({ where: { id } });
  }
}
