import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IpRestrictionModeDto {
  DISABLED = 'DISABLED',
  ALLOWLIST = 'ALLOWLIST',
  BLOCKLIST = 'BLOCKLIST',
}

export class RateLimitPolicyDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ default: 5, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  maxAttempts: number;

  @ApiProperty({ default: 900, description: 'Sliding window in seconds' })
  @IsInt()
  @Min(10)
  @Max(86400)
  windowSeconds: number;

  @ApiProperty({ default: 900, description: 'Lockout duration in seconds' })
  @IsInt()
  @Min(10)
  @Max(86400)
  lockoutSeconds: number;
}

export class IpRestrictionPolicyDto {
  @ApiProperty({ enum: IpRestrictionModeDto, default: IpRestrictionModeDto.DISABLED })
  @IsEnum(IpRestrictionModeDto)
  mode: IpRestrictionModeDto;

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  allowlist: string[];

  @ApiProperty({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  blocklist: string[];
}

export class DomainRestrictionPolicyDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    type: [String],
    description: 'Allowed domains (e.g. invaestate.com, hr.invaestate.com)',
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  allowedDomains: string[];

  @ApiPropertyOptional({
    description: 'Mapping of service keys to allowed domains (e.g. {"hr-service": ["hr.invaestate.com"]})',
    example: { 'hr-service': ['hr.invaestate.com'] },
  })
  @IsOptional()
  @IsObject()
  serviceDomainMap?: Record<string, string[]>;
}

export class SessionPolicyDto {
  @ApiProperty({ default: 900, description: 'Access token TTL in seconds' })
  @IsInt()
  @Min(60)
  @Max(86400 * 30)
  accessTokenTtl: number;

  @ApiProperty({ default: 604800, description: 'Refresh token TTL in seconds' })
  @IsInt()
  @Min(300)
  @Max(86400 * 365)
  refreshTokenTtl: number;

  @ApiProperty({ default: 0, description: 'Max concurrent sessions (0 = unlimited)' })
  @IsInt()
  @Min(0)
  @Max(100)
  maxConcurrentSessions: number;
}

export class UpdateSecurityPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: any;

  @ApiPropertyOptional()
  @IsOptional()
  updatedBy?: any;

  @ApiPropertyOptional({ type: RateLimitPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitPolicyDto)
  rateLimit?: RateLimitPolicyDto;

  @ApiPropertyOptional({ type: IpRestrictionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IpRestrictionPolicyDto)
  ipRestriction?: IpRestrictionPolicyDto;

  @ApiPropertyOptional({ type: DomainRestrictionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DomainRestrictionPolicyDto)
  domainRestriction?: DomainRestrictionPolicyDto;

  @ApiPropertyOptional({ type: SessionPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SessionPolicyDto)
  session?: SessionPolicyDto;
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;
}
