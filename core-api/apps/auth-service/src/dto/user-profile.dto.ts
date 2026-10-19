import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class UserProfileDto {
  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  firstName?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({ nullable: true, enum: ['MALE', 'FEMALE', 'OTHER'] })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048, description: 'Image URL or relative asset path' })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(2048)
  image?: string | null;

  @ApiPropertyOptional({ example: 'km', description: 'Language code, e.g. en, km, zh' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
  @MaxLength(10)
  language?: string;
}
