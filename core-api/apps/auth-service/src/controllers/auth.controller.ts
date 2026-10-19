import { ForgotPasswordDto, VerifyPasswordResetDto, ResetPasswordDto, LinkTelegramRecoveryDto, PasswordResetRequestResponseDto, PasswordResetVerifyResponseDto } from '../dto/password-reset.dto';
import { PasswordResetService } from '../services/password-reset.service';
import { TelegramRecoveryService } from '../services/telegram-recovery.service';
import { CompanyAccessService } from '../services/company-access.service';
import { CompanyMembershipDto } from '../dto/company-membership.dto';
import { COMPANY_PERMISSIONS } from '@common/interfaces/company-access';
import { MfaService } from '../services/mfa.service';
import { MfaSetupDto, MfaConfirmDto, MfaVerifyDto, MfaDisableDto } from '../dto/mfa.dto';
import { ConfigService } from '@nestjs/config';
import { Res, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { isBrowserSession, sendBrowserSession, REFRESH_COOKIE } from '../security/browser-session';
import { CompleteTemporaryPasswordDto, PasswordChangeRequiredDto, TemporaryPasswordResponseDto } from '../dto/temporary-password.dto';
import { AuthPolicyGuard } from '../guards/auth-policy.guard';
import { AuthAuditInterceptor } from '../guards/auth-audit.interceptor';
import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Req,
  Ip,
  Headers,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SecurityPolicyService } from '../services/security-policy.service';
