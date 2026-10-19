import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTemporaryPasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  passwordChangeToken!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class PasswordChangeRequiredDto {
  @ApiProperty({ example: true })
  requiresPasswordChange!: true;
  @ApiProperty()
  passwordChangeToken!: string;
  @ApiProperty({ example: 600 })
  expiresIn!: number;
}

export class TemporaryPasswordResponseDto {
  @ApiProperty()
  temporaryPassword!: string;
  @ApiProperty()
  expiresAt!: string;
}
