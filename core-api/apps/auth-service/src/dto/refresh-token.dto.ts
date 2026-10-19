import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token issued at login' })
  @IsString()
  @IsOptional()
  @MinLength(10)
  refreshToken?: string;
}
