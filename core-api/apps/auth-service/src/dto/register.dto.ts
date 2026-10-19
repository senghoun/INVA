import { Transform } from 'class-transformer';
import { normalizePhone, PHONE_PATTERN } from '../security/login-identity';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'newuser@example.com',
    description: 'Unique user email address',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @ApiPropertyOptional({ example: '+85512345678', description: 'Unique login phone with country code', nullable: false })
  @Transform(({ value }) => normalizePhone(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone must include a country code, for example +85512345678.' })
  phone?: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'User password (min 8 chars, at least 1 letter and 1 number)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password!: string;
}
