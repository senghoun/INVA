import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Clock,
  CalendarDays,
  ShieldCheck,
  Settings,
  Sparkles,
  RefreshCw,
  AlertCircle,
  LogIn,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { User as AuthUser } from '../../types';
import { hrService, HrConfig, HrRole } from '../../services/hr.service';
import {
  useEmployees,
  useOrganizations,
  useAttendance,
  useLeaves,
} from '../../hooks/useHr';

// Modular Components
import { EmployeesTab } from './employees/EmployeesTab';
import { OrganizationsTab } from './organizations/OrganizationsTab';
import { AttendanceTab } from './attendance/AttendanceTab';
import { LeavesTab } from './leaves/LeavesTab';
import { RolesTab } from './roles/RolesTab';
import { SettingsTab } from './settings/SettingsTab';
import { Button, Badge } from '../common';

export type HrSubTab =
  | 'employees'
  | 'organizations'
  | 'attendance'
  | 'leaves'
  | 'roles'
  | 'settings';

const HR_SUBTABS: { id: HrSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leaves', label: 'Leaves', icon: CalendarDays },
  { id: 'roles', label: 'Roles & Access', icon: ShieldCheck },
  { id: 'settings', label: 'HR Policies', icon: Settings },
];

export const HrManager: React.FC = () => {
  // ─── Tab Persistence via URL Hash and LocalStorage ───────────────────
  const [activeTab, setActiveTab] = useState<HrSubTab>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#hr/')) {
      const sub = hash.replace('#hr/', '') as HrSubTab;
      if (HR_SUBTABS.some((t) => t.id === sub)) return sub;
    }
    const saved = localStorage.getItem('inva_hr_subtab') as HrSubTab;
    if (saved && HR_SUBTABS.some((t) => t.id === saved)) return saved;
    return 'employees';
  });

  const handleTabChange = (tab: HrSubTab) => {
    setActiveTab(tab);
    localStorage.setItem('inva_hr_subtab', tab);
    window.location.hash = `hr/${tab}`;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#hr/')) {
        const sub = hash.replace('#hr/', '') as HrSubTab;
        if (HR_SUBTABS.some((t) => t.id === sub)) {
          setActiveTab(sub);
          localStorage.setItem('inva_hr_subtab', sub);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ─── Auth State ──────────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [sessionStatus, setSessionStatus] = useState(authService.getSessionState().status);
  const [authLoggingIn, setAuthLoggingIn] = useState(false);

  useEffect(() => {
    const unsubAuth = authService.subscribe((u) => setUser(u));
    const unsubSession = authService.subscribeSession((state) => setSessionStatus(state.status));
    return () => {
      unsubAuth();
      unsubSession();
    };
  }, []);

  const handleQuickLogin = () => window.dispatchEvent(new Event('inva:login-requested'));

  // ─── 4 Core Pillars Hooks (Mirroring hr-system) ──────────────────────
  const {
    employees,
    counts,
    loading: loadingEmployees,
    error: employeeError,
    refetch: refetchEmployees,
    createEmployee,
    updateEmployee,
    toggleStatus,
  } = useEmployees();

  const {
    companies,
    branches,
    departments,
    loading: loadingOrgs,
    refetch: refetchOrgs,
    createCompany,
    createBranch,
    createDepartment,
    updateCompany,
    updateBranch,
    updateDepartment,
    deleteCompany,
    deleteBranch,
    deleteDepartment,
  } = useOrganizations();

  const {
    todayStatus,
    records: attendanceRecords,
    loading: loadingAttendance,
    error: attendanceError,
    punching,
    refetch: refetchAttendance,
    clockIn,
    clockOut,
  } = useAttendance();

  const {
    leaveTypes,
    requests: leaveRequests,
    loading: loadingLeaves,
    error: leaveError,
    refetch: refetchLeaves,
    submitLeave,
    approveLeave,
    rejectLeave,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  } = useLeaves();

  useEffect(() => {
    if (activeTab === 'attendance') void refetchAttendance();
    if (activeTab === 'leaves') void refetchLeaves();
  }, [activeTab, refetchLeaves, refetchAttendance]);

  // ─── Governance & Policies State ─────────────────────────────────────
  const [roles, setRoles] = useState<HrRole[]>([]);
  const [config, setConfig] = useState<HrConfig | null>(null);
  const [loadingGovernance, setLoadingGovernance] = useState(false);

  const fetchGovernance = async () => {
    try {
      setLoadingGovernance(true);
      const [r, c] = await Promise.allSettled([
        hrService.getHrRoles(),
        hrService.getHrConfig(),
      ]);
      if (r.status === 'fulfilled') setRoles(Array.isArray(r.value) ? r.value : []);
      if (c.status === 'fulfilled') setConfig(c.value);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingGovernance(false);
    }
  };

  useEffect(() => {
    fetchGovernance();
  }, [user]);

  const refreshAll = () => {
    refetchEmployees();
    refetchOrgs();
    refetchAttendance();
    refetchLeaves();
    fetchGovernance();
  };

  const handleCreateRole = async (dto: any) => {
    const res = await hrService.createHrRole(dto);
    await fetchGovernance();
    return res;
  };

  const handleDeleteRole = async (id: string) => {
    const res = await hrService.deleteHrRole(id);
    await fetchGovernance();
    return res;
  };

  const handleUpdateRole = async (id: string, dto: any) => {
    const res = await hrService.updateHrRole(id, dto);
    await fetchGovernance();
    return res;
  };

  const handleSaveConfig = async (payload: Partial<HrConfig>) => {
    const res = await hrService.updateHrConfig(payload);
    await fetchGovernance();
    return res;
  };

  const isGlobalLoading =
    loadingEmployees || loadingOrgs || loadingAttendance || loadingLeaves || loadingGovernance;

  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header & Module Title ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                Human Resources Suite
              </h1>
              <Badge variant="primary">Core v2</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enterprise management for Staff, Organizational Hierarchy, Live Attendance, and Leave Entitlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshAll}
            disabled={isGlobalLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isGlobalLoading ? 'animate-spin text-indigo-400' : ''}`} />}
            title="Refresh All HR Data"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* ── Unauthenticated Alert Banner ──────────────────────────────── */}
      {!user && sessionStatus === 'signed-out' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Authentication Required</h4>
              <p className="text-xs text-amber-400/80">
                HR endpoints require an authenticated internal admin token. Sign in with your account to continue.
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            size="sm"
            onClick={handleQuickLogin}
            disabled={authLoggingIn}
            isLoading={authLoggingIn}
            leftIcon={!authLoggingIn ? <LogIn className="w-4 h-4" /> : undefined}
          >
            Sign in (Admin)
          </Button>
        </div>
      )}

      {/* ── Top Synchronized Metric Stat Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Personnel */}
        <div
          onClick={() => handleTabChange('employees')}
          className="bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Personnel Directory</p>
            <p className="text-2xl font-bold text-white mt-1 group-hover:text-indigo-400 transition-colors">
              {counts?.total ?? employees.length}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">
              {counts?.active ?? employees.filter((e) => e.isActive).length} active members
            </p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Organizations */}
        <div
          onClick={() => handleTabChange('organizations')}
          className="bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Corporate Structure</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">
              {companies.length} <span className="text-sm font-normal text-slate-500">Co.</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {branches.length} branches • {departments.length} depts
            </p>
          </div>
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Attendance Status */}
        <div
          onClick={() => handleTabChange('attendance')}
          className="bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Today's Attendance</p>
            <p className="text-xl font-bold text-white mt-1 truncate max-w-[130px]">
              {loadingAttendance || todayStatus.status === 'UNAVAILABLE' ? 'Unavailable' : todayStatus.status === 'NO_EMPLOYEE_PROFILE' ? 'No employee profile' : todayStatus.status === 'CHECKED_IN'
                ? 'Checked In'
                : todayStatus.status === 'CHECKED_OUT'
                ? 'Checked Out'
                : 'Not Checked In'}
            </p>
            <p className="text-[11px] text-indigo-400 mt-0.5">
              {attendanceRecords.length} records logged
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Leaves Pending */}
        <div
          onClick={() => handleTabChange('leaves')}
          className="bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs text-slate-400 font-medium">Leave Applications</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingLeavesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {leaveTypes.length} active leave policies
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-x-auto shadow-inner">
        {HR_SUBTABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'leaves' && pendingLeavesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold">
                  {pendingLeavesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Modules ───────────────────────────────────────── */}
      <div className="min-h-[480px]">
        {/* 1. Employees */}
        {activeTab === 'employees' && (
          <EmployeesTab
            employees={employees}
            departments={departments}
            loading={loadingEmployees}
            error={employeeError}
            onRefresh={refetchEmployees}
            onCreateEmployee={createEmployee}
            onUpdateEmployee={updateEmployee}
            onToggleStatus={toggleStatus}
          />
        )}

        {/* 2. Organizations */}
        {activeTab === 'organizations' && (
          <OrganizationsTab
            companies={companies}
            branches={branches}
            departments={departments}
            loading={loadingOrgs}
            onRefresh={refetchOrgs}
            onCreateCompany={createCompany}
            onCreateBranch={createBranch}
            onCreateDepartment={createDepartment}
            onUpdateCompany={updateCompany}
            onUpdateBranch={updateBranch}
            onUpdateDepartment={updateDepartment}
            onDeleteCompany={deleteCompany}
            onDeleteBranch={deleteBranch}
            onDeleteDepartment={deleteDepartment}
          />
        )}

        {/* 3. Attendance */}
        {activeTab === 'attendance' && (
          <AttendanceTab
            todayStatus={todayStatus}
            records={attendanceRecords}
            employees={employees}
            loading={loadingAttendance}
            error={attendanceError}
            punching={punching}
            onRefresh={refetchAttendance}
            onClockIn={clockIn}
            onClockOut={clockOut}
          />
        )}

        {/* 4. Leaves */}
        {activeTab === 'leaves' && (
          <LeavesTab
            leaveTypes={leaveTypes}
            requests={leaveRequests}
            employees={employees}
            loading={loadingLeaves}
            error={leaveError}
            onRefresh={refetchLeaves}
            onSubmitLeave={submitLeave}
            onApproveLeave={approveLeave}
            onRejectLeave={rejectLeave}
            onCreateLeaveType={createLeaveType}
            onUpdateLeaveType={updateLeaveType}
            onDeleteLeaveType={deleteLeaveType}
          />
        )}

        {/* 5. Roles */}
        {activeTab === 'roles' && (
          <RolesTab
            roles={roles}
            loading={loadingGovernance}
            onRefresh={fetchGovernance}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
            onUpdateRole={handleUpdateRole}
          />
        )}

        {/* 6. Settings */}
        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            loading={loadingGovernance}
            onRefresh={fetchGovernance}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </div>
    </div>
  );
};
