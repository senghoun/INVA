import {
  IsString,
  IsEmail,
  IsUUID,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEmployeeProfileDto {
  @ApiProperty({ example: 'EMP-0042' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  employeeCode!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Nguyen' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Alice Nguyen' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  englishName?: string | null;

  @ApiPropertyOptional({ example: 'អាលីស ង្វៀន' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  khmerName?: string | null;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: string | null;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  dob?: string | null;

  @ApiPropertyOptional({ example: '+855 12 345 678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'alice.nguyen@invaestate.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string | null;

  @ApiPropertyOptional({ example: 'St 2004, Phnom Penh' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({ example: 'ID-012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string | null;

  @ApiPropertyOptional({ example: 'Single' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  maritalStatus?: string | null;

  @ApiPropertyOptional({ example: 'Bob Nguyen (Brother)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContact?: string | null;

  @ApiPropertyOptional({ example: '+855 99 888 777' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyPhone?: string | null;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @MaxLength(128)
  jobTitle!: string;

  @ApiPropertyOptional({ description: 'UUID of Company' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({ description: 'UUID of Branch' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of the Department', example: 'dept-uuid-...' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Position' })
  @IsOptional()
  @IsUUID('4')
  positionId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Sector' })
  @IsOptional()
  @IsUUID('4')
  sectorId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Employment Type' })
  @IsOptional()
  @IsUUID('4')
  employmentTypeId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Direct Manager' })
  @IsOptional()
  @IsUUID('4')
  managerId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Team Leader' })
  @IsOptional()
  @IsUUID('4')
  leaderId?: string | null;

  @ApiPropertyOptional({ description: 'UUID of Working Schedule' })
  @IsOptional()
  @IsUUID('4')
  workingScheduleId?: string | null;

  @ApiProperty({ example: '2024-01-15', description: 'ISO 8601 date string' })
  @IsDateString()
  hireDate!: string;

  @ApiPropertyOptional({ example: '2024-04-15' })
  @IsOptional()
  @IsDateString()
  probationEnd?: string | null;

  @ApiPropertyOptional({ example: 'ABA Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string | null;

  @ApiPropertyOptional({ example: '000 123 456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string | null;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber()
  baseSalary?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEmployeeProfileDto extends PartialType(CreateEmployeeProfileDto) {}

export { CreateDepartmentDto, UpdateDepartmentDto } from './organization.dto';
