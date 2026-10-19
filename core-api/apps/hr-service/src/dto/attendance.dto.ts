import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Matches,
  IsDateString,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClockInDto {
  @ApiPropertyOptional({ description: 'Employee UUID (inferred from JWT if actor is employee)' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Clocked in at HQ front desk' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional({ description: 'Employee UUID' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Day complete' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateLateRequestDto {
  @ApiPropertyOptional({ description: 'Employee UUID' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiProperty({ example: '2026-09-22', description: 'Date of late attendance' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiPropertyOptional({ example: '08:45', description: 'Expected time of arrival' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  expectedArrival?: string;

  @ApiProperty({ example: 'Traffic congestion on Monivong Blvd due to heavy rain' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ReviewLateRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Approved by department manager' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionNotes?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by employee UUID' })
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by department UUID' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Year (e.g. 2026)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(9999)
  year?: number;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;

  @ApiPropertyOptional({ enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'] })
  @IsOptional()
  @IsIn(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 31 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 31;
}

export class LateRequestQueryDto {
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'ALL'])
  status?: string;
}
