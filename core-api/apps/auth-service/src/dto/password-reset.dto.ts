import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExactlyOneLoginIdentity, normalizePhone, PHONE_PATTERN } from '../security/login-identity';

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: '+85512345678', description: 'Provide phone or email, never both. SMS is sent only to this registered phone.' })
  @Transform(({ value }) => normalizePhone(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(PHONE_PATTERN)
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['sms', 'telegram', 'email'], description: 'Defaults to sms for phone, email for email. Must match the supplied identity.' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['sms', 'telegram', 'email'])
  @ExactlyOneLoginIdentity()
  channel?: 'sms' | 'telegram' | 'email';

  // Run cross-field validation even when channel is omitted.
  @ExactlyOneLoginIdentity()
  private readonly identityCheck?: never;
}

export class VerifyPasswordResetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  challengeId!: string;

  @ApiProperty({ example: '123456', description: 'Six-digit code delivered to the registered contact' })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Restricted single-use token returned by reset-verify' })
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[0-9a-f]{64}$/)
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class LinkTelegramRecoveryDto {
  @ApiProperty({ description: 'Current account password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class PasswordResetRequestResponseDto {
  @ApiProperty({ example: 'If the account is eligible, a verification code will be sent.' })
  message!: string;
  @ApiProperty({ format: 'uuid' })
  challengeId!: string;
  @ApiProperty({ example: 600 })
  expiresIn!: number;
}

export class PasswordResetVerifyResponseDto {
  @ApiProperty({ description: 'Use only for reset-confirm; this is not a login token' })
  token!: string;
  @ApiProperty({ example: 300 })
  expiresIn!: number;
}
