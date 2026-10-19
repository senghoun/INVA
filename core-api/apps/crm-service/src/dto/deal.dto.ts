import {
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  MaxLength,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @ApiProperty({ example: 'Enterprise SaaS License Q4 2024' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'UUID of the ClientOrganization' })
  @IsUUID('4')
  clientOrgId!: string;

  @ApiProperty({ example: 45000.0, description: 'Deal value' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class UpdateDealDto extends PartialType(CreateDealDto) {}

export class CreateClientOrganizationDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}

export class CreateCustomerProfileDto {
  @ApiProperty({ description: 'UUID from auth.User' })
  @IsUUID('4')
  authUserId!: string;

  @ApiProperty({ description: 'UUID of ClientOrganization' })
  @IsUUID('4')
  clientOrgId!: string;

  @ApiProperty({ example: 'Bob' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'IT Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;
}
