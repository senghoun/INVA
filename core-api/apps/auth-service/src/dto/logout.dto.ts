import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOi...',
    description: 'Refresh token to be invalidated and revoked',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  refreshToken?: string;
}
