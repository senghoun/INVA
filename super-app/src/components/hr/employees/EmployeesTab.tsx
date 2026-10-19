import { CreateEmployeeModal } from './CreateEmployeeModal';
import { EmployeeAccessModal } from './EmployeeAccessModal';
import { hrService } from '../../../services/hr.service';
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
  Briefcase,
  Eye,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { EmployeeProfile, Department, CreateEmployeeDto } from '../../../services/hr.service';
import {
  Button,
  Input,
  Label,
  Badge,
  Modal,
  DatalistSelect,
  ErrorState,
} from '../../common';

interface EmployeesTabProps {
  employees: EmployeeProfile[];
  departments: Department[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onCreateEmployee: (dto: CreateEmployeeDto) => Promise<EmployeeProfile>;
  onUpdateEmployee: (id: string, dto: Partial<CreateEmployeeDto>) => Promise<EmployeeProfile>;
  onToggleStatus: (id: string) => Promise<any>;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  departments,
  loading,
  error,
  onRefresh,
  onCreateEmployee,
  onUpdateEmployee,
  onToggleStatus,
}) => {
  const [accessEmployee, setAccessEmployee] = useState<EmployeeProfile | null>(null);
  const [canManageAccess, setCanManageAccess] = useState(false);
  useEffect(() => { let active = true; void hrService.getMyHrAccess().then(access => { if (active) setCanManageAccess(access.administrator || access.permissions.includes('hr:roles:manage')); }).catch(() => { if (active) setCanManageAccess(false); }); return () => { active = false; }; }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const title = (emp.jobTitle || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      fullName.includes(search) ||
      code.includes(search) ||
      email.includes(search) ||
      title.includes(search);

    const matchesDept = !deptFilter || emp.departmentId === deptFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && emp.isActive) ||
      (statusFilter === 'INACTIVE' && !emp.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;
  const directoryUnavailable = !!error && employees.length === 0;


  return (
    <div className="space-y-6">
      {error && <ErrorState title="Employee directory could not be fully loaded" message={error} onRetry={onRefresh} retrying={loading} />}
      {/* ── Top Metric Stat Ribbon ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Personnel</p>
            <p className="text-2xl font-bold text-white mt-1">{directoryUnavailable ? '—' : employees.length}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Staff</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{directoryUnavailable ? '—' : activeCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Inactive / On Leave</p>
            <p className="text-2xl font-bold text-slate-300 mt-1">{directoryUnavailable ? '—' : inactiveCount}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-400 border border-slate-700">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Departments</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{departments.length}</p>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Input
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Search by name, employee code, role, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-56 sm:w-60">
            <DatalistSelect
              value={deptFilter}
              onChange={(val) => setDeptFilter(val)}
              options={[
                { id: '', label: 'All Departments' },
                ...departments.map((dept) => ({
                  id: dept.id,
                  label: dept.name,
                  sublabel: dept.code,
                })),
              ]}
              placeholder="All Departments"
            />
          </div>

          <div className="w-40 sm:w-44">
            <DatalistSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter((val || 'ALL') as any)}
              options={[
                { id: 'ALL', label: 'All Status' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'INACTIVE', label: 'Inactive' },
              ]}
              placeholder="All Status"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Button
            variant="secondary"
            size="icon"
            onClick={onRefresh}
            isLoading={loading}
            title="Refresh Personnel Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* ── Employee Directory Table ─────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Personnel</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Role & Dept</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading personnel records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <span className="text-slate-400 font-medium">{error ? 'Employee data is unavailable' : 'No personnel found'}</span>
                      <span className="text-xs text-slate-600">
                        {error ? 'Retry loading the directory to see current records.' : 'Try adjusting your search criteria or add a new employee profile.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-900/30 flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{emp.email || 'No email registered'}</p>
                            <p className={`text-xs mt-1 ${emp.authUserId ? 'text-emerald-400' : 'text-amber-300'}`}>{emp.authUserId ? 'Login account linked' : 'No login account linked'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs font-mono font-medium text-slate-300">
                          {emp.employeeCode || 'N/A'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-200">{emp.jobTitle}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-sky-400" />
                            {dept?.name || emp.department?.name || 'Unassigned'}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {emp.phone ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {emp.phone}
                          </span>
                        ) : (
                          <span className="text-slate-600">No phone</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={emp.isActive ? 'success' : 'danger'}
                          dot
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onToggleStatus(emp.id)}
                          title="Click to toggle active status"
                        >
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {canManageAccess && <Button size="sm" variant="ghost" onClick={() => setAccessEmployee(emp)}>HR access</Button>}
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                          onClick={() => setEditingEmployee(emp)}
                          title="Edit Profile"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedEmployee(emp)}
                          title="View Profile Details"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && <CreateEmployeeModal departments={departments} onCreate={onCreateEmployee}
        onClose={() => setIsAddModalOpen(false)}
        onManageAccess={canManageAccess ? employee => { setIsAddModalOpen(false); setAccessEmployee(employee); } : undefined} />}

      {editingEmployee && <CreateEmployeeModal departments={departments} onCreate={onCreateEmployee}
        onUpdate={onUpdateEmployee} editingEmployee={editingEmployee}
        onClose={() => setEditingEmployee(null)} />}

      {accessEmployee && <EmployeeAccessModal employee={accessEmployee} onClose={() => setAccessEmployee(null)} />}
      {/* ── View Employee Details Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Staff Profile"
        icon={<Briefcase className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white text-xl font-bold flex items-center justify-center shadow-lg">
                {selectedEmployee.firstName?.[0]}
                {selectedEmployee.lastName?.[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h4>
                <p className="text-xs text-indigo-400 font-medium">{selectedEmployee.jobTitle}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded">
                  {selectedEmployee.employeeCode}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="text-white font-medium">
                  {departments.find((d) => d.id === selectedEmployee.departmentId)?.name ||
                    selectedEmployee.department?.name ||
                    'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <Badge variant={selectedEmployee.isActive ? 'success' : 'danger'} dot>
                  {selectedEmployee.isActive ? 'Active Member' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hire Date</span>
                <span className="text-white">
                  {selectedEmployee.hireDate || selectedEmployee.startDate || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Work Email</span>
                <span className="text-white">{selectedEmployee.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone</span>
                <span className="text-white">{selectedEmployee.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
