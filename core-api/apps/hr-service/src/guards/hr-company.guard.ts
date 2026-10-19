import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HrPrismaService } from '../database/hr-prisma.service';
import { JwtPayload } from '@common';
export const HR_COMPANY_PERMISSION = 'hr-company-permission';
export const HrCompanyPermission = (permission: string | string[]) => SetMetadata(HR_COMPANY_PERMISSION, permission);
export type CompanyScope = NonNullable<JwtPayload['companyScope']>;
export function employeeScope(scope: CompanyScope) {
  return { companyId: scope.companyId, AND: [{ OR: [{ branchId: null }, { branch: { companyId: scope.companyId } }] }], ...(scope.branchIds.length ? { branchId: { in: scope.branchIds } } : {}) };
}
@Injectable()
export class HrCompanyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly db: HrPrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const actor: JwtPayload = request.user;
    const permission = this.reflector.get<string | string[]>(HR_COMPANY_PERMISSION, context.getHandler());
    const scope = actor?.companyScope;
    if (!permission || !scope || !(Array.isArray(permission) ? permission : [permission]).some(value => scope.permissions.includes(value))) throw new ForbiddenException('Select a company with the required permission.');
    const company = await this.db.company.findFirst({ where: { id: scope.companyId, status: 'ACTIVE' } });
    if (!company) throw new ForbiddenException('Company is not active.');
    const body = request.body;
    const query = request.query;
    for (const values of [body, query]) {
      if (values?.companyId && values.companyId !== scope.companyId) throw new ForbiddenException('Company is outside your access scope.');
      if (values?.branchId && scope.branchIds.length && !scope.branchIds.includes(values.branchId)) throw new ForbiddenException('Branch is outside your access scope.');
    }
    if (body != null && (typeof body !== 'object' || Array.isArray(body))) throw new BadRequestException('Request body must be an object.');
    return true;
  }
}
