import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveInvoiceDto {
  @ApiPropertyOptional({
    example: 'Approved after quarterly review — finance Q4 2024',
    description: 'Optional approval notes added to GL description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
