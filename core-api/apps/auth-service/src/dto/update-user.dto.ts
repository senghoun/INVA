import { UserProfileDto } from './user-profile.dto';
import { Transform } from 'class-transformer';
import { normalizePhone, PHONE_PATTERN } from '../security/login-identity';
import {
  IsEmail,
  IsEnum,
  ValidateIf,
  IsBoolean,
  Matches,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserTypeEnum } from './create-user.dto';

export class UpdateUserDto extends UserProfileDto {
  @ApiPropertyOptional({
    example: 'updated@inva.io',
    description: 'New email address',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+85512345678', description: 'Unique login phone with country code; null removes it', nullable: true })
  @Transform(({ value }) => normalizePhone(value))
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Phone must include a country code, for example +85512345678.' })
  phone?: string | null;

  @ApiPropertyOptional({
    enum: UserTypeEnum,
    description: 'Update user type',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(UserTypeEnum)
  userType?: UserTypeEnum;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle active status (disable account if false)',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

}
