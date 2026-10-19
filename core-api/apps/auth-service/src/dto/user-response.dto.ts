import { ApiProperty } from '@nestjs/swagger';
import { UserTypeEnum } from './create-user.dto';

export class UserResponseDto {
  @ApiProperty({ nullable: true })
  firstName!: string | null;
  @ApiProperty({ nullable: true })
  lastName!: string | null;
  @ApiProperty({ nullable: true, description: 'Display name assembled from first and last name' })
  name!: string | null;
  @ApiProperty({ nullable: true, enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender!: string | null;
  @ApiProperty({ nullable: true, description: 'Profile image URL or legacy relative path' })
  image!: string | null;
  @ApiProperty({ example: 'km' })
  language!: string;

  @ApiProperty({ description: 'Whether a private Telegram chat is linked for recovery' })
  telegramRecoveryLinked!: boolean;

  companyScope?: { companyId: string; branchIds: string[]; permissions: string[] };

  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Unique User UUID',
  })
  id!: string;

  @ApiProperty({
    example: 'alice@inva.io',
    description: 'User email address; null for phone-only accounts',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({ example: '+85512345678', nullable: true, description: 'Login phone number, if assigned' })
  phone!: string | null;

  @ApiProperty({
    enum: UserTypeEnum,
    example: UserTypeEnum.INTERNAL,
    description: 'User type classification',
  })
  userType!: string;

  @ApiProperty({
    example: true,
    description: 'Whether user account is active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether multi-factor authentication is configured',
  })
  mfaEnabled!: boolean;

  @ApiProperty({
    example: ['ADMIN', 'MANAGER'],
    description: 'Assigned RBAC role names',
    type: [String],
  })
  roles!: string[];

  @ApiProperty({
    example: '2026-09-18T10:00:00.000Z',
    description: 'Timestamp when record was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-09-18T10:00:00.000Z',
    description: 'Timestamp when record was last modified',
  })
  updatedAt!: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data!: UserResponseDto[];

  @ApiProperty({ example: 100, description: 'Total number of records matching query' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Items per page limit' })
  limit!: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages!: number;
}
