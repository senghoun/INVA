import {
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemDto {
  @ApiProperty({ example: 'Annual SaaS license — Tier 2' })
  @IsString()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ example: 12, description: 'Number of units' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 1250.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'UUID of the CRM Deal' })
  @IsUUID('4')
  dealId!: string;

  @ApiProperty({ description: 'UUID of the ClientOrganization' })
  @IsUUID('4')
  clientOrgId!: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: '2024-11-30', description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}