import {
  UpdateSecurityPolicyDto,
  AuditLogQueryDto,
} from '../dto/security-policy.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { LogoutDto } from '../dto/logout.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import {
  UserResponseDto,
  PaginatedUsersResponseDto,
} from '../dto/user-response.dto';
import {
  CreateRoleDto,
  AssignRoleDto,
  RoleResponseDto,
} from '../dto/role.dto';
import { PolicyReaderGuard } from '../guards/policy-reader.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import {
  JwtAuthGuard,
  UserTypeGuard,
  RolesGuard,
  RequireRoles,
  RequireUserType,
  CurrentUser,
  JwtPayload,
} from '@common';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuthAuditInterceptor)
@UseGuards(AuthPolicyGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly policyService: SecurityPolicyService,
    private readonly config: ConfigService,
    private readonly mfa: MfaService,
    private readonly companyAccess: CompanyAccessService,
    private readonly passwordReset: PasswordResetService,
    private readonly telegramRecovery: TelegramRecoveryService,
  ) {}

  // ─── Public Authentication & Registration ────────────────────────────────

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate email or phone and password, then issue JWT tokens' })
  @ApiBody({ type: LoginDto, examples: {
    email: { summary: 'Email and password', value: { email: 'alice@inva.io', password: 'S3cur3P@ss!' } },
    phone: { summary: 'Phone and password', value: { phone: '+85512345678', password: 'S3cur3P@ss!' } },
  } })
  @Header('Cache-Control', 'no-store')
  @ApiExtraModels(TokenResponseDto, PasswordChangeRequiredDto)
  @ApiResponse({ status: 200, schema: { oneOf: [{ $ref: getSchemaPath(TokenResponseDto) }, { $ref: getSchemaPath(PasswordChangeRequiredDto) }] } })
  @ApiResponse({ status: 401, description: 'Invalid login credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const browser = isBrowserSession(req, this.config);
    const result = await this.authService.login(dto);
    return 'accessToken' in result ? sendBrowserSession(result, browser, reply, this.config) : result;
  }

  @Post('password/reset-request')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Forgot password: send a code through SMS or linked Telegram (email delivery pending)' })
  @ApiResponse({ status: 200, type: PasswordResetRequestResponseDto })
  @ApiResponse({ status: 503, description: 'Delivery adapter is disabled or unconfigured' })
  @ApiBody({ type: ForgotPasswordDto, examples: { sms: { value: { phone: '+85512345678', channel: 'sms' } }, telegram: { value: { phone: '+85512345678', channel: 'telegram' } } } })
  requestPasswordReset(@Body() dto: ForgotPasswordDto) { return this.passwordReset.request(dto); }

  @Post('password/reset-verify')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify reset code and obtain a single-use password reset token' })
  @ApiResponse({ status: 200, type: PasswordResetVerifyResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid, expired or exhausted code' })
  verifyPasswordReset(@Body() dto: VerifyPasswordResetDto) { return this.passwordReset.verify(dto); }

  @Post('password/reset-confirm')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Set a new password and revoke existing sessions; MFA remains enabled' })
  async confirmPasswordReset(@Body() dto: ResetPasswordDto, @Req() req: FastifyRequest) {
    const result = await this.passwordReset.reset(dto);
    (req as any).user = { sub: result.userId, email: result.email };
    return { message: result.message };
  }

  @Post('password/telegram/link')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Link Telegram recovery: verify current password and return a bot start link' })
  linkTelegramRecovery(@Body() dto: LinkTelegramRecoveryDto, @CurrentUser() actor: JwtPayload) { return this.telegramRecovery.link(actor.sub, dto.password); }

  @Delete('password/telegram/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  unlinkTelegramRecovery(@Body() dto: LinkTelegramRecoveryDto, @CurrentUser() actor: JwtPayload) { return this.telegramRecovery.unlink(actor.sub, dto.password); }

  @Post('password/telegram/webhook')
  @HttpCode(200)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({ summary: 'Dedicated recovery bot webhook, protected by Telegram secret-token header' })
  telegramRecoveryWebhook(@Headers('x-telegram-bot-api-secret-token') secret: string | undefined, @Body() update: unknown) { return this.telegramRecovery.webhook(secret, update); }

  @Get('company-access')
  @UseGuards(JwtAuthGuard)
  listCompanyAccess(@CurrentUser() actor: JwtPayload) { return this.companyAccess.list(actor.sub); }

  @Get('users/:id/company-access')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL') @RequireRoles('ADMIN')
  userCompanyAccess(@Param('id', ParseUUIDPipe) id: string) { return this.companyAccess.list(id, true); }

  @Get('company-permissions')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL') @RequireRoles('ADMIN')
  companyPermissions() { return COMPANY_PERMISSIONS; }

  @Put('users/:id/company-access/:companyId')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL') @RequireRoles('ADMIN')
  grantCompanyAccess(@Param('id', ParseUUIDPipe) id: string, @Param('companyId', ParseUUIDPipe) companyId: string, @Body() dto: CompanyMembershipDto, @CurrentUser() actor: JwtPayload, @Headers('authorization') authorization: string) {
    return this.companyAccess.grant(id, companyId, dto, actor.sub, authorization);
  }

  @Post('mfa/setup')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  setupMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaSetupDto) { return this.mfa.setup(user.sub, dto.method, dto.password); }

  @Post('mfa/confirm')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  confirmMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaConfirmDto) { return this.mfa.confirm(user.sub, dto.code); }

  @Delete('mfa')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  disableMfa(@CurrentUser() user: JwtPayload, @Body() dto: MfaDisableDto) { return this.mfa.disable(user.sub, dto.password, dto.code); }

  @Post('mfa/verify')
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyMfa(@Body() dto: MfaVerifyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const browser = isBrowserSession(req, this.config);
    return sendBrowserSession(await this.authService.verifyMfa(dto.sessionToken, dto.code), browser, reply, this.config);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account (default EXTERNAL)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token invalid or expired' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const browser = isBrowserSession(req, this.config);
    const token = browser ? req.cookies?.[REFRESH_COOKIE] : dto.refreshToken;
    if (!token) throw new UnauthorizedException('Sign in required.');
    return sendBrowserSession(await this.authService.refresh(token), browser, reply, this.config);
  }

  // ─── Authenticated Account & Session Management ──────────────────────────

  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Decoded JWT identity claims' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return { ...await this.authService.getUserById(user.sub), companyScope: user.companyScope };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listSessions(@CurrentUser() user: JwtPayload) { return this.authService.listSessions(user.sub, user.sid); }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeSession(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.authService.revokeSession(user.sub, id);
  }

  @Post('sessions/revoke-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  revokeAllSessions(@CurrentUser() user: JwtPayload) { return this.authService.revokeSessions(user.sub); }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token and terminate active session' })
  @ApiResponse({ status: 200, description: 'Session successfully revoked' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: LogoutDto,
    @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ message: string }> {
    const browser = isBrowserSession(req, this.config);
    const token = browser ? req.cookies?.[REFRESH_COOKIE] : dto.refreshToken;
    if (!token) throw new UnauthorizedException('Sign in required.');
    await this.authService.logout(user.sub, token, user.sid);
    if (browser) reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth', httpOnly: true, secure: this.config.get('NODE_ENV') === 'production', sameSite: 'strict' });
    return { message: 'Logged out successfully.' };
  }

  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password updated and sessions revoked' })
  @ApiResponse({ status: 400, description: 'Current password invalid or validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.sub, dto);
  }

  // ─── User Administration (Admin CRUD) ────────────────────────────────────

  @Get('users')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Paginated user list with search & filters' })
  @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden — requires INTERNAL administrator' })
  listUsers(@Query() query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.authService.listUsers(query);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Create a new user with optional roles & type' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.authService.createUser(dto);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Get single user by UUID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.authService.getUserById(id);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Update user details or active status' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email conflict' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.authService.updateUser(id, dto, actor.sub);
  }

  @Post('users/:id/reset-password')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Generate temporary password; require change on next login' })
  @ApiResponse({ status: 200, type: TemporaryPasswordResponseDto })
  resetUserPassword(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload) {
    return this.authService.resetUserPassword(id, actor.sub);
  }

  @Post('complete-password-change')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Choose own password using the restricted token returned by temporary-password login' })
  async completeTemporaryPassword(@Body() dto: CompleteTemporaryPasswordDto, @Req() req: any) {
    const result = await this.authService.completeTemporaryPassword(dto);
    // Attribute the audit event only after the restricted challenge was verified.
    req.user = { sub: result.userId, email: result.email };
    return { message: result.message };
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Soft delete user (set to inactive & revoke active sessions)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User successfully inactivated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtPayload): Promise<UserResponseDto> {
    return this.authService.deleteUser(id, actor.sub);
  }

  // ─── RBAC Role Management ────────────────────────────────────────────────

  @Get('roles')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] List all ecosystem roles (active by default)' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  listRoles(
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<RoleResponseDto[]> {
    return this.authService.listRoles(String(includeInactive) === 'true');
  }

  @Post('roles')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Create a new RBAC role' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  createRole(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.authService.createRole(dto);
  }

  @Delete('roles/:id')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Soft delete a role by UUID (set to inactive)' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, type: RoleResponseDto, description: 'Role successfully inactivated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    return this.authService.deleteRole(id);
  }

  @Post('users/:id/roles')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Assign an RBAC role to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User or Role not found' })
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
  ): Promise<UserResponseDto> {
    return this.authService.assignRoleToUser(id, dto.roleId);
  }

  @Delete('users/:id/roles/:roleId')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Remove an RBAC role from user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.authService.removeRoleFromUser(id, roleId, actor.sub);
  }

  // ─── Global Security Policy & Domain Restrictions ──────────────────────────

  @Get('internal/security/policy')
  @UseGuards(PolicyReaderGuard)
  readGatewayPolicy() { return this.policyService.getPolicy(); }

  @Get('security/policy')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL')
  @RequireRoles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active global security and domain policy' })
  @ApiResponse({ status: 200, description: 'Current security policy' })
  getSecurityPolicy() {
    return this.policyService.getPolicy();
  }

  @Patch('security/policy')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Update global security and domain policy' })
  @ApiResponse({ status: 200, description: 'Updated security policy' })
  updateSecurityPolicy(
    @Body() dto: UpdateSecurityPolicyDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.policyService.updatePolicy(dto, user?.email || user?.sub, ip, userAgent);
  }

  @Get('security/audit')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireRoles('ADMIN')
  @RequireUserType('INTERNAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Query security audit log' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.policyService.getAuditLogs(query);
  }
}
