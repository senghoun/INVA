import { UserProfileDto } from './user-profile.dto';
import { Transform } from 'class-transformer';
import { normalizePhone, PHONE_PATTERN } from '../security/login-identity';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserTypeEnum {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

export class CreateUserDto extends UserProfileDto {
  @ApiPropertyOptional({
    example: 'employee@inva.io',
    description: 'Unique email; required when phone is omitted',
  })
  @ValidateIf((object, value) => value !== undefined || !object.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+85512345678', description: 'Unique login phone with country code', nullable: false })
  @Transform(({ value }) => normalizePhone(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone must include a country code, for example +85512345678.' })
  phone?: string;

  @ApiProperty({
    example: 'TempPassw0rd!',
    description: 'Initial user password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    enum: UserTypeEnum,
    default: UserTypeEnum.INTERNAL,
    description: 'Account classification (INTERNAL for staff, EXTERNAL for clients)',
  })
  @IsOptional()
  @IsEnum(UserTypeEnum)
  userType?: UserTypeEnum = UserTypeEnum.INTERNAL;

  @ApiPropertyOptional({
    example: ['b62879c3-21c6-4b95-a83d-6bdf9c6e944b'],
    description: 'List of role UUIDs to assign initially',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
