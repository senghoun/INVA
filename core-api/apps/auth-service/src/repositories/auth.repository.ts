import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { User, Role, Prisma } from '@prisma/client-auth';

export type UserWithRoles = User & {
  userRoles: { role: Role }[];
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: AuthPrismaService) {}

  // ─── User Queries ──────────────────────────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  private uniqueConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Email or phone is already registered.');
    }
    throw error;
  }

  async upgradePasswordHash(id: string, previousHash: string, passwordHash: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({ where: { id, passwordHash: previousHash, isActive: true, mustChangePassword: false }, data: { passwordHash } });
    return result.count === 1;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findManyWithPagination(params: {
    skip: number;
    take: number;
    where: Prisma.UserWhereInput;
  }): Promise<UserWithRoles[]> {
    return this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async countUsers(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data }).catch(error => this.uniqueConflict(error));
  }

  async createUserWithRoles(
    data: Prisma.UserCreateInput,
    roleIds: string[] = [],
  ): Promise<UserWithRoles> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
    }, { isolationLevel: 'ReadCommitted' }).catch(error => this.uniqueConflict(error));
  }

  async update(id: string, data: Prisma.UserUpdateInput, revokeSessions = false): Promise<UserWithRoles> {
    return this.prisma.$transaction(async (tx) => {
      // Use the same per-account lock as session issuance.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
      const updated = await tx.user.update({
        where: { id }, data,
        include: { userRoles: { include: { role: true } } },
      });
      if (data.passwordHash || data.isActive === false) {
        await tx.authChallenge.updateMany({ where: { userId: id, usedAt: null }, data: { usedAt: new Date() } });
        await tx.mfaCredential.deleteMany({ where: { userId: id, verifiedAt: null } });
      }
      if (revokeSessions) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return updated;
    }, { isolationLevel: 'ReadCommitted' }).catch(error => this.uniqueConflict(error));
  }

  async completeTemporaryPassword(id: string, previousHash: string, passwordHash: string): Promise<boolean> {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
      const changed = await tx.user.updateMany({
        where: { id, isActive: true, passwordHash: previousHash, mustChangePassword: true, temporaryPasswordExpiresAt: { gt: new Date() } },
        data: { passwordHash, mustChangePassword: false, temporaryPasswordExpiresAt: null },
      });
      if (changed.count !== 1) return false;
      await tx.authChallenge.updateMany({ where: { userId: id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.mfaCredential.deleteMany({ where: { userId: id, verifiedAt: null } });
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return true;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async delete(id: string): Promise<User> {
    return this.update(id, { isActive: false }, true);
  }

  // ─── Role & Permissions ────────────────────────────────────────────────────

  async findRolesByUserId(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { isActive: true },
      },
      include: { role: { select: { name: true } } },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  async findAllRoles(includeInactive = false): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findRoleById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async createRole(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({ data });
  }

  async deleteRole(id: string): Promise<Role> {
    // Soft-delete: update to inactive instead of removing the record
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }

  async removeRole(userId: string, roleId: string) {
    return this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }

  // ─── Refresh Tokens & Session Management ───────────────────────────────────

  async storeRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findValidRefreshToken(userId: string, tokenHash: string) {
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const targetBuffer = Buffer.from(tokenHash, 'hex');
    for (const token of activeTokens) {
      const candidateBuffer = Buffer.from(token.tokenHash, 'hex');
      if (
        candidateBuffer.length === targetBuffer.length &&
        timingSafeEqual(candidateBuffer, targetBuffer)
      ) {
        return token;
      }
    }

    return null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokenByHash(userId: string, tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async consumeRefreshToken(id: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    return result.count === 1;
  }

  async findActiveSession(userId: string, id: string) {
    return this.prisma.refreshToken.findFirst({
      where: { id, userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async createSession(userId: string, id: string, tokenHash: string, expiresAt: Date, maxSessions: number, assurance?: { mfaVerified: boolean; authenticationAt: Date; expectedPasswordHash?: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Serialize issuance per user so concurrent logins cannot exceed the limit.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user?.isActive || user.mustChangePassword || (user.mfaEnabled && !assurance?.mfaVerified) || (assurance?.expectedPasswordHash && assurance.expectedPasswordHash !== user.passwordHash)) throw new UnauthorizedException('Account changed. Sign in again.');
      if (maxSessions > 0) {
        const sessions = await tx.refreshToken.findMany({
          where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: maxSessions - 1,
        });
        await tx.refreshToken.updateMany({
          where: { id: { in: sessions.map(s => s.id) } },
          data: { revokedAt: new Date() },
        });
      }
      await tx.refreshToken.create({ data: { id, userId, tokenHash, expiresAt, ...(assurance ? { mfaVerified: assurance.mfaVerified, authenticationAt: assurance.authenticationAt } : {}) } });
    }, { isolationLevel: 'ReadCommitted' });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  findCompanyMembership(userId: string, companyId: string) {
    return this.prisma.companyMembership.findFirst({ where: { userId, companyId, isActive: true } });
  }

  listSessions(userId: string) {
    return this.prisma.refreshToken.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, expiresAt: true }, orderBy: { createdAt: 'desc' } });
  }

  async revokeOwnSession(userId: string, id: string) {
    return this.prisma.refreshToken.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
