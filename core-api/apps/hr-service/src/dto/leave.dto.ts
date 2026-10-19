import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsInt,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Annual Leave' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: 'ANNUAL' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ example: 18, default: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultDaysPerYear?: number = 18;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowCarryover?: boolean = false;
}

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}

export class CreateLeaveEntitlementDto {
  @ApiProperty({ description: 'UUID of employee' })
  @IsUUID('4')
  employeeId!: string;

  @ApiProperty({ description: 'UUID of leave type' })
  @IsUUID('4')
  leaveTypeId!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(1900)
  @Max(9999)
  year!: number;

  @ApiProperty({ example: 18.0 })
  @IsNumber()
  @Min(0)
  totalDays!: number;
}

export class CreateLeaveRequestDto {
  @ApiPropertyOptional({ description: 'UUID of employee (inferred from JWT if employee)' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiProperty({ description: 'UUID of leave type' })
  @IsUUID('4')
  leaveTypeId!: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({ example: '2026-10-03' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @ApiProperty({ example: 3.0, description: 'Duration in days (e.g. 0.5 for half day)' })
  @IsNumber()
  @Min(0.5)
  durationDays!: number;

  @ApiProperty({ example: 'Family vacation and personal errands' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ReviewLeaveRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsIn(['APPROVED', 'REJECTED', 'CANCELLED'])
  status!: 'APPROVED' | 'REJECTED' | 'CANCELLED';

  @ApiPropertyOptional({ example: 'Approved by department head' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNotes?: string;
}

export class LeaveQueryDto {
  @ApiPropertyOptional({ description: 'Filter by employee UUID' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by leave type UUID' })
  @IsOptional()
  @IsUUID('4')
  leaveTypeId?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'] })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'])
  status?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(9999)
  year?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class LeaveEntitlementQueryDto {
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(9999)
  year?: number;
}
