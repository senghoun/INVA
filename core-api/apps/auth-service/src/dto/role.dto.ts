import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'Unique role identifier name in uppercase',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({
    example: 'Full administrative access across all domains',
    description: 'Brief description of role privileges',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class AssignRoleDto {
  @ApiProperty({
    example: 'c2e47c1b-10f7-4188-b22f-d8976b0561e1',
    description: 'UUID of the role to assign to the user',
  })
  @IsUUID('4')
  roleId!: string;
}

export class RoleResponseDto {
  @ApiProperty({ example: 'c2e47c1b-10f7-4188-b22f-d8976b0561e1' })
  id!: string;

  @ApiProperty({ example: 'ADMIN' })
  name!: string;

  @ApiPropertyOptional({ example: 'Administrator role' })
  description?: string | null;

  @ApiProperty({ example: true, description: 'Whether role is active' })
  isActive!: boolean;

  @ApiProperty({ example: '2026-09-18T10:00:00.000Z' })
  createdAt!: Date;
}
