export type UserType = 'INTERNAL' | 'EXTERNAL';

export interface JwtPayload {
  /** Subject — UUID matching auth.User.id */
  sub: string;
  type?: 'access';
  sid?: string;
  email: string | null;
  userType: UserType;
  /** Role names embedded at login time (e.g. ['finance_manager', 'admin']) */
  roles: string[];
  /**
   * For EXTERNAL users: UUID of crm.ClientOrganization.
   * Used for row-level filtering on portal endpoints.
   * null for INTERNAL users.
   */
  orgId: string | null;
  companyScope?: { companyId: string; branchIds: string[]; permissions: string[] };
  permissions?: string[];
  employeeId?: string | null;
  customerId?: string | null;
  iat?: number;
  exp?: number;
}
