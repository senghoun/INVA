import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (HS256)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived refresh token' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer', description: 'Token type for Authorization header' })
  tokenType!: string;

  @ApiProperty({ example: 900, description: 'Access token expiry in seconds' })
  expiresIn!: number;
}
