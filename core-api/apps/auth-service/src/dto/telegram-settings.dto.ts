import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsInt, IsIP, IsString, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CLIENT_BROWSERS, CLIENT_OS, ClientContext } from '@common/monitoring/client-context';
const present = (_: unknown, value: unknown) => value !== undefined;
export const MONITORING_SERVICES: [string, ...string[]] = ['api-gateway', 'auth-service', 'hr-service', 'crm-service', 'ac-service', 'it-service'];
export const TELEGRAM_EVENT_KINDS = ['http_error', 'logged_error', 'startup_failure', 'rate_limit', 'ip_block', 'domain_block', 'suspicious_probe', 'repeated_rejections'] as const;

export class TelegramTopicRouteDto {
  @IsIn([...MONITORING_SERVICES, '*']) service!: string;
  @IsIn([...TELEGRAM_EVENT_KINDS, '*']) kind!: typeof TELEGRAM_EVENT_KINDS[number] | '*';
  @IsInt() @Min(1) @Max(2147483647) messageThreadId!: number;
}
export class TelegramTestTargetDto {
  @ValidateIf(present) @IsIn(MONITORING_SERVICES) service?: string;
  @ValidateIf(present) @IsIn(TELEGRAM_EVENT_KINDS) kind?: typeof TELEGRAM_EVENT_KINDS[number];
}

export class UpdateTelegramSettingsDto {
  @ApiPropertyOptional() @ValidateIf(present) @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @ValidateIf(present) @IsBoolean() commandsEnabled?: boolean;
  @ApiPropertyOptional({ type: [String] }) @ValidateIf(present) @IsArray() @ArrayMaxSize(20) @ArrayUnique()
  @IsString({ each: true }) @Matches(/^[1-9]\d{0,19}$/, { each: true }) adminUserIds?: string[];
  @ApiPropertyOptional({ description: 'Write-only. Omit to keep the saved token.' })
  @ValidateIf(present) @IsString() @MaxLength(128) @Matches(/^\d{5,20}:[A-Za-z0-9_-]{30,100}$/) botToken?: string;
  @ApiPropertyOptional() @ValidateIf(present) @IsString() @Matches(/^(?:-?[1-9]\d{0,19})?$/) chatId?: string;
  @ApiPropertyOptional({ description: 'Telegram forum topic ID. Null sends to the default chat destination.', nullable: true })
  @ValidateIf((_: unknown, value: unknown) => value !== undefined && value !== null)
  @IsInt() @Min(1) @Max(2147483647) messageThreadId?: number | null;
  @ApiPropertyOptional({ type: [TelegramTopicRouteDto] }) @ValidateIf(present)
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => TelegramTopicRouteDto) topicRoutes?: TelegramTopicRouteDto[];
  @ApiPropertyOptional() @ValidateIf(present) @IsInt() @Min(1) @Max(3600) cooldownSeconds?: number;
  @ApiPropertyOptional() @ValidateIf(present) @IsInt() @Min(1) @Max(60) maxPerMinute?: number;
  @ApiPropertyOptional() @ValidateIf(present) @IsInt() @Min(1) @Max(1000) failureThreshold?: number;
  @ApiPropertyOptional() @ValidateIf(present) @IsInt() @Min(1) @Max(3600) failureWindowSeconds?: number;
}

export class DiscoverTelegramChatsDto {
  @ApiPropertyOptional({ description: 'Optional draft token; otherwise use the saved token.' })
  @ValidateIf(present) @IsString() @MaxLength(128) @Matches(/^\d{5,20}:[A-Za-z0-9_-]{30,100}$/) botToken?: string;
}

export class TelegramEventDto {
  @ValidateIf(present) @IsIn(CLIENT_BROWSERS) browser?: ClientContext['browser'];
  @ValidateIf(present) @IsIn(CLIENT_OS) os?: ClientContext['os'];
  @ValidateIf(present) @IsInt() @Min(1) @Max(9999) browserMajor?: number;
  @ValidateIf(present) @IsInt() @Min(1) @Max(9999) chromiumMajor?: number;
  @ValidateIf(present) @IsInt() @Min(1) @Max(3600) windowSeconds?: number;
  @IsIn(MONITORING_SERVICES) service!: string;
  @IsIn(['http_error', 'logged_error', 'startup_failure', 'rate_limit', 'ip_block', 'domain_block', 'suspicious_probe', 'repeated_rejections'])
  kind!: 'http_error' | 'logged_error' | 'startup_failure' | 'rate_limit' | 'ip_block' | 'domain_block' | 'suspicious_probe' | 'repeated_rejections';
  @ValidateIf(present) @IsString() @MaxLength(200) source?: string;
  @ValidateIf(present) @IsString() @MaxLength(20) method?: string;
  @ValidateIf(present) @IsString() @MaxLength(200) route?: string;
  @ValidateIf(present) @IsInt() @Min(100) @Max(599) status?: number;
  @ValidateIf(present) @IsIP() ip?: string;
  @ValidateIf(present) @IsString() @MaxLength(200) requestId?: string;
  @ValidateIf(present) @IsInt() @Min(1) @Max(1000000000) count?: number;
}
