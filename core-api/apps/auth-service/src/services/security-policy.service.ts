import { jsonStringArray } from '@common';
import { isIP } from 'node:net';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AuthPrismaService } from '../database/auth-prisma.service';
import {
  UpdateSecurityPolicyDto,
  AuditLogQueryDto,
  IpRestrictionModeDto,
} from '../dto/security-policy.dto';

export interface FormattedSecurityPolicy {
  id: string;
  rateLimit: {
    enabled: boolean;
    maxAttempts: number;
    windowSeconds: number;
    lockoutSeconds: number;
  };
  ipRestriction: {
    mode: 'DISABLED' | 'ALLOWLIST' | 'BLOCKLIST';
    allowlist: string[];
    blocklist: string[];
  };
  domainRestriction: {
    enabled: boolean;
    allowedDomains: string[];
    serviceDomainMap?: Record<string, string[]>;
  };
  session: {
    accessTokenTtl: number;
    refreshTokenTtl: number;
    maxConcurrentSessions: number;
  };
  updatedAt?: string;
  updatedBy?: string | null;
}

@Injectable()
export class SecurityPolicyService {
  private readonly logger = new Logger(SecurityPolicyService.name);

  constructor(private readonly prisma: AuthPrismaService) {}

  /**
   * Fetch active security policy or initialize default row if none exists
   */
  async getPolicy(): Promise<FormattedSecurityPolicy> {
    let policy = await this.prisma.securityPolicy.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!policy) {
      this.logger.log('No SecurityPolicy found in database. Initializing default...');
      policy = await this.prisma.securityPolicy.upsert({
        where: { id: '00000000-0000-4000-8000-000000000001' },
        update: {},
        create: {
          id: '00000000-0000-4000-8000-000000000001',
          rateLimitEnabled: true,
          rateLimitMaxAttempts: 5,
          rateLimitWindowSeconds: 900,
          rateLimitLockoutSeconds: 900,
          ipRestrictionMode: 'DISABLED',
          ipAllowlist: [],
          ipBlocklist: [],
          domainRestrictionEnabled: false,
          allowedDomains: ['invaestate.com', 'inva.io'],
          serviceDomainMap: {
            'auth-service': ['*'],
            'hr-service': ['hr.invaestate.com', 'super.invaestate.com'],
            'crm-service': ['crm.invaestate.com', 'super.invaestate.com'],
            'ac-service': ['super.invaestate.com'],
            'it-service': ['super.invaestate.com'],
          },
          accessTokenTtlSeconds: 900,
          refreshTokenTtlSeconds: 604800,
          maxConcurrentSessions: 0,
        },
      });
    }

