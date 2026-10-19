import { jsonStringArray } from '@common';
import { ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { CompanyMembershipDto } from '../dto/company-membership.dto';

@Injectable()
export class CompanyAccessService {
  constructor(private readonly db: AuthPrismaService, private readonly config: ConfigService) {}
  list(userId: string, includeInactive = false) {
    return this.db.companyMembership.findMany({ where: { userId, ...(includeInactive ? {} : { isActive: true }) }, select: { companyId: true, branchIds: true, permissions: true, isActive: true }, orderBy: { companyId: 'asc' } });
  }
  private async organization(path: string, authorization: string) {
    let response: Response;
    try { response = await fetch(`${this.config.get('HR_SERVICE_URL', 'http://127.0.0.1:3002')}/api/v1/hr/organizations/${path}`, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(3000) }); }
    catch { throw new ServiceUnavailableException('Organization validation unavailable.'); }
    if (response.status === 404) throw new NotFoundException('Organization record not found.');
    if (response.status === 401 || response.status === 403) throw new ForbiddenException('Organization validation denied.');
    if (!response.ok) throw new ServiceUnavailableException('Organization validation unavailable.');
    return response.json();
  }
  async grant(userId: string, companyId: string, dto: CompanyMembershipDto, actorId: string, authorization: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.userType !== 'INTERNAL') throw new ForbiddenException('Company access requires an active internal account.');
    // Validate against the sole Organization writer; never import HR's Prisma client.
    if (dto.isActive !== false) {
      const company = await this.organization(`companies/${companyId}`, authorization);
      if (company.id !== companyId || company.status !== 'ACTIVE') throw new ForbiddenException('Company is not active.');
      for (const branchId of dto.branchIds) {
        const branch = await this.organization(`branches/${branchId}`, authorization);
        if (branch.id !== branchId || branch.companyId !== companyId || branch.status !== 'ACTIVE') throw new ForbiddenException('Branch is outside the active company.');
      }
    }
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const administrator = await tx.user.findFirst({ where: { id: actorId, isActive: true, userType: 'INTERNAL', userRoles: { some: { role: { name: 'ADMIN', isActive: true } } } } });
      if (!administrator) throw new ForbiddenException('Administrator access changed.');
      const current = await tx.user.findUnique({ where: { id: userId } });
      if (!current?.isActive || current.userType !== 'INTERNAL') throw new ForbiddenException('Account changed.');
      const membership = await tx.companyMembership.upsert({ where: { userId_companyId: { userId, companyId } },
        create: { userId, companyId, ...dto, grantedBy: actorId }, update: { ...dto, grantedBy: actorId } });
      await tx.auditLog.create({ data: { action: 'COMPANY_ACCESS_CHANGED', outcome: 'SUCCESS', ip: 'internal', details: { actorId, userId, companyId, branchIds: dto.branchIds, permissions: dto.permissions, isActive: membership.isActive } } });
      return { companyId: membership.companyId, branchIds: jsonStringArray(membership.branchIds), permissions: jsonStringArray(membership.permissions), isActive: membership.isActive };
    }, { isolationLevel: 'ReadCommitted' });
  }
}
