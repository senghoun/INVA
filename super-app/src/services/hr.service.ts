import { request } from './api';
import { API_ROUTES } from '../config/api';

// ─── Organization Interfaces ──────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  code: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  status?: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  company?: Company | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDto {
  companyId: string;
  name: string;
  code: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Department {
  id: string;
  companyId?: string | null;
  branchId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  parentId?: string | null;
  parent?: Department | null;
  children?: Department[];
  company?: Company | null;
  branch?: Branch | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  companyId?: string;
  branchId?: string;
  parentId?: string;
  description?: string;
}

export interface Position {
  id: string;
  departmentId?: string | null;
  title: string;
  code: string;
  level?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionDto {
  title: string;
  code: string;
  departmentId?: string;
  level?: string;
  description?: string;
}

// ─── Employee Interfaces ──────────────────────────────────────────────

export interface EmployeeProfile extends Omit<Partial<CreateEmployeeDto>, 'companyId'> {
  id: string;
  authUserId?: string | null;
  companyId?: string | null;
  jobTitle: string;
  firstName: string;
  lastName: string;
  startDate?: string | null;
  isActive: boolean;
  company?: Company | null;
  branch?: Branch | null;
  department?: Department | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  hireDate: string;
  companyId?: string;
  departmentId?: string | null;
  branchId?: string | null;
  positionId?: string | null;
  sectorId?: string | null;
  employmentTypeId?: string | null;
  managerId?: string | null;
  leaderId?: string | null;
  workingScheduleId?: string | null;
  englishName?: string | null;
  khmerName?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  nationalId?: string | null;
  maritalStatus?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  probationEnd?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  baseSalary?: number | null;
}

export interface EmployeeCounts {
  total: number;
  active: number;
  inactive: number;
  probation?: number;
  onLeave?: number;
}

// ─── Attendance Interfaces ───────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
  hoursWorked?: number | null;
  checkOutNotes?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  employee?: EmployeeProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayAttendanceStatus {
  status: 'UNAVAILABLE' | 'NO_EMPLOYEE_PROFILE' | 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';
  record?: AttendanceRecord | null;
}

export interface ClockInDto {
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ClockOutDto {
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface AttendanceRecordsResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface LateRequest {
  id: string;
  employeeId: string;
  date: string;
  expectedArrival?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string | null;
  createdAt: string;
}

// ─── Leave Interfaces ─────────────────────────────────────────────────

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultDaysPerYear: number;
  isPaid: boolean;
  allowCarryover: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeaveTypeDto {
  code: string;
  name: string;
  description?: string;
  defaultDaysPerYear?: number;
  isPaid?: boolean;
  allowCarryover?: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  employee?: EmployeeProfile | null;
  leaveType?: LeaveType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestDto {
  employeeId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  attachmentUrl?: string;
}

export interface ReviewLeaveRequestDto {
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

export interface LeaveEntitlement {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType?: LeaveType | null;
}

export interface LeaveRequestsResponse {
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
}

// ─── Config & Roles Interfaces ────────────────────────────────────────

export interface HrConfig {
  id: string;
  portalDomain: string;
  portalTitle: string;
  workDays: string[];
  dailyWorkHours: number;
  clockInGraceMinutes: number;
  annualLeaveDays: number;
  sickLeaveDays: number;
  allowLeaveCarryover: boolean;
  payrollFrequency: string;
  payrollCutoffDay: number;
  currency: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface HrRole {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHrRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateHrRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

// ─── HR Service Implementation ────────────────────────────────────────

export interface EmployeeHrAccess {
  employeeId: string; authUserId: string | null; isActive: boolean; roles: HrRole[]; permissions: string[];
}
export class HrService {
  getMyHrAccess(): Promise<{ administrator: boolean; permissions: string[]; employeeId: string | null }> {
    return request(`${API_ROUTES.HR}/access/me`);
  }
  getEmployeeAccess(id: string): Promise<EmployeeHrAccess> {
    return request(`${API_ROUTES.HR}/employees/${id}/access`);
  }
  updateEmployeeAccess(id: string, data: { roleIds: string[]; authUserId?: string | null }): Promise<EmployeeHrAccess> {
    return request(`${API_ROUTES.HR}/employees/${id}/access`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // ─── 1. Employees (Staff Management) ─────────────────────────────────

  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }): Promise<EmployeeProfile[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `${API_ROUTES.HR}/employees${qs ? `?${qs}` : ''}`;
    const res = await request<any>(endpoint);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getEmployeeCounts(companyId?: string): Promise<EmployeeCounts> {
    const qs = companyId ? `?companyId=${companyId}` : '';
    return request<EmployeeCounts>(`${API_ROUTES.HR}/employees/counts${qs}`);
  }

  async getEmployeeById(id: string): Promise<EmployeeProfile> {
    return request<EmployeeProfile>(`${API_ROUTES.HR}/employees/${id}`);
  }

  async createEmployee(dto: CreateEmployeeDto): Promise<EmployeeProfile> {
    const fields = ['companyId', 'branchId', 'departmentId', 'positionId', 'sectorId', 'employmentTypeId',
      'managerId', 'leaderId', 'workingScheduleId', 'englishName', 'khmerName', 'gender', 'dob',
      'address', 'nationalId', 'maritalStatus', 'emergencyContact', 'emergencyPhone', 'probationEnd',
      'bankName', 'bankAccountNumber', 'baseSalary'] as const;
    const body: CreateEmployeeDto = {
      employeeCode: dto.employeeCode.trim(), firstName: dto.firstName.trim(), lastName: dto.lastName.trim(),
      jobTitle: dto.jobTitle.trim(), hireDate: dto.hireDate,
      ...(dto.email?.trim() ? { email: dto.email.trim().toLowerCase() } : {}),
      ...(dto.phone?.trim() ? { phone: dto.phone.trim() } : {}),
    };
    for (const field of fields) if (dto[field] !== undefined && dto[field] !== null && dto[field] !== '') Object.assign(body, { [field]: dto[field] });
    return request<EmployeeProfile>(`${API_ROUTES.HR}/employees`, {
      method: 'POST', body: JSON.stringify(body),
    });
  }

  async updateEmployee(id: string, dto: Partial<CreateEmployeeDto>): Promise<EmployeeProfile> {
    return request<EmployeeProfile>(`${API_ROUTES.HR}/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteEmployee(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`${API_ROUTES.HR}/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleEmployeeStatus(id: string): Promise<EmployeeProfile> {
    return request<EmployeeProfile>(`${API_ROUTES.HR}/employees/${id}/toggle-status`, {
      method: 'PUT',
    });
  }

  // ─── 2. Organizations (Companies, Branches, Departments) ─────────────

  async getCompanies(): Promise<Company[]> {
    const res = await request<any>(`${API_ROUTES.HR}/organizations/companies`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getCompanyById(id: string): Promise<Company> {
    return request<Company>(`${API_ROUTES.HR}/organizations/companies/${id}`);
  }

  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    return request<Company>(`${API_ROUTES.HR}/organizations/companies`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateCompany(id: string, dto: Partial<CreateCompanyDto>): Promise<Company> {
    return request<Company>(`${API_ROUTES.HR}/organizations/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteCompany(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`${API_ROUTES.HR}/organizations/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async getBranches(companyId?: string): Promise<Branch[]> {
    const qs = companyId ? `?companyId=${companyId}` : '';
    const res = await request<any>(`${API_ROUTES.HR}/organizations/branches${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    return request<Branch>(`${API_ROUTES.HR}/organizations/branches`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateBranch(id: string, dto: Partial<CreateBranchDto>): Promise<Branch> {
    return request<Branch>(`${API_ROUTES.HR}/organizations/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteBranch(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`${API_ROUTES.HR}/organizations/branches/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartments(companyId?: string, branchId?: string): Promise<Department[]> {
    const query = new URLSearchParams();
    if (companyId) query.set('companyId', companyId);
    if (branchId) query.set('branchId', branchId);
    const qs = query.toString();
    // NOTE: Uses /hr/organizations/departments (OrganizationController), NOT /hr/departments
    const res = await request<any>(`${API_ROUTES.HR}/organizations/departments${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    return request<Department>(`${API_ROUTES.HR}/organizations/departments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateDepartment(id: string, dto: Partial<CreateDepartmentDto>): Promise<Department> {
    return request<Department>(`${API_ROUTES.HR}/organizations/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteDepartment(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`${API_ROUTES.HR}/organizations/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getPositions(departmentId?: string): Promise<Position[]> {
    const qs = departmentId ? `?departmentId=${departmentId}` : '';
    const res = await request<any>(`${API_ROUTES.HR}/organizations/positions${qs}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async createPosition(dto: CreatePositionDto): Promise<Position> {
    return request<Position>(`${API_ROUTES.HR}/organizations/positions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // ─── 3. Attendance (Live Clock & Records) ─────────────────────────────

  async getTodayAttendanceStatus(): Promise<TodayAttendanceStatus> {
    return request<TodayAttendanceStatus>(`${API_ROUTES.HR}/attendance/today-status`);
  }

  async clockIn(dto?: ClockInDto): Promise<AttendanceRecord> {
    return request<AttendanceRecord>(`${API_ROUTES.HR}/attendance/check-in`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  async clockOut(dto?: ClockOutDto): Promise<AttendanceRecord> {
    return request<AttendanceRecord>(`${API_ROUTES.HR}/attendance/check-out`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  async getAttendanceRecords(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<AttendanceRecordsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString();
    const res = await request<any>(`${API_ROUTES.HR}/attendance/records${qs ? `?${qs}` : ''}`);
    if (Array.isArray(res)) {
      return { data: res, total: res.length, page: 1, limit: res.length };
    }
    return {
      data: res?.data || [],
      total: res?.total || (res?.data?.length || 0),
      page: res?.page || 1,
      limit: res?.limit || 20,
    };
  }

  async getLateRequests(employeeId?: string, status?: string): Promise<LateRequest[]> {
    const query = new URLSearchParams();
    if (employeeId) query.set('employeeId', employeeId);
    if (status) query.set('status', status);
    const qs = query.toString();
    const res = await request<any>(`${API_ROUTES.HR}/attendance/late-requests${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  // ─── 4. Leaves (Types, Entitlements & Requests) ───────────────────────

  async getLeaveTypes(): Promise<LeaveType[]> {
    const res = await request<any>(`${API_ROUTES.HR}/leaves/types`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return request<LeaveType>(`${API_ROUTES.HR}/leaves/types`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateLeaveType(id: string, dto: Partial<CreateLeaveTypeDto>): Promise<LeaveType> {
    return request<LeaveType>(`${API_ROUTES.HR}/leaves/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteLeaveType(id: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(`${API_ROUTES.HR}/leaves/types/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeaveEntitlements(employeeId?: string, year?: number): Promise<LeaveEntitlement[]> {
    const query = new URLSearchParams();
    if (employeeId) query.set('employeeId', employeeId);
    if (year) query.set('year', String(year));
    const qs = query.toString();
    const res = await request<any>(`${API_ROUTES.HR}/leaves/entitlements${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getLeaveRequests(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    leaveTypeId?: string;
    status?: string;
  }): Promise<LeaveRequestsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.leaveTypeId) query.set('leaveTypeId', params.leaveTypeId);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString();
    const res = await request<any>(`${API_ROUTES.HR}/leaves/requests${qs ? `?${qs}` : ''}`);
    if (Array.isArray(res)) {
      return { data: res, total: res.length, page: 1, limit: res.length };
    }
    return {
      data: res?.data || [],
      total: res?.total || (res?.data?.length || 0),
      page: res?.page || 1,
      limit: res?.limit || 20,
    };
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return request<LeaveRequest>(`${API_ROUTES.HR}/leaves/requests`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async reviewLeaveRequest(id: string, dto: ReviewLeaveRequestDto): Promise<LeaveRequest> {
    return request<LeaveRequest>(`${API_ROUTES.HR}/leaves/requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  // ─── 5. Domain Config & Roles ────────────────────────────────────────

  async getHrConfig(): Promise<HrConfig> {
    return request<HrConfig>(`${API_ROUTES.HR}/config`);
  }

  async updateHrConfig(payload: Partial<HrConfig>): Promise<HrConfig> {
    return request<HrConfig>(`${API_ROUTES.HR}/config`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getHrRoles(): Promise<HrRole[]> {
    return request<HrRole[]>(`${API_ROUTES.HR}/roles`);
  }

  async createHrRole(dto: CreateHrRoleDto): Promise<HrRole> {
    return request<HrRole>(`${API_ROUTES.HR}/roles`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateHrRole(id: string, dto: UpdateHrRoleDto): Promise<HrRole> {
    return request<HrRole>(`${API_ROUTES.HR}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteHrRole(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${API_ROUTES.HR}/roles/${id}`, {
      method: 'DELETE',
    });
  }
}

export const hrService = new HrService();
