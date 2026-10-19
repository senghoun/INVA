import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ExactlyOneLoginIdentity, normalizePhone, PHONE_PATTERN } from '../security/login-identity';

export class LoginDto {
  @ApiPropertyOptional({ example: 'alice@inva.io', description: 'Registered email; provide email or phone, never both' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+85512345678', description: 'Registered phone with country code; provide email or phone, never both' })
  @Transform(({ value }) => normalizePhone(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone must include a country code, for example +85512345678.' })
  phone?: string;

  @ApiProperty({ example: 'S3cur3P@ss!', description: 'Account password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ExactlyOneLoginIdentity()
  password!: string;
}
