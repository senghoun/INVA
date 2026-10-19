import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { COMPANY_PERMISSIONS } from '@common/interfaces/company-access';
export class CompanyMembershipDto {
  @IsArray() @ArrayUnique() @ArrayMaxSize(100) @IsUUID('4', { each: true }) branchIds!: string[];
  @IsArray() @ArrayUnique() @ArrayMaxSize(100) @IsIn([...COMPANY_PERMISSIONS], { each: true }) permissions!: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
