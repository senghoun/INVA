import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';

export class MfaSetupDto {
  @IsIn(['TOTP']) method!: string;
  @IsString() @IsNotEmpty() @MaxLength(256) password!: string;
}
export class MfaConfirmDto {
  @IsString() @IsNotEmpty() @MaxLength(64) code!: string;
}
export class MfaVerifyDto extends MfaConfirmDto {
  @IsString() @IsNotEmpty() @MaxLength(2048) sessionToken!: string;
}

export class MfaDisableDto extends MfaConfirmDto {
  @IsString() @IsNotEmpty() @MaxLength(256) password!: string;
}
