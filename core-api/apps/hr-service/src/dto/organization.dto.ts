import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsNumber,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── Company DTOs ────────────────────────────────────────────────────────────

export class CreateCompanyDto {
  @ApiProperty({ example: 'INVA Real Estate Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'INVA-HQ' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ example: 'https://invaestate.com/logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({ example: 'hr@invaestate.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+855 23 123 456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://invaestate.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({ example: 'No. 123, Preah Norodom Blvd, Phnom Penh' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

// ─── Branch DTOs ─────────────────────────────────────────────────────────────

export class CreateBranchDto {
  @ApiProperty({ description: 'UUID of the company owning this branch' })
  @IsUUID('4')
  companyId!: string;

  @ApiProperty({ example: 'Phnom Penh Main Branch' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'BR-PP-01' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ example: 'Building B, Central Mall, Phnom Penh' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 100.0, description: 'Geo-fence radius in meters for mobile check-in' })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

// ─── Department DTOs ─────────────────────────────────────────────────────────

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Human Resources' })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @ApiProperty({ example: 'HR-DEPT' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ description: 'UUID of company' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({ description: 'UUID of branch' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ description: 'Parent department UUID for hierarchy trees' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

// ─── Position DTOs ───────────────────────────────────────────────────────────

export class CreatePositionDto {
  @ApiPropertyOptional({ description: 'UUID of department' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiProperty({ example: 'Senior HR Specialist' })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @ApiProperty({ example: 'POS-HR-003' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ example: 3, description: 'Position tier/level rank' })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiPropertyOptional({ example: 'Handles employee lifecycle, relations and onboarding' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}

// ─── Sector DTOs ─────────────────────────────────────────────────────────────

export class CreateSectorDto {
  @ApiPropertyOptional({ description: 'UUID of department' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiProperty({ example: 'Recruitment & Talent' })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({ example: 'SEC-REC' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;
}

export class UpdateSectorDto extends PartialType(CreateSectorDto) {}

// ─── Employment Type DTOs ────────────────────────────────────────────────────

export class CreateEmploymentTypeDto {
  @ApiProperty({ example: 'Full-Time' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: 'FULL_TIME' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ example: 'Permanent standard employment contract' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
