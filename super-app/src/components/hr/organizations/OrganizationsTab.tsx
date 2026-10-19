import React, { useState } from 'react';
import {
  Building,
  GitBranch,
  Layers,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Mail,
  Phone,
  Globe,
  RefreshCw,
} from 'lucide-react';
import {
  Company,
  Branch,
  Department,
  CreateCompanyDto,
  CreateBranchDto,
  CreateDepartmentDto,
} from '../../../services/hr.service';
import {
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Modal,
  DatalistSelect,
} from '../../common';

interface OrganizationsTabProps {
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  loading: boolean;
  onRefresh: () => void;
  onCreateCompany: (dto: CreateCompanyDto) => Promise<any>;
  onCreateBranch: (dto: CreateBranchDto) => Promise<any>;
  onCreateDepartment: (dto: CreateDepartmentDto) => Promise<any>;
  onUpdateCompany: (id: string, dto: Partial<CreateCompanyDto>) => Promise<any>;
  onUpdateBranch: (id: string, dto: Partial<CreateBranchDto>) => Promise<any>;
  onUpdateDepartment: (id: string, dto: Partial<CreateDepartmentDto>) => Promise<any>;
  onDeleteCompany: (id: string) => Promise<any>;
  onDeleteBranch: (id: string) => Promise<any>;
  onDeleteDepartment: (id: string) => Promise<any>;
}

type OrgSubSection = 'companies' | 'branches' | 'departments';