    return this.formatPolicy(policy);
  }

  /**
   * Update the active security policy in the database
   */
  async updatePolicy(
    dto: UpdateSecurityPolicyDto,
    updatedBy?: string,
    clientIp: string = '127.0.0.1',
    userAgent?: string,
  ): Promise<FormattedSecurityPolicy> {
    const domains = dto.domainRestriction;
    if (domains?.serviceDomainMap && Object.values(domains.serviceDomainMap).some(value =>
      !Array.isArray(value) || value.some(domain => typeof domain !== 'string' || !domain.trim()))) {
      throw new BadRequestException('Service domain bindings must be arrays of domain names.');
    }
    for (const rule of [...(dto.ipRestriction?.allowlist || []), ...(dto.ipRestriction?.blocklist || [])]) {
      const [address, prefix, extra] = rule.split('/');
      const family = isIP(address);
      if (!family || extra !== undefined || (prefix !== undefined &&
          (!/^\d+$/.test(prefix) || Number(prefix) > (family === 6 ? 128 : 32)))) {
        throw new BadRequestException(`Invalid IP address or CIDR: ${rule}`);
      }
    }
    if (dto.ipRestriction?.mode === 'ALLOWLIST' && !dto.ipRestriction.allowlist.length) {
      throw new BadRequestException('An allowlist must contain at least one IP address.');
    }
    const existing = await this.getPolicy();

    const dataToUpdate: any = {
      updatedBy: updatedBy || 'SUPER_ADMIN',
    };

    if (dto.rateLimit) {
      if (dto.rateLimit.enabled !== undefined) dataToUpdate.rateLimitEnabled = dto.rateLimit.enabled;
      if (dto.rateLimit.maxAttempts !== undefined) dataToUpdate.rateLimitMaxAttempts = dto.rateLimit.maxAttempts;
      if (dto.rateLimit.windowSeconds !== undefined) dataToUpdate.rateLimitWindowSeconds = dto.rateLimit.windowSeconds;
      if (dto.rateLimit.lockoutSeconds !== undefined) dataToUpdate.rateLimitLockoutSeconds = dto.rateLimit.lockoutSeconds;
    }

    if (dto.ipRestriction) {
      if (dto.ipRestriction.mode !== undefined) dataToUpdate.ipRestrictionMode = dto.ipRestriction.mode;
      if (dto.ipRestriction.allowlist !== undefined) dataToUpdate.ipAllowlist = dto.ipRestriction.allowlist;
      if (dto.ipRestriction.blocklist !== undefined) dataToUpdate.ipBlocklist = dto.ipRestriction.blocklist;
    }

    if (dto.domainRestriction) {
      if (dto.domainRestriction.enabled !== undefined) dataToUpdate.domainRestrictionEnabled = dto.domainRestriction.enabled;
      if (dto.domainRestriction.allowedDomains !== undefined) dataToUpdate.allowedDomains = dto.domainRestriction.allowedDomains;
      if (dto.domainRestriction.serviceDomainMap !== undefined) dataToUpdate.serviceDomainMap = dto.domainRestriction.serviceDomainMap;
    }

    if (dto.session) {
      if (dto.session.accessTokenTtl !== undefined) dataToUpdate.accessTokenTtlSeconds = dto.session.accessTokenTtl;
      if (dto.session.refreshTokenTtl !== undefined) dataToUpdate.refreshTokenTtlSeconds = dto.session.refreshTokenTtl;
      if (dto.session.maxConcurrentSessions !== undefined) dataToUpdate.maxConcurrentSessions = dto.session.maxConcurrentSessions;
    }

    const updated = await this.prisma.securityPolicy.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    // Record audit event
    await this.recordAuditLog({
      userEmail: updatedBy || 'system',
      action: 'SECURITY_POLICY_UPDATED',
      outcome: 'SUCCESS',
      ip: clientIp,
      userAgent,
      details: {
        updatedFields: Object.keys(dataToUpdate),
      },
    });

    return this.formatPolicy(updated);
  }

  /**
   * Query security audit logs with pagination and filters
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    if (query.from && query.to && new Date(query.from) > new Date(query.to)) throw new BadRequestException('Start date must precede end date.');
    const where: any = {};

    if (query.userEmail) {
      where.userEmail = { contains: query.userEmail, mode: 'insensitive' };
    }
    if (query.ip) {
      where.ip = { contains: query.ip, mode: 'insensitive' };
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.outcome) {
      where.outcome = query.outcome;
    }
    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        userEmail: l.userEmail,
        action: l.action,
        outcome: l.outcome,
        ip: l.ip,
        country: l.country,
        userAgent: l.userAgent,
        details: l.details,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Log an audit event
   */
  async recordAuditLog(entry: {
    userEmail?: string;
    action: string;
    outcome: string;
    ip: string;
    country?: string;
    userAgent?: string;
    details?: any;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userEmail: entry.userEmail,
          action: entry.action,
          outcome: entry.outcome,
          ip: entry.ip || '127.0.0.1',
          country: entry.country,
          userAgent: entry.userAgent,
          details: entry.details,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to record audit log: ${err?.message}`);
    }
  }

  private formatPolicy(p: any): FormattedSecurityPolicy {
    return {
      id: p.id,
      rateLimit: {
        enabled: p.rateLimitEnabled,
        maxAttempts: p.rateLimitMaxAttempts,
        windowSeconds: p.rateLimitWindowSeconds,
        lockoutSeconds: p.rateLimitLockoutSeconds,
      },
      ipRestriction: {
        mode: (p.ipRestrictionMode as any) || 'DISABLED',
        allowlist: jsonStringArray(p.ipAllowlist) || [],
        blocklist: jsonStringArray(p.ipBlocklist) || [],
      },
      domainRestriction: {
        enabled: p.domainRestrictionEnabled,
        allowedDomains: jsonStringArray(p.allowedDomains) || [],
        serviceDomainMap: p.serviceDomainMap as Record<string, string[]> | undefined,
      },
      session: {
        accessTokenTtl: p.accessTokenTtlSeconds,
        refreshTokenTtl: p.refreshTokenTtlSeconds,
        maxConcurrentSessions: p.maxConcurrentSessions,
      },
      updatedAt: p.updatedAt?.toISOString ? p.updatedAt.toISOString() : p.updatedAt,
      updatedBy: p.updatedBy,
    };
  }
}
