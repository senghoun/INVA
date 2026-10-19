import { jsonStringArray } from '@common';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HrPrismaService } from '../database/hr-prisma.service';
import { JwtPayload } from '@common';
import { IsArray, IsUUID, ArrayUnique, ArrayMaxSize, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeAccessDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayUnique() @ArrayMaxSize(50) @IsUUID('4', { each: true })
  roleIds!: string[];

  @ApiPropertyOptional({ nullable: true, description: 'Auth administrator only; null unlinks the account' })
  @ValidateIf((_o, value) => value !== undefined && value !== null) @IsUUID('4')
  authUserId?: string | null;
}

@Injectable()
export class EmployeeAccessService {
  constructor(private readonly prisma: HrPrismaService, private readonly config: ConfigService) {}
  async get(id: string) {
    const employee = await this.prisma.employeeProfile.findUnique({ where: { id }, include: { hrRoles: { include: { role: true } } } });
    if (!employee) throw new NotFoundException('Employee not found.');
    return { employeeId: id, authUserId: employee.authUserId, isActive: employee.isActive, roles: employee.hrRoles.map(r => r.role), permissions: [...new Set(employee.hrRoles.flatMap(r => jsonStringArray(r.role.permissions)))] };
  }
  async update(id: string, dto: EmployeeAccessDto, actor: JwtPayload, authorization: string) {
    const current = await this.get(id);
    if (dto.authUserId !== undefined) {
      if (!actor.roles.includes('ADMIN')) throw new ForbiddenException('Only an Auth administrator can link accounts.');
      if (dto.authUserId) {
        let response: Response;
        try { response = await fetch(`${this.config.get('AUTH_SERVICE_URL', 'http://127.0.0.1:3001')}/api/v1/auth/users/${dto.authUserId}`, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(3000) }); }
        catch { throw new ServiceUnavailableException('Login account verification unavailable.'); }
        if (response.status === 404) throw new BadRequestException('Login account does not exist.');
        if (!response.ok) throw new ForbiddenException('Unable to verify this login account.');
        const account = await response.json();
        if (!account.isActive || account.userType !== 'INTERNAL') throw new BadRequestException('Select an active internal login account.');
      }
    }
    if (!actor.roles.includes('ADMIN') && !actor.roles.includes('HR_ADMIN') && current.authUserId === actor.sub) throw new ForbiddenException('You cannot change your own HR role assignments.');
    if (await this.prisma.hrRole.count({ where: { id: { in: dto.roleIds } } }) !== dto.roleIds.length) throw new BadRequestException('One or more HR roles no longer exist.');
    try {
      await this.prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM employee_profiles WHERE id = ${id}::uuid FOR UPDATE`;
        if (dto.authUserId !== undefined) await tx.employeeProfile.update({ where: { id }, data: { authUserId: dto.authUserId } });
        await tx.employeeHrRole.deleteMany({ where: { employeeId: id } });
        await tx.employeeHrRole.createMany({ data: dto.roleIds.map(roleId => ({ employeeId: id, roleId })) });
      }, { isolationLevel: 'ReadCommitted' });
    } catch (error) {
      if ((error as {code?: string}).code === 'P2003') throw new ConflictException('Employee or role changed. Reload access and try again.');
      if ((error as {code?: string}).code === 'P2002') throw new ConflictException('This login account is already linked to another employee.');
      throw error;
    }
    return this.get(id);
  }
}
