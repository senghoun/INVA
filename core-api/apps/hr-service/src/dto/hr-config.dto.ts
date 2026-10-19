import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHrConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ default: 'hr.invaestate.com' })
  @IsOptional()
  @IsString()
  portalDomain?: string;

  @ApiPropertyOptional({ default: 'INVA HR Portal' })
  @IsOptional()
  @IsString()
  portalTitle?: string;

  @ApiPropertyOptional({ type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workDays?: string[];

  @ApiPropertyOptional({ default: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  dailyWorkHours?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  clockInGraceMinutes?: number;

  @ApiPropertyOptional({ default: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  annualLeaveDays?: number;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  sickLeaveDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowLeaveCarryover?: boolean;

  @ApiPropertyOptional({ default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  payrollFrequency?: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  payrollCutoffDay?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: any;

  @ApiPropertyOptional()
  @IsOptional()
  updatedBy?: any;
}

export class CreateHrRoleDto {
  @ApiProperty({ example: 'RECRUITER' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Handles job postings and interviews' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['hr:employees:read', 'hr:employees:write'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class UpdateHrRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
