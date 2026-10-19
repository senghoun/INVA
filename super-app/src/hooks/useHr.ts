import { useState, useEffect, useCallback, useRef } from 'react';
import {
  hrService,
  EmployeeProfile,
  EmployeeCounts,
  CreateEmployeeDto,
  Company,
  Branch,
  Department,
  Position,
  CreateCompanyDto,
  CreateBranchDto,
  CreateDepartmentDto,
  TodayAttendanceStatus,
  AttendanceRecord,
  AttendanceRecordsResponse,
  ClockInDto,
  ClockOutDto,
  LeaveType,
  LeaveRequest,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  ReviewLeaveRequestDto,
  LeaveRequestsResponse,
} from '../services/hr.service';

// ─── 1. useEmployees ──────────────────────────────────────────────────

export function useEmployees(params?: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: string;
}) {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [counts, setCounts] = useState<EmployeeCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchEmployees = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      const [list, countData] = await Promise.allSettled([
        hrService.getEmployees(params),
        hrService.getEmployeeCounts(),
      ]);

      if (id !== requestId.current) return;
      const errors: string[] = [];

      if (list.status === 'fulfilled') {
        if (Array.isArray(list.value)) setEmployees(list.value);
        else { setEmployees([]); errors.push('The employee directory returned an invalid response.'); }
      } else {
        setEmployees([]);
        errors.push(list.reason instanceof Error ? list.reason.message : 'Unable to load employees.');
      }
      if (countData.status === 'fulfilled') {
        setCounts(countData.value);
      } else {
        setCounts(null);
        errors.push(countData.reason instanceof Error ? countData.reason.message : 'Unable to load employee totals.');
      }
      setError(errors.length ? [...new Set(errors)].join(' ') : null);
    } catch (err: any) {
      if (id === requestId.current) {
        setEmployees([]);
        setCounts(null);
        setError(err.message || 'Failed to load employees');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params?.search, params?.departmentId, params?.status, params?.page, params?.limit]);

  useEffect(() => {
    fetchEmployees();
    const changed = () => { ++requestId.current; setEmployees([]); setCounts(null); void fetchEmployees(); };
    if (typeof window !== 'undefined') window.addEventListener('inva:company-changed', changed);
    return () => { ++requestId.current; if (typeof window !== 'undefined') window.removeEventListener('inva:company-changed', changed); };
  }, [fetchEmployees]);

  const createEmployee = async (dto: CreateEmployeeDto) => {
    const created = await hrService.createEmployee(dto);
    await fetchEmployees();
    return created;
  };

  const updateEmployee = async (id: string, dto: Partial<CreateEmployeeDto>) => {
    const updated = await hrService.updateEmployee(id, dto);
    await fetchEmployees();
    return updated;
  };

  const toggleStatus = async (id: string) => {
    const toggled = await hrService.toggleEmployeeStatus(id);
    await fetchEmployees();
    return toggled;
  };

  const deleteEmployee = async (id: string) => {
    const res = await hrService.deleteEmployee(id);
    await fetchEmployees();
    return res;
  };

  return {
    employees,
    counts,
    loading,
    error,
    refetch: fetchEmployees,
    createEmployee,
    updateEmployee,
    toggleStatus,
    deleteEmployee,
  };
}

// ─── 2. useOrganizations ──────────────────────────────────────────────

