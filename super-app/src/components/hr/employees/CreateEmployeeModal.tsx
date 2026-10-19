import React, { useState, useEffect } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Button, Input, Label, Modal, DatalistSelect, DatePicker } from '../../common';
import { CreateEmployeeDto, Department, EmployeeProfile, Branch, Company, hrService } from '../../../services/hr.service';

import { request } from '../../../services/api';
import { getActiveCompany } from '../../../services/company-context';

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
interface Props {
  departments: Department[];
  onCreate: (dto: CreateEmployeeDto) => Promise<EmployeeProfile>;
  onUpdate?: (id: string, dto: Partial<CreateEmployeeDto>) => Promise<EmployeeProfile>;
  editingEmployee?: EmployeeProfile | null;
  onClose: () => void;
  onManageAccess?: (employee: EmployeeProfile) => void;
}
export const CreateEmployeeModal: React.FC<Props> = ({ departments, onCreate, onUpdate, editingEmployee, onClose, onManageAccess }) => {
  const companyId = getActiveCompany() || '';
  const initialForm = (employee?: EmployeeProfile | null) => ({
    firstName: employee?.firstName || '', lastName: employee?.lastName || '',
    employeeCode: employee?.employeeCode || '', jobTitle: employee?.jobTitle || '',
    hireDate: employee?.hireDate?.split('T')[0] || today(),
    ...Object.fromEntries(['branchId', 'departmentId', 'positionId', 'sectorId', 'employmentTypeId', 'managerId', 'leaderId',
      'englishName', 'khmerName', 'gender', 'dob', 'email', 'phone', 'address', 'nationalId', 'maritalStatus',
      'emergencyContact', 'emergencyPhone', 'probationEnd', 'bankName', 'bankAccountNumber', 'baseSalary']
      .map(key => [key, String((employee as unknown as Record<string, unknown>)?.[key] ?? '').split(key === 'dob' || key === 'probationEnd' ? 'T' : '\u0000')[0]])),
  } as Record<string, string>);
  const [form, setForm] = useState(initialForm(editingEmployee));
  const [original, setOriginal] = useState(initialForm(editingEmployee));
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allowedBranches, setAllowedBranches] = useState<string[]>([]);
  const [positions, setPositions] = useState<{ id: string; name: string; departmentId?: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string; departmentId?: string }[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<{ id: string; name: string }[]>([]);
  const [reporting, setReporting] = useState<EmployeeProfile[]>([]);
  const [canPrivate, setCanPrivate] = useState(false);
  const [canPayroll, setCanPayroll] = useState(false);
  useEffect(() => {
    let active = true;
    const contextChanged = () => { if (getActiveCompany() !== companyId) onClose(); };
    window.addEventListener('inva:company-changed', contextChanged);
    const load = async () => {
      try {
        if (!companyId) throw new Error('Select a company before editing an employee.');
        const [companies, branchList, access, profile] = await Promise.all([
          hrService.getCompanies(), hrService.getBranches(companyId),
          request<{ companyId: string; branchIds: string[]; permissions: string[] }[]>('/api/v1/auth/company-access'),
          editingEmployee ? hrService.getEmployeeById(editingEmployee.id) : Promise.resolve(null),
        ]);
        if (!active) return;
        const assignment = access.find(entry => entry.companyId === companyId);
        if (!assignment) throw new Error('No company assignment is available for this account.');
        setCompany(companies.find(entry => entry.id === companyId) || null);
        setAllowedBranches(assignment.branchIds);
        setBranches(branchList.filter(branch => branch.companyId === companyId && branch.status !== 'INACTIVE' && (!assignment.branchIds.length || assignment.branchIds.includes(branch.id))));
        setCanPrivate(assignment.permissions.includes('hr.employee.private.view'));
        setCanPayroll(assignment.permissions.includes('hr.payroll.manage') && (!editingEmployee || assignment.permissions.includes('hr.payroll.view')));
        if (profile) { setForm(initialForm(profile)); setOriginal(initialForm(profile)); }
        const options = await Promise.allSettled([
          request<{ id: string; name: string; departmentId?: string }[]>('/api/v1/hr/organizations/positions'),
          request<{ id: string; name: string; departmentId?: string }[]>('/api/v1/hr/organizations/sectors'),
          request<{ id: string; name: string }[]>('/api/v1/hr/organizations/employment-types'),
          hrService.getEmployees(),
        ]);
        if (!active) return;
        if (options[0].status === 'fulfilled') setPositions(options[0].value);
        if (options[1].status === 'fulfilled') setSectors(options[1].value);
        if (options[2].status === 'fulfilled') setEmploymentTypes(options[2].value);
        if (options[3].status === 'fulfilled') setReporting(options[3].value.filter(emp => emp.isActive && emp.id !== editingEmployee?.id));
        if (options.some(option => option.status === 'rejected')) setLookupError('Some employment options could not be loaded. Existing assignments will be preserved unless you change them.');
      } catch (failure) { if (active) setError(failure instanceof Error ? failure.message : 'Unable to load profile options.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; window.removeEventListener('inva:company-changed', contextChanged); };
  }, [companyId, editingEmployee?.id]);
  const [activeTab, setActiveTab] = useState('details');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [created, setCreated] = useState<EmployeeProfile | null>(null);
  const set = (key: keyof typeof form, value: string) => { setForm(previous => ({ ...previous, [key]: value })); setError(''); if (key === 'employeeCode') setCodeError(''); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const invalid = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input')).find(input => !input.disabled && !input.validity.valid);
    if (invalid) {
      const tab = invalid.closest<HTMLElement>('[data-employee-tab]')?.dataset.employeeTab;
      if (tab) setActiveTab(tab);
      requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); });
      return;
    }
    const data: Record<string, string> = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), employeeCode: form.employeeCode.trim(), jobTitle: form.jobTitle.trim() };
    if (!data.firstName || !data.lastName || !data.jobTitle || !data.hireDate) { setError('Enter the employee’s name, job title, and hire date.'); return; }
    if (data.employeeCode.length < 3) { setCodeError('Use a unique employee code with 3–32 characters.'); return; }
    setPending(true); setError(''); setCodeError('');
    try {
      if (getActiveCompany() !== companyId) throw new Error('Company changed. Reopen the profile before saving.');
      const payload: CreateEmployeeDto & Record<string, unknown> = {
        companyId, firstName: data.firstName, lastName: data.lastName,
        employeeCode: data.employeeCode, jobTitle: data.jobTitle, hireDate: data.hireDate,
      };
      const privateFields = ['dob', 'address', 'nationalId', 'emergencyContact', 'emergencyPhone'];
      const payrollFields = ['bankName', 'bankAccountNumber', 'baseSalary'];
      for (const [key, raw] of Object.entries(data)) {
        if ((!canPrivate && privateFields.includes(key)) || (!canPayroll && payrollFields.includes(key))) continue;
        if (editingEmployee && raw === original[key]) continue;
        const value = raw.trim();
        if (key === 'baseSalary') {
          if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw new Error('Base salary must be a non-negative amount.');
          if (value || editingEmployee) payload[key] = value ? Number(value) : null;
        } else if (value || editingEmployee) payload[key] = value ? (key === 'email' ? value.toLowerCase() : value) : null;
      }
      const result = editingEmployee && onUpdate
        ? await onUpdate(editingEmployee.id, payload as Partial<CreateEmployeeDto>)
        : await onCreate(payload as CreateEmployeeDto);
        
      setCreated(result);
    } catch (err: any) {
      if (err.status === 409 && /code/i.test(err.message)) { setActiveTab('details'); setCodeError('This employee code is already in use. Enter a different code.'); }
      else setError(err.message || `Could not ${editingEmployee ? 'update' : 'create'} the employee. Your entries have been kept; please try again.`);
    } finally { setPending(false); }
  };
  const field = (key: string, label: string, maxLength: number, type = 'text') => (
    <div key={key}><Label htmlFor={`employee-${key}`}>{label}</Label>{type === 'date' ? <DatePicker id={`employee-${key}`} value={form[key]} onChange={value => set(key, value)} /> : <Input id={`employee-${key}`} type={type} maxLength={maxLength} value={form[key]} onChange={event => set(key, event.target.value)} {...(type === 'number' ? { min: 0, step: '0.01' } : {})} />}</div>
  );
  const select = (key: string, label: string, options: { id: string; label: string }[], change?: (value: string) => void) => (
    <div key={key}><Label htmlFor={`employee-${key}`}>{label}</Label><DatalistSelect id={`employee-${key}`} value={form[key]} disabled={pending} onChange={change || (value => set(key, value))} options={[{ id: '', label: 'Not assigned' }, ...options]} placeholder="Assign now or later" /></div>
  );
  const tabs = [
    { id: 'details', label: 'Details', title: 'Employee details', description: 'Start with the employee’s name and work information.' },
    { id: 'employment', label: 'Employment', title: 'Organization & reporting', description: 'Assign the branch, department and reporting team.' },
    { id: 'contact', label: 'Contact', title: 'Contact information', description: 'Add the employee’s work email and phone number.' },
    { id: 'personal', label: 'Personal', title: 'Personal information', description: 'Optional details for the employee’s HR record.' },
    ...(canPayroll ? [{ id: 'payroll', label: 'Payroll', title: 'Payroll details', description: 'Enter the salary and bank information for this employee.' }] : []),
  ];
  const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const currentTab = tabs[tabIndex] || tabs[0];
  return <Modal isOpen onClose={() => { if (!pending) onClose(); }} title={created ? (editingEmployee ? 'Employee updated' : 'Employee created') : (editingEmployee ? 'Edit employee' : 'Add employee')} icon={<UserPlus className="w-5 h-5 text-indigo-400" />} maxWidth="xl" className="max-h-[90dvh] flex flex-col" bodyClassName="min-h-0 flex flex-col !p-0 overflow-hidden">
    {created ? <div className="space-y-5 overflow-y-auto p-6">
      <div role="status" className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /><div><p className="font-semibold text-white">{created.firstName} {created.lastName}</p><p className="text-sm text-slate-400">{created.employeeCode} · {created.jobTitle}</p></div></div>
      <div className="rounded-xl border border-slate-700 p-4 space-y-2"><h3 className="text-sm font-semibold text-white">Next: set up login access</h3><p className="text-sm text-slate-400">The employee profile is saved. A work email is contact information; it does not create or link a login account.</p><p className="text-sm text-slate-400">{onManageAccess ? 'Link an existing internal login account and assign HR roles. If no account exists, create one in Auth → User Directory first.' : 'Ask an administrator to link an internal login account and assign HR roles when this employee needs app access.'}</p></div>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={onClose}>Done</Button>{onManageAccess && <Button onClick={() => onManageAccess(created)}>Set up HR access</Button>}</div>
    </div> : loading ? <p role="status" className="py-8 text-center text-sm text-slate-400">Loading employee profile and organization options…</p> : <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/60">
        <p className="text-xs text-slate-400">{editingEmployee ? `${form.firstName} ${form.lastName} · ${form.employeeCode}` : 'New employee profile'}</p>
        <span className="max-w-[50%] truncate rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300" title={company?.name}>{company?.name || 'Select company'}</span>
      </div>
      {error && <p role="alert" className="mx-6 mt-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-300">{error}</p>}
      {lookupError && <p role="status" className="mx-6 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{lookupError}</p>}
      <div role="tablist" aria-label="Employee profile sections" className={`mx-6 mt-4 grid shrink-0 ${canPayroll ? 'grid-cols-5' : 'grid-cols-4'} gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1`}>
        {tabs.map(({ id, label }) => (
          <Button key={id} id={`employee-tab-${id}`} role="tab" type="button" size="sm"
            variant="ghost" className={`w-full !px-1 !text-[11px] sm:!text-xs focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === id ? '!bg-slate-800 !text-white shadow-sm' : ''}`} disabled={pending}
            aria-selected={activeTab === id} aria-controls={`employee-panel-${id}`} tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)} onKeyDown={event => {
              const tabs = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
              const index = tabs.indexOf(event.currentTarget);
              const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
              if (next !== -1) { event.preventDefault(); tabs[next].click(); tabs[next].focus(); }
            }}>{label}</Button>
        ))}
      </div>
      <fieldset disabled={pending || !company} className="min-h-0 overflow-y-auto px-6 pb-6 pt-5 max-h-[min(400px,48dvh)]">
        <legend className="sr-only">Employee profile</legend>
        <div className="mb-5"><h3 className="text-sm font-semibold text-white">{currentTab.title}</h3><p className="mt-1 text-xs text-slate-400">{currentTab.description}</p></div>
        <div role="tabpanel" id="employee-panel-details" aria-labelledby="employee-tab-details" data-employee-tab="details" hidden={activeTab !== 'details'} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="employee-first-name" required>First name</Label><Input id="employee-first-name" autoFocus required maxLength={100} value={form.firstName} onChange={e => set('firstName', e.target.value)} autoComplete="given-name" /></div>
          <div><Label htmlFor="employee-last-name" required>Last name</Label><Input id="employee-last-name" required maxLength={100} value={form.lastName} onChange={e => set('lastName', e.target.value)} autoComplete="family-name" /></div>
          <div><Label htmlFor="employee-code" required>Employee code</Label><Input id="employee-code" required minLength={3} maxLength={32} placeholder="e.g. EMP-0002" value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} error={codeError} aria-invalid={!!codeError} /><p className="mt-1 text-xs text-slate-500">Use your organization’s unique staff ID.</p></div>
          <div><Label htmlFor="employee-job" required>Job title</Label><Input id="employee-job" required maxLength={128} value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. Developer" /></div>
          <div><Label htmlFor="employee-hire-date" required>Hire date</Label><DatePicker id="employee-hire-date" required value={form.hireDate} onChange={value => set('hireDate', value)} /></div>
        </div>
        </div>
        <div role="tabpanel" id="employee-panel-employment" aria-labelledby="employee-tab-employment" data-employee-tab="employment" hidden={activeTab !== 'employment'} className="space-y-4">
          <h3 className="sr-only">Employment & reporting</h3>
          <div className="grid gap-4 sm:grid-cols-2">
          {select('branchId', 'Branch', branches.map(branch => ({ id: branch.id, label: branch.name })), value => { set('branchId', value); set('departmentId', ''); set('positionId', ''); set('sectorId', ''); })}
          <div><Label htmlFor="employee-department">Department <span className="text-slate-500">(optional)</span></Label><DatalistSelect id="employee-department" disabled={pending} value={form.departmentId} onChange={value => { set('departmentId', value); set('positionId', ''); set('sectorId', ''); }} options={[{ id: '', label: 'Assign later' }, ...departments.filter(d => d.companyId === companyId && (!d.branchId || d.branchId === form.branchId) && (!allowedBranches.length || !d.branchId || allowedBranches.includes(d.branchId))).map(d => ({ id: d.id, label: d.name, sublabel: d.code }))]} placeholder="Assign now or later" />{!departments.length && <p className="mt-1 text-xs text-slate-500">No departments yet. You can create this profile without one.</p>}</div>
            {select('positionId', 'Position', positions.filter(position => position.departmentId === form.departmentId && !!form.departmentId).map(position => ({ id: position.id, label: position.name })))}
            {select('sectorId', 'Sector', sectors.filter(sector => sector.departmentId === form.departmentId && !!form.departmentId).map(sector => ({ id: sector.id, label: sector.name })))}
            {select('employmentTypeId', 'Employment type', employmentTypes.map(type => ({ id: type.id, label: type.name })))}
            {field('probationEnd', 'Probation end date', 10, 'date')}
            {select('managerId', 'Direct manager', reporting.map(emp => ({ id: emp.id, label: `${emp.firstName} ${emp.lastName} · ${emp.employeeCode}` })))}
            {select('leaderId', 'Team leader', reporting.map(emp => ({ id: emp.id, label: `${emp.firstName} ${emp.lastName} · ${emp.employeeCode}` })))}
          </div>
        </div>
        <div role="tabpanel" id="employee-panel-contact" aria-labelledby="employee-tab-contact" data-employee-tab="contact" hidden={activeTab !== 'contact'}><h3 className="sr-only">Contact information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label htmlFor="employee-email">Work email</Label><Input id="employee-email" type="email" maxLength={150} value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" placeholder="name@company.com" /></div>
          <div><Label htmlFor="employee-phone">Phone number</Label><Input id="employee-phone" type="tel" maxLength={50} value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" /></div>
        </div></div>
        <div role="tabpanel" id="employee-panel-personal" aria-labelledby="employee-tab-personal" data-employee-tab="personal" hidden={activeTab !== 'personal'}>
          <h3 className="sr-only">Personal information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('englishName', 'English name', 200)}{field('khmerName', 'Khmer name', 200)}
            {select('gender', 'Gender', [{ id: 'MALE', label: 'Male' }, { id: 'FEMALE', label: 'Female' }, { id: 'OTHER', label: 'Other' }])}
            {field('maritalStatus', 'Marital status', 30)}
            {canPrivate && <>{field('dob', 'Date of birth', 10, 'date')}{field('nationalId', 'National ID', 50)}{field('address', 'Address', 500)}{field('emergencyContact', 'Emergency contact', 200)}{field('emergencyPhone', 'Emergency phone', 50, 'tel')}</>}
          </div>
          {!canPrivate && <p className="mt-3 text-xs text-slate-500">Additional personal details require private employee access.</p>}
        </div>
        {canPayroll && <div role="tabpanel" id="employee-panel-payroll" aria-labelledby="employee-tab-payroll" data-employee-tab="payroll" hidden={activeTab !== 'payroll'}>
          <h3 className="sr-only">Payroll details</h3>
          <div className="grid gap-4 sm:grid-cols-2">{field('baseSalary', 'Base salary', 20, 'number')}{field('bankName', 'Bank name', 100)}{field('bankAccountNumber', 'Bank account number', 50)}</div>
        </div>}
      </fieldset>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 px-6 py-4">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onClose}>Cancel</Button>
          <span className="text-[11px] text-slate-500">{tabIndex + 1} / {tabs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {tabIndex > 0 && <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setActiveTab(tabs[tabIndex - 1].id)}>Back</Button>}
          {tabIndex < tabs.length - 1 && <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setActiveTab(tabs[tabIndex + 1].id)}>Next</Button>}
          <Button type="submit" size="sm" disabled={!company} isLoading={pending}>{pending ? 'Saving…' : editingEmployee ? 'Update employee' : 'Create employee'}</Button>
        </div>
      </div>
    </form>}
  </Modal>;
};
