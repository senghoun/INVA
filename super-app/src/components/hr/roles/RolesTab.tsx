import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  X,
  Minus,
  Edit2,
  LayoutGrid,
  Grid3x3,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Coins,
  Shield,
  Filter,
} from 'lucide-react';
import { HrRole, CreateHrRoleDto, UpdateHrRoleDto } from '../../../services/hr.service';
import {
  Button,
  Input,
  Label,
  Textarea,
  Modal,
  Badge,
  DatalistSelect,
} from '../../common';

interface RolesTabProps {
  roles: HrRole[];
  loading: boolean;
  onRefresh: () => void;
  onCreateRole: (dto: CreateHrRoleDto) => Promise<any>;
  onDeleteRole: (id: string) => Promise<any>;
  onUpdateRole?: (id: string, dto: UpdateHrRoleDto) => Promise<any>;
}

export interface PermissionDefinition {
  key: string;
  label: string;
  module: 'personnel' | 'organization' | 'attendance' | 'leaves' | 'payroll' | 'governance' | string;
  description: string;
}

const MODULE_META: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  personnel: {
    label: 'Personnel & Directory',
    icon: Users,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  organization: {
    label: 'Organization & Structure',
    icon: Building2,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  attendance: {
    label: 'Time & Attendance',
    icon: Clock,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  leaves: {
    label: 'Leave Entitlements',
    icon: CalendarDays,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  payroll: {
    label: 'Payroll & Compensation',
    icon: Coins,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  governance: {
    label: 'Governance & Security',
    icon: Shield,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
};

const STANDARD_PERMISSIONS: PermissionDefinition[] = [
  // 1. Personnel & Staff Directory
  {
    key: 'hr:self:read',
    label: 'View Own Profile',
    module: 'personnel',
    description: 'Personal employee profile, work history, and contact details',
  },
  {
    key: 'hr:employees:read',
    label: 'Browse Employee Directory',
    module: 'personnel',
    description: 'Search and inspect personnel records, roles, and status',
  },
  {
    key: 'hr:employees:write',
    label: 'Create & Update Staff',
    module: 'personnel',
    description: 'Onboard new personnel and edit personal or contract data',
  },
  {
    key: 'hr:employees:delete',
    label: 'Archive / Deactivate Staff',
    module: 'personnel',
    description: 'Offboard employees and toggle active directory status',
  },

  // 2. Organization & Structure
  {
    key: 'hr:departments:read',
    label: 'View Departments & Hierarchy',
    module: 'organization',
    description: 'Access organizational structure, departments, and units',
  },
  {
    key: 'hr:departments:manage',
    label: 'Manage Departments',
    module: 'organization',
    description: 'Create, update, and restructure organizational departments',
  },
  {
    key: 'hr:organizations:read',
    label: 'View Companies & Branches',
    module: 'organization',
    description: 'View corporate entities, branch addresses, and tax numbers',
  },
  {
    key: 'hr:organizations:write',
    label: 'Manage Corporate Entities',
    module: 'organization',
    description: 'Establish and update legal entities, branches, and HQ details',
  },

  // 3. Time & Attendance
  {
    key: 'hr:attendance:read',
    label: 'Inspect Attendance Logs',
    module: 'attendance',
    description: 'View real-time check-ins, check-outs, and shift records',
  },
  {
    key: 'hr:attendance:clock',
    label: 'Clock In / Out (Own Record)',
    module: 'attendance',
    description: 'Clock in, clock out and submit late requests for your own employee only',
  },
  {
    key: 'hr:attendance:write',
    label: 'Manage Attendance & Shifts',
    module: 'attendance',
    description: 'Authorize attendance overrides and timesheet corrections',
  },

  // 4. Leave Entitlements
  {
    key: 'hr:leaves:request',
    label: 'Submit Leave Requests',
    module: 'leaves',
    description: 'Self-service submission of annual, sick, or casual leave requests',
  },
  {
    key: 'hr:leaves:read',
    label: 'View Staff Leave Records',
    module: 'leaves',
    description: 'Monitor organizational leave calendars, approval queues, and quotas',
  },
  {
    key: 'hr:leaves:write',
    label: 'Manage Leave Policies',
    module: 'leaves',
    description: 'Configure leave allowances and policy types',
  },
  {
    key: 'hr:leaves:approve',
    label: 'Authorize / Reject Leaves',
    module: 'leaves',
    description: 'Managerial review and approval decisions for staff time-off',
  },

  // 5. Payroll & Compensation
  {
    key: 'hr:payroll:view_own',
    label: 'Access Personal Payslips',
    module: 'payroll',
    description: 'Self-service view and download of monthly compensation statements',
  },
  {
    key: 'hr:payroll:read',
    label: 'View Department Payroll',
    module: 'payroll',
    description: 'Review salary summaries and departmental payroll sheets',
  },
  {
    key: 'hr:payroll:manage',
    label: 'Prepare Payroll Runs',
    module: 'payroll',
    description: 'Calculate salary adjustments, deductions, and tax allowances',
  },
  {
    key: 'hr:payroll:execute',
    label: 'Execute & Finalize Payroll',
    module: 'payroll',
    description: 'Disburse salaries and lock finalized monthly payroll runs',
  },

  // 6. Governance & Security
  {
    key: 'hr:roles:manage',
    label: 'Manage Roles & RBAC',
    module: 'governance',
    description: 'Create security tiers and assign granular capabilities',
  },
  {
    key: 'hr:config:manage',
    label: 'Configure System Policies',
    module: 'governance',
    description: 'Configure working hours, attendance tolerances, and portal configs',
  },
];

export const RolesTab: React.FC<RolesTabProps> = ({
  roles,
  loading,
  onRefresh,
  onCreateRole,
  onDeleteRole,
  onUpdateRole,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [togglingCell, setTogglingCell] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<CreateHrRoleDto>({
    name: '',
    description: '',
    permissions: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<HrRole | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: [],
  });

  // Dynamic list collecting all standard + custom permissions
  const allPermissions = useMemo(() => {
    const knownKeys = new Set(STANDARD_PERMISSIONS.map((p) => p.key));
    const dynamicList = [...STANDARD_PERMISSIONS];

    roles.forEach((r) => {
      (r.permissions || []).forEach((perm) => {
        if (!knownKeys.has(perm)) {
          knownKeys.add(perm);
          const parts = perm.split(':');
          const mod = parts.length > 1 ? parts[1] : 'governance';
          dynamicList.push({
            key: perm,
            label: perm.replace(/^[a-z]+:/, '').replace(/:/g, ' ').toUpperCase(),
            module: mod,
            description: `Permission capability for ${perm}`,
          });
        }
      });
    });

    return dynamicList;
  }, [roles]);

  // Filtered permissions by search and module
  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      const matchesSearch =
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule = selectedModule === 'all' || p.module === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [allPermissions, searchTerm, selectedModule]);

  // Group filtered permissions by module
  const permissionsByModule = useMemo(() => {
    const groups: { [key: string]: PermissionDefinition[] } = {};
    filteredPermissions.forEach((p) => {
      if (!groups[p.module]) {
        groups[p.module] = [];
      }
      groups[p.module].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  // Toggle permission cell in real-time
  const handleToggleCell = async (role: HrRole, permKey: string) => {
    if (!onUpdateRole) return;
    const currentPerms = role.permissions || [];
    const hasPerm = currentPerms.includes(permKey);
    const updatedPerms = hasPerm
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];

    const cellId = `${role.id}:${permKey}`;
    try {
      setTogglingCell(cellId);
      await onUpdateRole(role.id, { permissions: updatedPerms });
    } catch (err: any) {
      console.error('Failed to toggle permission:', err);
    } finally {
      setTogglingCell(null);
    }
  };

  // Toggle permission in create/edit modal
  const toggleModalPermission = (permKey: string, isEditing: boolean) => {
    if (isEditing) {
      setEditForm((prev) => {
        const exists = prev.permissions.includes(permKey);
        return {
          ...prev,
          permissions: exists
            ? prev.permissions.filter((p) => p !== permKey)
            : [...prev.permissions, permKey],
        };
      });
    } else {
      setRoleForm((prev) => {
        const exists = prev.permissions.includes(permKey);
        return {
          ...prev,
          permissions: exists
            ? prev.permissions.filter((p) => p !== permKey)
            : [...prev.permissions, permKey],
        };
      });
    }
  };

  // Submit Create Role
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      setFormError('Role Name is required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await onCreateRole(roleForm);
      setIsCreateModalOpen(false);
      setRoleForm({ name: '', description: '', permissions: [] });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (role: HrRole) => {
    setEditingRole(role);
    setEditForm({
      name: role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])],
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Role
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      setSubmitting(true);
      setFormError(null);
      if (onUpdateRole) {
        await onUpdateRole(editingRole.id, editForm);
      }
      setIsEditModalOpen(false);
      setEditingRole(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const moduleFilterOptions = [
    { id: 'all', label: 'All Functional Modules' },
    ...Object.entries(MODULE_META).map(([id, meta]) => ({
      id,
      label: meta.label,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* ── Sub Header / Ribbon ────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Roles & Permission Governance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive matrix of access rights and operational capabilities across all HR modules.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Search Input */}
          <div className="w-full sm:w-56">
            <Input
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Module Filter Select */}
          <div className="w-full sm:w-52">
            <DatalistSelect
              value={selectedModule}
              onChange={(val) => setSelectedModule(val || 'all')}
              options={moduleFilterOptions}
              placeholder="All Functional Modules"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl h-10">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Permission Matrix View"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onRefresh}
            isLoading={loading}
            title="Refresh Roles"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Create Role Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Role
          </Button>
        </div>
      </div>

      {/* ── View 1: ROLES & ACCESS MATRIX VIEW ────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Matrix Header Bar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Grid3x3 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-white text-sm">
                Role Capability Matrix
              </span>
              <Badge variant="primary" size="sm">
                {roles.length} Roles
              </Badge>
              <Badge variant="default" size="sm">
                {filteredPermissions.length} Capabilities
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Granted Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span>No Access</span>
              </div>
              <span className="text-slate-500 hidden md:inline">
                • Click any cell to toggle access
              </span>
            </div>
          </div>

          {/* Responsive Matrix Table */}
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md z-30 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 shadow-sm">
                <tr>
                  {/* Pinned Left Column: Capability Info */}
                  <th className="px-5 py-4 min-w-[320px] sm:min-w-[380px] sticky left-0 bg-slate-950/95 backdrop-blur-md z-40 border-r border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span>Capability & Functional Scope</span>
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>

                  {/* Dynamic Role Columns */}
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="px-4 py-3.5 min-w-[170px] sm:min-w-[195px] text-center border-r border-slate-800/50 last:border-r-0"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-bold text-white text-xs tracking-wider">
                            {role.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(role)}
                            className="text-slate-500 hover:text-indigo-400 h-6 w-6"
                            title={`Edit ${role.name}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDeleteRole(role.id)}
                            className="text-slate-500 hover:text-rose-400 h-6 w-6"
                            title={`Delete ${role.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-indigo-950/70 border border-indigo-800/40 rounded-full text-[10px] font-mono text-indigo-300">
                            {(role.permissions || []).length} / {allPermissions.length} active
                          </span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body Grouped by Module */}
              <tbody className="divide-y divide-slate-800/40">
                {Object.keys(permissionsByModule).length === 0 ? (
                  <tr>
                    <td
                      colSpan={roles.length + 1}
                      className="text-center py-16 text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-slate-600" />
                        <span className="font-medium text-slate-400">
                          No matching capabilities found
                        </span>
                        <span className="text-xs text-slate-600">
                          Try searching for another keyword or change the module filter.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Object.entries(permissionsByModule).map(([moduleKey, perms]) => {
                    const meta = MODULE_META[moduleKey] || {
                      label: moduleKey.toUpperCase(),
                      icon: Shield,
                      color: 'text-slate-400 bg-slate-800/40 border-slate-700/40',
                    };
                    const IconComponent = meta.icon;

                    return (
                      <React.Fragment key={moduleKey}>
                        {/* Module Category Section Row */}
                        <tr className="bg-slate-950/80 border-t-2 border-b border-slate-800/80">
                          <td
                            colSpan={roles.length + 1}
                            className="px-5 py-2.5 text-xs font-bold text-slate-300 tracking-wide"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded-lg border ${meta.color}`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-white font-semibold">
                                {meta.label}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">
                                ({perms.length} capabilities)
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Individual Permission Rows */}
                        {perms.map((perm) => (
                          <tr
                            key={perm.key}
                            className="hover:bg-slate-800/30 transition-colors group"
                          >
                            {/* Pinned Left Capability Column */}
                            <td className="px-5 py-3 sticky left-0 bg-slate-900/95 group-hover:bg-slate-850/95 backdrop-blur-md z-20 border-r border-slate-800/80">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white text-xs sm:text-sm">
                                    {perm.label}
                                  </span>
                                  <code className="text-[10px] font-mono text-indigo-400/90 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/30">
                                    {perm.key}
                                  </code>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  {perm.description}
                                </p>
                              </div>
                            </td>

                            {/* Role Permission Cells */}
                            {roles.map((role) => {
                              const isGranted = (role.permissions || []).includes(perm.key);
                              const isCellToggling = togglingCell === `${role.id}:${perm.key}`;

                              return (
                                <td
                                  key={role.id}
                                  className="px-3 py-2.5 text-center border-r border-slate-800/40 last:border-r-0 align-middle"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCell(role, perm.key)}
                                    disabled={!onUpdateRole || isCellToggling}
                                    className={`group/btn relative inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer focus:outline-none ${
                                      isGranted
                                        ? 'bg-emerald-500/10 hover:bg-rose-500/15 text-emerald-400 hover:text-rose-300 border border-emerald-500/30 hover:border-rose-500/40 shadow-xs'
                                        : 'bg-slate-950/40 hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-400 border border-slate-800/60 hover:border-emerald-500/30'
                                    }`}
                                    title={
                                      isGranted
                                        ? `Click to revoke ${perm.key} from ${role.name}`
                                        : `Click to grant ${perm.key} to ${role.name}`
                                    }
                                  >
                                    {isCellToggling ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                    ) : isGranted ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:hidden" />
                                        <X className="w-3.5 h-3.5 text-rose-400 hidden group-hover/btn:inline" />
                                        <span className="group-hover/btn:hidden">Granted</span>
                                        <span className="hidden group-hover/btn:inline">Revoke</span>
                                      </>
                                    ) : (
                                      <>
                                        <Minus className="w-3.5 h-3.5 text-slate-700 group-hover/btn:hidden" />
                                        <Plus className="w-3.5 h-3.5 text-emerald-400 hidden group-hover/btn:inline" />
                                        <span className="group-hover/btn:hidden">No Access</span>
                                        <span className="hidden group-hover/btn:inline">Grant</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── View 2: ROLES CARDS VIEW (SECONDARY TOGGLE) ───────────────── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 font-medium">No roles created</p>
              <p className="text-xs text-slate-600 mt-1">
                Define customized access roles for managers and staff.
              </p>
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{role.name}</h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditModal(role)}
                        className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                        title="Edit Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteRole(role.id)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                    {role.description || 'Standard access tier across the organization.'}
                  </p>

                  {/* Permissions pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {(role.permissions || []).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modal: Create Role ─────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Create Security Role
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Role Title</Label>
            <Input
              type="text"
              required
              placeholder="e.g. HR Operations Specialist"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Duties and responsibilities associated with this role..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>
                Permission Capabilities ({roleForm.permissions.length} selected)
              </Label>
              <button
                type="button"
                onClick={() =>
                  setRoleForm((prev) => ({
                    ...prev,
                    permissions:
                      prev.permissions.length === allPermissions.length
                        ? []
                        : allPermissions.map((p) => p.key),
                  }))
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                {roleForm.permissions.length === allPermissions.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/80 border border-slate-800 rounded-xl">
              {allPermissions.map((perm) => {
                const selected = roleForm.permissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => toggleModalPermission(perm.key, false)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <p className="font-semibold truncate">{perm.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {perm.key}
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        selected ? 'bg-indigo-500 text-white' : 'border border-slate-700'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              disabled={submitting}
            >
              Save Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Role ───────────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRole(null);
        }}
        title={
          <span className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-400" />
            Edit Security Role: {editingRole?.name}
          </span>
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Role Title</Label>
            <Input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Duties and responsibilities associated with this role..."
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>
                Permission Capabilities ({editForm.permissions.length} selected)
              </Label>
              <button
                type="button"
                onClick={() =>
                  setEditForm((prev) => ({
                    ...prev,
                    permissions:
                      prev.permissions.length === allPermissions.length
                        ? []
                        : allPermissions.map((p) => p.key),
                  }))
                }
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                {editForm.permissions.length === allPermissions.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/80 border border-slate-800 rounded-xl">
              {allPermissions.map((perm) => {
                const selected = editForm.permissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => toggleModalPermission(perm.key, true)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <p className="font-semibold truncate">{perm.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {perm.key}
                      </p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        selected ? 'bg-indigo-500 text-white' : 'border border-slate-700'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingRole(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              disabled={submitting}
            >
              Update Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