export function useOrganizations(companyId?: string, branchId?: string) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, branchRes, deptRes, posRes] = await Promise.allSettled([
        hrService.getCompanies(),
        hrService.getBranches(companyId),
        hrService.getDepartments(companyId, branchId),
        hrService.getPositions(),
      ]);

      if (compRes.status === 'fulfilled') setCompanies(compRes.value || []);
      if (branchRes.status === 'fulfilled') setBranches(branchRes.value || []);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value || []);
      if (posRes.status === 'fulfilled') setPositions(posRes.value || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createCompany = async (dto: CreateCompanyDto) => {
    const created = await hrService.createCompany(dto);
    await fetchAll();
    return created;
  };

  const createBranch = async (dto: CreateBranchDto) => {
    const created = await hrService.createBranch(dto);
    await fetchAll();
    return created;
  };

  const createDepartment = async (dto: CreateDepartmentDto) => {
    const created = await hrService.createDepartment(dto);
    await fetchAll();
    return created;
  };

  const deleteCompany = async (id: string) => {
    const res = await hrService.deleteCompany(id);
    await fetchAll();
    return res;
  };

  const deleteBranch = async (id: string) => {
    const res = await hrService.deleteBranch(id);
    await fetchAll();
    return res;
  };

  const deleteDepartment = async (id: string) => {
    const res = await hrService.deleteDepartment(id);
    await fetchAll();
    return res;
  };

  const updateCompany = async (id: string, dto: Partial<CreateCompanyDto>) => {
    const res = await hrService.updateCompany(id, dto);
    await fetchAll();
    return res;
  };

  const updateBranch = async (id: string, dto: Partial<CreateBranchDto>) => {
    const res = await hrService.updateBranch(id, dto);
    await fetchAll();
    return res;
  };

  const updateDepartment = async (id: string, dto: Partial<CreateDepartmentDto>) => {
    const res = await hrService.updateDepartment(id, dto);
    await fetchAll();
    return res;
  };

  return {
    companies,
    branches,
    departments,
    positions,
    loading,
    error,
    refetch: fetchAll,
    createCompany,
    createBranch,
    createDepartment,
    updateCompany,
    updateBranch,
    updateDepartment,
    deleteCompany,
    deleteBranch,
    deleteDepartment,
  };
}

// ─── 3. useAttendance ─────────────────────────────────────────────────

export function useAttendance(recordsParams?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus>({
    status: 'UNAVAILABLE',
    record: null,
  });
  const [recordsResponse, setRecordsResponse] = useState<AttendanceRecordsResponse>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const emptyRecords = () => ({ data: [], total: 0, page: recordsParams?.page || 1, limit: recordsParams?.limit || 20 });
  const fetchAttendance = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true); setError(null);
    const [todayRes, recordsRes] = await Promise.allSettled([
      hrService.getTodayAttendanceStatus(), hrService.getAttendanceRecords(recordsParams),
    ]);
    if (id !== requestId.current) return;
    const errors: string[] = [];
    if (todayRes.status === 'fulfilled') setTodayStatus(todayRes.value);
    else { setTodayStatus({ status: 'UNAVAILABLE', record: null }); errors.push(todayRes.reason?.message || 'Today status unavailable'); }
    if (recordsRes.status === 'fulfilled') setRecordsResponse(recordsRes.value);
    else { setRecordsResponse(emptyRecords()); errors.push(recordsRes.reason?.message || 'Attendance records unavailable'); }
    setError(errors.length ? errors.join('; ') : null); setLoading(false);
  }, [recordsParams?.page, recordsParams?.limit, recordsParams?.status, recordsParams?.employeeId, recordsParams?.departmentId, recordsParams?.startDate, recordsParams?.endDate]);

  useEffect(() => {
    void fetchAttendance();
    const companyChanged = () => {
      ++requestId.current; setTodayStatus({ status: 'UNAVAILABLE', record: null }); setRecordsResponse(emptyRecords());
      void fetchAttendance();
    };
    const sessionCleared = () => {
      ++requestId.current; setTodayStatus({ status: 'UNAVAILABLE', record: null }); setRecordsResponse(emptyRecords()); setError('Sign in to view attendance.'); setLoading(false);
    };
    window.addEventListener('inva:company-changed', companyChanged);
    window.addEventListener('inva:session-cleared', sessionCleared);
    return () => {
      ++requestId.current;
      window.removeEventListener('inva:company-changed', companyChanged); window.removeEventListener('inva:session-cleared', sessionCleared);
    };
  }, [fetchAttendance]);

  const clockIn = async (dto?: ClockInDto) => {
    try {
      setPunching(true);
      const res = await hrService.clockIn(dto);
      await fetchAttendance();
      return res;
    } finally {
      setPunching(false);
    }
  };

  const clockOut = async (dto?: ClockOutDto) => {
    try {
      setPunching(true);
      const res = await hrService.clockOut(dto);
      await fetchAttendance();
      return res;
    } finally {
      setPunching(false);
    }
  };

  return {
    todayStatus,
    records: recordsResponse.data,
    totalRecords: recordsResponse.total,
    page: recordsResponse.page,
    limit: recordsResponse.limit,
    loading,
    punching,
    error,
    refetch: fetchAttendance,
    clockIn,
    clockOut,
  };
}

