import { jsonStringArray } from '@common';
import { HR_COMPANY_PERMISSION } from './hr-company.guard';
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HrPrismaService } from '../database/hr-prisma.service';

export const HR_ACCESS = 'hr-access';
export interface HrAccessRule { any: string[]; self?: string; }
export const HrPermission = (...any: string[]) => SetMetadata(HR_ACCESS, { any });
export const HrSelfPermission = (self: string, ...any: string[]) => SetMetadata(HR_ACCESS, { any, self });

@Injectable()
export class HrPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: HrPrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.get<HrAccessRule>(HR_ACCESS, context.getHandler());
    if (!rule) throw new ForbiddenException('No HR permission policy defined.');
    const req = context.switchToHttp().getRequest();
    const actor = req.user;
    if (!actor || actor.userType !== 'INTERNAL') throw new ForbiddenException('Internal account required.');
    const employee = await this.prisma.employeeProfile.findUnique({ where: { authUserId: actor.sub }, include: { hrRoles: { include: { role: true } } } });
    const permissions: string[] = employee?.isActive ? [...new Set(employee.hrRoles.flatMap(r => jsonStringArray(r.role.permissions)))] : [];
    actor.employeeId = employee?.id || null;
    actor.permissions = permissions;
    const globalRoles = actor.roles.map((r: string) => r.toUpperCase());
    const administrator = globalRoles.includes('ADMIN');
    // Only central administrators may change login-account links, even through generic employee writes.
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'authUserId') && !administrator) {
      throw new ForbiddenException('Only an Auth administrator can link login accounts.');
    }
    const companyPermission = this.reflector.get<string | string[]>(HR_COMPANY_PERMISSION, context.getHandler());
    if (companyPermission) {
      if (employee && !employee.isActive) throw new ForbiddenException('Employee account is inactive.');
      if (!(Array.isArray(companyPermission) ? companyPermission : [companyPermission]).some(value => actor.companyScope?.permissions.includes(value))) throw new ForbiddenException('Select a company with the required permission.');
      return true; // The method guard and scoped repository enforce company/branch policy.
    }
    if (administrator) return true;
    if (employee && !employee.isActive) throw new ForbiddenException('Employee account is inactive.');
    if (globalRoles.includes('HR_ADMIN')) return true;
    if (rule.any.length === 0 && !rule.self) return true; // Own access summary only.
    if (req.method === 'GET' && globalRoles.includes('AUDITOR')) return true;
    if (rule.any.some(p => permissions.includes(p))) return true;
    if (rule.self && permissions.includes(rule.self) && employee?.isActive) {
      if (req.body != null && (typeof req.body !== 'object' || Array.isArray(req.body))) throw new BadRequestException('Request body must be an object.');
      // Apply ownership on the server before DTO transformation/handler execution.
      for (const source of [req.body, req.query]) {
        if (source?.employeeId && source.employeeId !== employee.id) throw new ForbiddenException('You may access only your own employee records.');
      }
      if (req.method === 'GET') { req.query ||= {}; req.query.employeeId = employee.id; }
      else { req.body ||= {}; req.body.employeeId = employee.id; }
      return true;
    }
    throw new ForbiddenException('Your assigned HR roles do not permit this action.');
  }
}
