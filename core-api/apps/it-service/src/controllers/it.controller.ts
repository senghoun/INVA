import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  RolesGuard,
  RequireRoles,
  UserTypeGuard,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('it')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
@RequireRoles('ADMIN', 'IT_ADMIN')
@RequireUserType('INTERNAL')
@Controller('it')
export class ItController {
  @Get('health')
  @RequireRoles('ADMIN', 'IT_ADMIN', 'AUDITOR')
  @ApiOperation({ summary: '[INTERNAL] IT domain health check' })
  healthCheck(@CurrentUser() user: JwtPayload) {
    return {
      status: 'ok',
      domain: 'it',
      requestedBy: user.email,
      timestamp: new Date().toISOString(),
    };
  }
}
