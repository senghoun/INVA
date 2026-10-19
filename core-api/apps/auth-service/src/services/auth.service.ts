import { MfaService } from './mfa.service';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID, randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from '../security/passwords';
import { AuthRepository, UserWithRoles } from '../repositories/auth.repository';
import { CompleteTemporaryPasswordDto, PasswordChangeRequiredDto } from '../dto/temporary-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import {
  UserResponseDto,
  PaginatedUsersResponseDto,
} from '../dto/user-response.dto';
import {
  CreateRoleDto,
  RoleResponseDto,
} from '../dto/role.dto';
import { JwtPayload } from '@common';
import { SecurityPolicyService } from './security-policy.service';
import { Prisma } from '@prisma/client-auth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly policyService: SecurityPolicyService,
    private readonly mfaService: MfaService,
  ) {}

  // ─── Authentication & Session Flow ───────────────────────────────────────

  async login(dto: LoginDto): Promise<TokenResponseDto | PasswordChangeRequiredDto | Awaited<ReturnType<MfaService['challenge']>>> {
    const user = dto.phone !== undefined
      ? await this.authRepository.findByPhone(dto.phone)
      : await this.authRepository.findByEmail(dto.email!);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    const passwordValid = await verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    if (user.mustChangePassword) {
      if (!user.temporaryPasswordExpiresAt || user.temporaryPasswordExpiresAt <= new Date()) {
        throw new UnauthorizedException('Temporary password expired. Ask an administrator to reset it.');
      }
      return {
        requiresPasswordChange: true,
        passwordChangeToken: this.jwtService.sign({ sub: user.id, type: 'password-change', version: this.hashToken(user.passwordHash) }, { expiresIn: 600, audience: 'password-change' }),
        expiresIn: 600,
      };
    }

    if (user.passwordHash.startsWith('$2')) {
      const upgraded = await hashPassword(dto.password);
      if (!await this.authRepository.upgradePasswordHash(user.id, user.passwordHash, upgraded)) throw new UnauthorizedException('Account changed. Sign in again.');
      user.passwordHash = upgraded;
    }
    if (user.mfaEnabled) return this.mfaService.challenge(user.id);
    return this.issueTokens(user);
  }

  async verifyMfa(sessionToken: string, code: string) {
    const verified = await this.mfaService.verify(sessionToken, code);
    const user = await this.authRepository.findById(verified.userId);
    if (!user?.isActive || user.mustChangePassword || user.passwordHash !== verified.passwordHash) throw new UnauthorizedException();
    return this.issueTokens(user, true);
  }

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    if (this.config.get<string>('PUBLIC_REGISTRATION_ENABLED') !== 'true') throw new ForbiddenException('Public registration is disabled.');
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    const passwordHash = await hashPassword(dto.password);

    const created = await this.authRepository.create({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      userType: 'EXTERNAL', // default public signup is EXTERNAL
      isActive: true,
      mfaEnabled: false,
    });

    const userWithRoles = await this.authRepository.findByIdWithRoles(created.id);
    this.logger.log(`New user registered: ${dto.email}`);
    return this.mapToUserResponse(userWithRoles!);
  }

  async refresh(rawRefreshToken: string): Promise<TokenResponseDto> {
    let decoded: { sub: string; type: string; jti: string };
    try {
      decoded = this.jwtService.verify<{ sub: string; type: string; jti: string }>(rawRefreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        algorithms: ['HS256'], issuer: 'inva-auth', audience: 'inva-refresh',
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (decoded.type !== 'refresh' || !decoded.sub || !decoded.jti) throw new UnauthorizedException('Invalid refresh token.');
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.authRepository.findValidRefreshToken(
      decoded.sub,
      tokenHash,
    );

    if (!stored) {
      throw new UnauthorizedException('Refresh token has been revoked or expired.');
    }

    // Rotate: revoke the used token and issue a new pair
    if (!await this.authRepository.consumeRefreshToken(stored.id)) {
      throw new UnauthorizedException('Refresh token already used.');
    }

    const user = await this.authRepository.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is no longer active.');
    }

    if (user.mustChangePassword) throw new UnauthorizedException('Password change required. Please sign in again.');
    if (user.mfaEnabled && !stored.mfaVerified) throw new ForbiddenException('MFA verification required.');
    return this.issueTokens(user, stored.mfaVerified, stored.authenticationAt);
  }

  async logout(userId: string, refreshToken: string, sid?: string): Promise<void> {
    if (sid && await this.authRepository.findActiveSession(userId, sid)) await this.authRepository.revokeRefreshToken(sid);
    const tokenHash = this.hashToken(refreshToken);
    await this.authRepository.revokeRefreshTokenByHash(userId, tokenHash);
    this.logger.log(`User ${userId} logged out. Token revoked.`);
  }

  async listSessions(userId: string, currentId?: string) {
    return (await this.authRepository.listSessions(userId)).map(session => ({ ...session, current: session.id === currentId }));
  }

  async revokeSession(userId: string, id: string) {
    await this.authRepository.revokeOwnSession(userId, id);
    return { message: 'Session revoked.' };
  }

  async revokeSessions(userId: string) {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
    return { message: 'All sessions revoked.' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const passwordValid = await verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new BadRequestException('Current password does not match.');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.authRepository.update(userId, {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
      temporaryPasswordExpiresAt: null,
    }, true);
    this.logger.log(`User ${userId} changed password. All sessions revoked.`);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // ─── User Administration (Admin CRUD) ────────────────────────────────────

  async listUsers(query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = ['email', 'phone', 'firstName', 'lastName'].map(field => ({ [field]: { contains: query.search, mode: 'insensitive' } }));
    }

    if (query.userType) {
      where.userType = query.userType;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      this.authRepository.findManyWithPagination({
        skip,
        take: limit,
        where,
      }),
      this.authRepository.countUsers(where),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: users.map((u) => this.mapToUserResponse(u)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.authRepository.findByIdWithRoles(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return this.mapToUserResponse(user);
  }

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = dto.email ? await this.authRepository.findByEmail(dto.email) : null;
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    if (dto.roleIds && dto.roleIds.length > 0) {
      for (const roleId of dto.roleIds) {
        const role = await this.authRepository.findRoleById(roleId);
        if (!role || !role.isActive) {
          throw new NotFoundException(`Active role with ID "${roleId}" not found.`);
        }
      }
    }

    const passwordHash = await hashPassword(dto.password);

    const created = await this.authRepository.createUserWithRoles(
      {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        image: dto.image,
        language: dto.language,
        passwordHash,
        userType: dto.userType || 'INTERNAL',
        isActive: true,
        mfaEnabled: false,
      },
      dto.roleIds || [],
    );

    this.logger.log(`Admin created user: ${created.email} (${created.id})`);
    return this.mapToUserResponse(created);
  }

  async updateUser(id: string, dto: UpdateUserDto, actorId?: string): Promise<UserResponseDto> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.authRepository.findByEmail(dto.email);
      if (conflict) {
        throw new ConflictException(`Email "${dto.email}" is already in use.`);
      }
    }

    if (dto.phone !== undefined && dto.phone !== null && dto.phone !== user.phone) {
      const conflict = await this.authRepository.findByPhone(dto.phone);
      if (conflict) throw new ConflictException('Phone is already registered.');
    }

    if (id === actorId && (dto.isActive === false || dto.userType === 'EXTERNAL')) {
      throw new ForbiddenException('You cannot suspend or demote your own administrator account.');
    }
    if (dto.phone === null && !(dto.email || user.email)) throw new BadRequestException('A phone-only account must retain its login phone.');
    const updateData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.userType !== undefined) updateData.userType = dto.userType;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;


    const revokeSessions = dto.isActive === false ||
      (dto.phone !== undefined && dto.phone !== user.phone) ||
      (dto.userType !== undefined && dto.userType !== user.userType) ||
      (dto.email !== undefined && dto.email !== user.email);
    const updated = await this.authRepository.update(id, updateData, revokeSessions);
    this.logger.log(`Updated user ${id}.`);
    return this.mapToUserResponse(updated);
  }

  async resetUserPassword(id: string, actorId: string) {
    if (id === actorId) throw new ForbiddenException('Use change password for your own account.');
    const user = await this.authRepository.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    const temporaryPassword = `Tmp!${randomBytes(18).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.authRepository.update(id, {
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      temporaryPasswordExpiresAt: expiresAt,
    }, true);
    return { temporaryPassword, expiresAt: expiresAt.toISOString() };
  }

  async completeTemporaryPassword(dto: CompleteTemporaryPasswordDto) {
    let payload: { sub: string; type: string; version: string };
    try {
      payload = this.jwtService.verify(dto.passwordChangeToken, { algorithms: ['HS256'], issuer: 'inva-auth', audience: 'password-change' });
    } catch { throw new UnauthorizedException('Password change session expired. Sign in again.'); }
    if (payload.type !== 'password-change' || !payload.sub) throw new UnauthorizedException();
    const user = await this.authRepository.findById(payload.sub);
    if (!user?.isActive || !user.mustChangePassword || !user.temporaryPasswordExpiresAt || user.temporaryPasswordExpiresAt <= new Date() || payload.version !== this.hashToken(user.passwordHash)) {
      throw new UnauthorizedException('Password change session is no longer valid. Sign in again.');
    }
    if (await verifyPassword(dto.newPassword, user.passwordHash)) throw new BadRequestException('Choose a password different from the temporary password.');
    const changed = await this.authRepository.completeTemporaryPassword(user.id, user.passwordHash, await hashPassword(dto.newPassword));
    if (!changed) throw new UnauthorizedException('Password change session is no longer valid. Sign in again.');
    return { message: 'Password changed. Sign in with your new password.', userId: user.id, email: user.email };
  }

  async deleteUser(id: string, actorId?: string): Promise<UserResponseDto> {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    if (id === actorId) throw new ForbiddenException('You cannot deactivate your own account.');
    const deactivated = await this.authRepository.delete(id);
    this.logger.log(`Deactivated user ${id} (${user.email}).`);
    const fullUser = await this.authRepository.findByIdWithRoles(deactivated.id);
    return this.mapToUserResponse(fullUser!);
  }

  // ─── Role & Permission Management (RBAC CRUD) ─────────────────────────────

  async listRoles(includeInactive = false): Promise<RoleResponseDto[]> {
    const roles = await this.authRepository.findAllRoles(includeInactive);
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
      createdAt: r.createdAt,
    }));
  }

  async createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const roleName = dto.name.toUpperCase().trim();
    const existing = await this.authRepository.findRoleByName(roleName);
    if (existing) {
      throw new ConflictException(`Role "${roleName}" already exists.`);
    }

    const created = await this.authRepository.createRole({
      name: roleName,
      description: dto.description,
      isActive: true,
    });

    this.logger.log(`Role created: ${created.name}`);
    return {
      id: created.id,
      name: created.name,
      description: created.description,
      isActive: created.isActive,
      createdAt: created.createdAt,
    };
  }

  async deleteRole(id: string): Promise<RoleResponseDto> {
    const role = await this.authRepository.findRoleById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    if (role.name.toUpperCase() === 'ADMIN') throw new ForbiddenException('The ADMIN role cannot be deactivated.');
    const deactivated = await this.authRepository.deleteRole(id);
    this.logger.log(`Deactivated role: ${role.name} (${id})`);
    return {
      id: deactivated.id,
      name: deactivated.name,
      description: deactivated.description,
      isActive: deactivated.isActive,
      createdAt: deactivated.createdAt,
    };
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
  ): Promise<UserResponseDto> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }

    const role = await this.authRepository.findRoleById(roleId);
    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found.`);
    }

    await this.authRepository.assignRole(userId, roleId);
    const updatedUser = await this.authRepository.findByIdWithRoles(userId);
    return this.mapToUserResponse(updatedUser!);
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    actorId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }

    const role = await this.authRepository.findRoleById(roleId);
    if (userId === actorId && role?.name === 'ADMIN') throw new ForbiddenException('You cannot remove your own ADMIN role.');
    await this.authRepository.removeRole(userId, roleId);
    const updatedUser = await this.authRepository.findByIdWithRoles(userId);
    return this.mapToUserResponse(updatedUser!);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private mapToUserResponse(user: UserWithRoles): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      gender: user.gender,
      image: user.image,
      language: user.language,
      telegramRecoveryLinked: !!user.telegramChatId,
      userType: user.userType,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled,
      roles: user.userRoles ? user.userRoles.filter(ur => ur.role.isActive).map((ur) => ur.role.name) : [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async issueTokens(user: { id: string; email: string | null; userType: JwtPayload['userType']; passwordHash?: string }, mfaVerified = false, authenticationAt = new Date()): Promise<TokenResponseDto> {
    const policy = await this.policyService.getPolicy();
    const sid = randomUUID();
    const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      algorithm: 'HS256', audience: 'inva-refresh', jwtid: sid, expiresIn: policy.session.refreshTokenTtl,
    });
    const roles = await this.authRepository.findRolesByUserId(user.id);
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email,
      userType: user.userType, roles, orgId: null, type: 'access', sid },
      { algorithm: 'HS256', expiresIn: policy.session.accessTokenTtl });
    const expiresAt = new Date(Date.now() + policy.session.refreshTokenTtl * 1000);
    await this.authRepository.createSession(user.id, sid, this.hashToken(refreshToken), expiresAt, policy.session.maxConcurrentSessions, { mfaVerified: !!mfaVerified, authenticationAt: authenticationAt || new Date(), expectedPasswordHash: user.passwordHash });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: policy.session.accessTokenTtl };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
