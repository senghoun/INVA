import { Body, Controller, Get, Header, HttpCode, Ip, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, getTelegramAlerts, JwtAuthGuard, JwtPayload, RequireRoles, RequireUserType, RolesGuard, UserTypeGuard } from '@common';
import { AuthPolicyGuard } from '../guards/auth-policy.guard';
import { TelegramMonitorGuard } from '../guards/telegram-monitor.guard';
import { DiscoverTelegramChatsDto, TelegramEventDto, TelegramTestTargetDto, UpdateTelegramSettingsDto } from '../dto/telegram-settings.dto';
import { TelegramSettingsService } from '../services/telegram-settings.service';

@ApiTags('Telegram monitoring')
@ApiBearerAuth()
@Controller('auth/security/telegram')
@UseGuards(AuthPolicyGuard, JwtAuthGuard, UserTypeGuard, RolesGuard)
@RequireUserType('INTERNAL')
@RequireRoles('ADMIN')
export class TelegramController {
  constructor(private readonly settings: TelegramSettingsService) {}

  @Get() @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get Telegram settings without revealing the bot token' })
  getTelegramSettings() { return this.settings.getSettings(); }

  @Patch() @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Change the monitoring bot, destination and alert limits' })
  updateTelegramSettings(@Body() dto: UpdateTelegramSettingsDto, @CurrentUser() user: JwtPayload, @Req() req: { ip: string; securityClientIp?: string }) {
    return this.settings.update(dto, user.email || user.sub, req.securityClientIp || req.ip);
  }

  @Post('chats') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Discover destination chat IDs from recent messages to the bot' })
  discoverTelegramChats(@Body() dto: DiscoverTelegramChatsDto) { return this.settings.discoverChats(dto.botToken); }

  @Post('test') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a test message using the saved bot and chat ID' })
  testTelegram(@CurrentUser() user: JwtPayload, @Req() req: { ip: string; securityClientIp?: string }, @Body() target: TelegramTestTargetDto) {
    return this.settings.sendTest(user.email || user.sub, req.securityClientIp || req.ip, target);
  }
}

@Controller('auth/internal/telegram')
@UseGuards(TelegramMonitorGuard)
@SkipThrottle()
export class TelegramInternalController {
  constructor(private readonly settings: TelegramSettingsService) {}
  @Get('config') @Header('Cache-Control', 'no-store')
  getMonitoringConfig() { return this.settings.runtime(); }
  @Post('events') @HttpCode(200)
  ingestMonitoringEvent(@Body() event: TelegramEventDto) {
    getTelegramAlerts('auth-service').notify(event);
    return { ok: true };
  }
}