export const OrganizationsTab: React.FC<OrganizationsTabProps> = ({
  companies,
  branches,
  departments,
  loading,
  onRefresh,
  onCreateCompany,
  onCreateBranch,
  onCreateDepartment,
  onUpdateCompany,
  onUpdateBranch,
  onUpdateDepartment,
  onDeleteCompany,
  onDeleteBranch,
  onDeleteDepartment,
}) => {
  const [activeSection, setActiveSection] = useState<OrgSubSection>('companies');

  // Create Modals
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Edit state — holds the record being edited (null = create mode)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Forms
  const [companyForm, setCompanyForm] = useState<CreateCompanyDto>({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    status: 'ACTIVE',
  });

  const [branchForm, setBranchForm] = useState<CreateBranchDto>({
    companyId: '',
    name: '',
    code: '',
    address: '',
    status: 'ACTIVE',
  });

  const [deptForm, setDeptForm] = useState<CreateDepartmentDto>({
    name: '',
    code: '',
    companyId: '',
    branchId: '',
    parentId: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Remove empty-string / undefined / null fields so optional validators don't fail */
  const stripEmpty = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ) as Partial<T>;

  // ── Create Handlers ────────────────────────────────────────────────────
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.code) {
      setFormError('Company Name and Code are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      if (editingCompany) {
        await onUpdateCompany(editingCompany.id, stripEmpty(companyForm) as any);
      } else {
        await onCreateCompany(stripEmpty(companyForm) as any);
      }
      setIsCompanyModalOpen(false);
      setEditingCompany(null);
      setCompanyForm({ name: '', code: '', email: '', phone: '', website: '', address: '', status: 'ACTIVE' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.companyId || !branchForm.name || !branchForm.code) {
      setFormError('Please select a Company and enter Branch Name and Code.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      if (editingBranch) {
        await onUpdateBranch(editingBranch.id, stripEmpty(branchForm) as any);
      } else {
        await onCreateBranch(stripEmpty(branchForm) as any);
      }
      setIsBranchModalOpen(false);
      setEditingBranch(null);
      setBranchForm({ companyId: '', name: '', code: '', address: '', status: 'ACTIVE' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      setFormError('Department Name and Code are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      if (editingDept) {
        await onUpdateDepartment(editingDept.id, stripEmpty(deptForm) as any);
      } else {
        await onCreateDepartment(stripEmpty(deptForm) as any);
      }
      setIsDeptModalOpen(false);
      setEditingDept(null);
      setDeptForm({ name: '', code: '', companyId: '', branchId: '', parentId: '', description: '' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit openers — pre-fill form then open modal ──────────────────────
  const openEditCompany = (comp: Company) => {
    setEditingCompany(comp);
    setCompanyForm({
      name: comp.name,
      code: comp.code,
      email: comp.email ?? '',
      phone: comp.phone ?? '',
      website: comp.website ?? '',
      address: comp.address ?? '',
      status: (comp.status as any) ?? 'ACTIVE',
    });
    setFormError(null);
    setIsCompanyModalOpen(true);
  };

  const openEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({
      companyId: b.companyId,
      name: b.name,
      code: b.code,
      address: b.address ?? '',
      latitude: b.latitude ?? undefined,
      longitude: b.longitude ?? undefined,
      radiusMeters: b.radiusMeters ?? undefined,
      status: (b.status as any) ?? 'ACTIVE',
    });
    setFormError(null);
    setIsBranchModalOpen(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      companyId: dept.companyId ?? '',
      branchId: dept.branchId ?? '',
      parentId: dept.parentId ?? '',
      description: dept.description ?? '',
    });
    setFormError(null);
    setIsDeptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Sub Navigation Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Button
            variant={activeSection === 'companies' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setActiveSection('companies')}
            leftIcon={<Building className="w-4 h-4" />}
          >
            <span>Companies</span>
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-800/40 rounded-full text-xs font-mono">
              {companies.length}
            </span>
          </Button>

          <Button
            variant={activeSection === 'branches' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setActiveSection('branches')}
            leftIcon={<GitBranch className="w-4 h-4" />}
          >
            <span>Branches</span>
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-800/40 rounded-full text-xs font-mono">
              {branches.length}
            </span>
          </Button>

          <Button
            variant={activeSection === 'departments' ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setActiveSection('departments')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            <span>Departments</span>
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-800/40 rounded-full text-xs font-mono">
              {departments.length}
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            size="icon"
            onClick={onRefresh}
            isLoading={loading}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {activeSection === 'companies' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCompanyModalOpen(true)}
            >
              Add Company
            </Button>
          )}

          {activeSection === 'branches' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsBranchModalOpen(true)}
            >
              Add Branch
            </Button>
          )}

          {activeSection === 'departments' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsDeptModalOpen(true)}
            >
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* ── 1. Companies Section ───────────────────────────────────────── */}
      {activeSection === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Building className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 font-medium">No registered companies</p>
              <p className="text-xs text-slate-600 mt-1">Register your first corporate entity to organize branches.</p>
            </div>
          ) : (
            companies.map((comp) => (
              <div
                key={comp.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{comp.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono text-indigo-400">
                          {comp.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditCompany(comp)}
                        className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                        title="Edit Company"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteCompany(comp.id)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    {comp.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{comp.address}</span>
                      </div>
                    )}
                    {comp.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{comp.email}</span>
                      </div>
                    )}
                    {comp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{comp.phone}</span>
                      </div>
                    )}
                    {comp.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span className="truncate">{comp.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Branches: {branches.filter((b) => b.companyId === comp.id).length}
                  </span>
                  <Badge variant={comp.status === 'INACTIVE' ? 'danger' : 'success'} dot>
                    {comp.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 2. Branches Section ────────────────────────────────────────── */}
      {activeSection === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <GitBranch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 font-medium">No branch locations registered</p>
              <p className="text-xs text-slate-600 mt-1">Add branch offices and associate them with a company.</p>
            </div>
          ) : (
            branches.map((b) => {
              const comp = companies.find((c) => c.id === b.companyId);
              return (
                <div
                  key={b.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{b.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {comp ? comp.name : 'Unknown Company'} •{' '}
                          <span className="font-mono text-indigo-400">{b.code}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditBranch(b)}
                          className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                          title="Edit Branch"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDeleteBranch(b.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-400">
                      {b.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{b.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Depts in Branch: {departments.filter((d) => d.branchId === b.id).length}
                    </span>
                    <Badge variant="success" dot>Active</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 3. Departments Section ─────────────────────────────────────── */}
      {activeSection === 'departments' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Parent Dept</th>
                  <th className="px-6 py-4">Company & Branch</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="w-8 h-8 text-slate-600" />
                        <span className="font-medium">No departments registered</span>
                        <span className="text-xs text-slate-600">
                          Create functional departments (Engineering, HR, Sales, etc.)
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => {
                    const parent = departments.find((d) => d.id === dept.parentId);
                    const comp = companies.find((c) => c.id === dept.companyId);
                    const branch = branches.find((b) => b.id === dept.branchId);

                    return (
                      <tr key={dept.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                              <Layers className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-white">{dept.name}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-sky-400">
                            {dept.code}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400">
                          {parent ? (
                            <span className="px-2 py-1 bg-slate-800/60 rounded text-slate-300">
                              ↳ {parent.name}
                            </span>
                          ) : (
                            <span className="text-slate-600">— Top Level —</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400">
                          <div>
                            <p className="text-slate-300">{comp?.name || 'All Companies'}</p>
                            <p className="text-slate-500 text-[11px]">{branch?.name || 'All Branches'}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                          {dept.description || '—'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDept(dept)}
                              className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                              title="Edit Department"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onDeleteDepartment(dept.id)}
                              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Create Company ─────────────────────────────────────── */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => { setIsCompanyModalOpen(false); setEditingCompany(null); setFormError(null); }}
        title={editingCompany ? `Edit: ${editingCompany.name}` : 'Add New Company'}
        icon={<Building className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Company Name</Label>
            <Input
              required
              placeholder="e.g. INVA Global Ltd"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Code</Label>
              <Input
                required
                placeholder="e.g. INVA-HQ"
                value={companyForm.code}
                onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="+855 23 123 456"
                value={companyForm.phone ?? ''}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="hr@company.com"
              value={companyForm.email ?? ''}
              onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              type="url"
              placeholder="https://company.com"
              value={companyForm.website ?? ''}
              onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              placeholder="No. 123, Main Street, Phnom Penh"
              value={companyForm.address ?? ''}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCompanyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Company
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Create Branch ──────────────────────────────────────── */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => { setIsBranchModalOpen(false); setEditingBranch(null); setFormError(null); }}
        title={editingBranch ? `Edit: ${editingBranch.name}` : 'Add New Branch'}
        icon={<GitBranch className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Company</Label>
            <DatalistSelect
              required
              value={branchForm.companyId}
              onChange={(val) => setBranchForm({ ...branchForm, companyId: val })}
              options={companies.map((c) => ({
                id: c.id,
                label: c.name,
                sublabel: c.code,
              }))}
              placeholder="Select Company"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Branch Name</Label>
              <Input
                required
                placeholder="e.g. Phnom Penh Branch"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label required>Code</Label>
              <Input
                required
                placeholder="e.g. PP-01"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input
              placeholder="Physical address or street"
              value={branchForm.address ?? ''}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="11.5564"
                value={branchForm.latitude ?? ''}
                onChange={(e) => setBranchForm({ ...branchForm, latitude: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="104.9282"
                value={branchForm.longitude ?? ''}
                onChange={(e) => setBranchForm({ ...branchForm, longitude: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label>Radius (m)</Label>
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={branchForm.radiusMeters ?? ''}
                onChange={(e) => setBranchForm({ ...branchForm, radiusMeters: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-1">Optional: geo-fence coordinates for mobile clock-in.</p>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBranchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Create Department ──────────────────────────────────── */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => { setIsDeptModalOpen(false); setEditingDept(null); setFormError(null); }}
        title={editingDept ? `Edit: ${editingDept.name}` : 'Add New Department'}
        icon={<Layers className="w-4 h-4 text-sky-400" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Department Name</Label>
            <Input
              required
              placeholder="e.g. Engineering & IT"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Code</Label>
              <Input
                required
                placeholder="e.g. ENG"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Parent Dept</Label>
              <DatalistSelect
                value={deptForm.parentId || ''}
                onChange={(val) => setDeptForm({ ...deptForm, parentId: val })}
                options={[
                  { id: '', label: 'None (Top Level)' },
                  ...departments.map((d) => ({
                    id: d.id,
                    label: d.name,
                    sublabel: d.code,
                  })),
                ]}
                placeholder="None (Top Level)"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <DatalistSelect
                value={deptForm.companyId || ''}
                onChange={(val) => setDeptForm({ ...deptForm, companyId: val })}
                options={[
                  { id: '', label: 'All Companies' },
                  ...companies.map((c) => ({
                    id: c.id,
                    label: c.name,
                    sublabel: c.code,
                  })),
                ]}
                placeholder="All Companies"
              />
            </div>
            <div>
              <Label>Branch</Label>
              <DatalistSelect
                value={deptForm.branchId || ''}
                onChange={(val) => setDeptForm({ ...deptForm, branchId: val })}
                options={[
                  { id: '', label: 'All Branches' },
                  ...branches.map((b) => ({
                    id: b.id,
                    label: b.name,
                    sublabel: b.code,
                  })),
                ]}
                placeholder="All Branches"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Department mission and scope..."
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