// ─── 4. useLeaves ─────────────────────────────────────────────────────

export function useLeaves(requestsParams?: {
  page?: number;
  limit?: number;
  employeeId?: string;
  leaveTypeId?: string;
  status?: string;
}) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requestsResponse, setRequestsResponse] = useState<LeaveRequestsResponse>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const emptyRequests = () => ({ data: [], total: 0, page: requestsParams?.page || 1, limit: requestsParams?.limit || 20 });
  const fetchLeaves = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const [typesRes, reqsRes] = await Promise.allSettled([
      hrService.getLeaveTypes(), hrService.getLeaveRequests(requestsParams),
    ]);
    if (id !== requestId.current) return;
    const errors: string[] = [];
    if (typesRes.status === 'fulfilled') setLeaveTypes(typesRes.value);
    else { setLeaveTypes([]); errors.push(typesRes.reason?.message || 'Failed to load leave types'); }
    if (reqsRes.status === 'fulfilled') setRequestsResponse(reqsRes.value);
    else { setRequestsResponse(emptyRequests()); errors.push(reqsRes.reason?.message || 'Failed to load leave requests'); }
    setError(errors.length ? errors.join('; ') : null);
    setLoading(false);
  }, [requestsParams?.page, requestsParams?.limit, requestsParams?.employeeId, requestsParams?.status, requestsParams?.leaveTypeId]);

  useEffect(() => {
    void fetchLeaves();
    const companyChanged = () => {
      ++requestId.current; setLeaveTypes([]); setRequestsResponse(emptyRequests());
      void fetchLeaves();
    };
    const sessionCleared = () => {
      ++requestId.current; setLeaveTypes([]); setRequestsResponse(emptyRequests()); setError('Sign in to view leave requests.'); setLoading(false);
    };
    window.addEventListener('inva:company-changed', companyChanged);
    window.addEventListener('inva:session-cleared', sessionCleared);
    return () => {
      ++requestId.current;
      window.removeEventListener('inva:company-changed', companyChanged);
      window.removeEventListener('inva:session-cleared', sessionCleared);
    };
  }, [fetchLeaves]);

  const submitLeave = async (dto: CreateLeaveRequestDto) => {
    const res = await hrService.createLeaveRequest(dto);
    await fetchLeaves();
    return res;
  };

  const approveLeave = async (id: string, reviewNotes?: string) => {
    const res = await hrService.reviewLeaveRequest(id, { status: 'APPROVED', reviewNotes });
    await fetchLeaves();
    return res;
  };

  const rejectLeave = async (id: string, reviewNotes?: string) => {
    const res = await hrService.reviewLeaveRequest(id, { status: 'REJECTED', reviewNotes });
    await fetchLeaves();
    return res;
  };

  const createLeaveType = async (dto: any) => {
    const res = await hrService.createLeaveType(dto);
    await fetchLeaves();
    return res;
  };

  const updateLeaveType = async (id: string, dto: Partial<CreateLeaveTypeDto>) => {
    const res = await hrService.updateLeaveType(id, dto);
    await fetchLeaves();
    return res;
  };

  const deleteLeaveType = async (id: string) => {
    const res = await hrService.deleteLeaveType(id);
    await fetchLeaves();
    return res;
  };

  return {
    leaveTypes,
    requests: requestsResponse.data,
    totalRequests: requestsResponse.total,
    page: requestsResponse.page,
    limit: requestsResponse.limit,
    loading,
    error,
    refetch: fetchLeaves,
    submitLeave,
    approveLeave,
    rejectLeave,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  };
}
