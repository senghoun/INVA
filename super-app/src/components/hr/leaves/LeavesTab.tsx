import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  FileCheck,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  LeaveType,
  LeaveRequest,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  EmployeeProfile,
} from '../../../services/hr.service';
import {
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Modal,
  DatalistSelect,
  DatePicker,
} from '../../common';

interface LeavesTabProps {
  leaveTypes: LeaveType[];
  requests: LeaveRequest[];
  employees: EmployeeProfile[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onSubmitLeave: (dto: CreateLeaveRequestDto) => Promise<any>;
  onApproveLeave: (id: string, reviewNotes?: string) => Promise<any>;
  onRejectLeave: (id: string, reviewNotes?: string) => Promise<any>;
  onCreateLeaveType: (dto: CreateLeaveTypeDto) => Promise<any>;
  onUpdateLeaveType: (id: string, dto: Partial<CreateLeaveTypeDto>) => Promise<any>;
  onDeleteLeaveType: (id: string) => Promise<any>;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({
  leaveTypes,
  requests,
  employees,
  loading,
  error,
  onRefresh,
  onSubmitLeave,
  onApproveLeave,
  onRejectLeave,
  onCreateLeaveType,
  onUpdateLeaveType,
  onDeleteLeaveType,
}) => {
  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Apply form
  const [applyForm, setApplyForm] = useState<CreateLeaveRequestDto>({
    employeeId: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    durationDays: 1,
    reason: '',
  });

  // New Type form
  const [typeForm, setTypeForm] = useState<CreateLeaveTypeDto>({
    code: '',
    name: '',
    description: '',
    defaultDaysPerYear: 15,
    isPaid: true,
    allowCarryover: false,
  });

  const openEditType = (type: LeaveType) => {
    setEditingType(type);
    setTypeForm({
      code: type.code,
      name: type.name,
      description: type.description || '',
      defaultDaysPerYear: type.defaultDaysPerYear,
      isPaid: type.isPaid,
      allowCarryover: type.allowCarryover,
    });
    setFormError(null);
    setIsNewTypeModalOpen(true);
  };

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  /** Remove empty-string / undefined / null fields so optional validators don't fail */
  const stripEmpty = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ) as Partial<T>;

  // Auto-calculate days
  const handleDateChange = (start: string, end: string) => {
    try {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      setApplyForm((prev) => ({ ...prev, startDate: start, endDate: end, durationDays: diffDays }));
    } catch {
      setApplyForm((prev) => ({ ...prev, startDate: start, endDate: end }));
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.leaveTypeId || !applyForm.reason) {
      setFormError('Please select a leave type and provide a reason.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await onSubmitLeave(stripEmpty(applyForm) as any);
      setIsApplyModalOpen(false);
      setApplyForm({
        employeeId: '',
        leaveTypeId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        durationDays: 1,
        reason: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.code || !typeForm.name) {
      setFormError('Code and Name are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      if (editingType) {
        await onUpdateLeaveType(editingType.id, stripEmpty(typeForm) as any);
      } else {
        await onCreateLeaveType(stripEmpty(typeForm) as any);
      }
      setIsNewTypeModalOpen(false);
      setEditingType(null);
      setTypeForm({
        code: '',
        name: '',
        description: '',
        defaultDaysPerYear: 15,
        isPaid: true,
        allowCarryover: false,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create leave policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;
    try {
      setSubmittingReview(true);
      setReviewError(null);
      if (reviewDecision === 'APPROVED') {
        await onApproveLeave(reviewingRequest.id, reviewNotes.trim() || undefined);
      } else {
        await onRejectLeave(reviewingRequest.id, reviewNotes.trim() || undefined);
      }
      setReviewingRequest(null);
      setReviewNotes('');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="p-3 border border-rose-500/30 rounded-xl text-rose-400 text-sm">{error}</div>}
      {/* ── Top Leave Policies Cards ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <span>Leave Categories & Entitlements</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewTypeModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-400" />}
          >
            New Leave Policy
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveTypes.map((type) => (
            <div
              key={type.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[11px] font-mono font-bold uppercase">
                    {type.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant={type.isPaid ? 'success' : 'default'} size="sm">
                      {type.isPaid ? 'Paid Leave' : 'Unpaid'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditType(type)}
                      className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 ml-1"
                      title="Edit Policy"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteLeaveType(type.id)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete Policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-bold text-white text-base mt-2">{type.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{type.description || 'Standard corporate leave'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Allowance</span>
                <span className="text-white font-bold">{type.defaultDaysPerYear} days / yr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leave Requests Header & Action Ribbon ────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white text-sm">Requests & Approvals</span>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <Badge variant="warning">{loading || error ? '—' : pendingCount} Pending</Badge>
            <Badge variant="success">{loading || error ? '—' : approvedCount} Approved</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="w-44 sm:w-48">
            <DatalistSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val || 'ALL')}
              options={[
                { id: 'ALL', label: 'All Requests' },
                { id: 'PENDING', label: 'Pending Review' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ]}
              placeholder="All Requests"
            />
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={onRefresh}
            isLoading={loading}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsApplyModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* ── Leave Requests Table ────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarDays className="w-8 h-8 text-slate-600" />
                      <span className="font-medium">{loading ? 'Loading leave requests…' : error ? 'Leave requests could not be loaded' : 'No leave requests found'}</span>
                      <span className="text-xs text-slate-600">
                        {error ? 'Refresh to retry.' : 'Submit a new application or adjust your status filter.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  const applicantName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : req.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : 'Staff Member';

                  const type = leaveTypes.find((t) => t.id === req.leaveTypeId) || req.leaveType;

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 text-white text-xs font-bold flex items-center justify-center shadow">
                            {applicantName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{applicantName}</p>
                            <p className="text-[11px] text-slate-500">{emp?.jobTitle || ''}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs font-medium text-slate-200">
                          {type ? type.name : 'General Leave'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs whitespace-nowrap text-slate-300">
                        {req.startDate} ↳ {req.endDate}
                      </td>

                      <td className="px-6 py-4 font-bold text-xs text-indigo-400 whitespace-nowrap">
                        {req.durationDays} {req.durationDays === 1 ? 'day' : 'days'}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                        {req.reason}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {req.status === 'PENDING' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        {req.status === 'APPROVED' && (
                          <Badge variant="success">Approved</Badge>
                        )}
                        {req.status === 'CANCELLED' && <Badge variant="default">Cancelled</Badge>}
                        {req.status === 'REJECTED' && (
                          <Badge variant="danger">Rejected</Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                setReviewError(null);
                                setReviewingRequest(req);
                                setReviewDecision('APPROVED');
                              }}
                              leftIcon={<ThumbsUp className="w-3 h-3" />}
                              title="Approve request"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setReviewError(null);
                                setReviewingRequest(req);
                                setReviewDecision('REJECTED');
                              }}
                              leftIcon={<ThumbsDown className="w-3 h-3" />}
                              title="Reject request"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {req.reviewNotes ? `Notes: "${req.reviewNotes}"` : 'Finalized'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Apply for Leave ─────────────────────────────────────── */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        icon={<CalendarDays className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <Label>Employee (Optional)</Label>
            <DatalistSelect
              value={applyForm.employeeId || ''}
              onChange={(val) => setApplyForm({ ...applyForm, employeeId: val })}
              options={[
                { id: '', label: 'Current User / Self' },
                ...employees.map((emp) => ({
                  id: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                  sublabel: emp.employeeCode,
                })),
              ]}
              placeholder="Current User / Self"
            />
          </div>

          <div>
            <Label required>Leave Type</Label>
            <DatalistSelect
              required
              value={applyForm.leaveTypeId}
              onChange={(val) => setApplyForm({ ...applyForm, leaveTypeId: val })}
              options={leaveTypes.map((t) => ({
                id: t.id,
                label: t.name,
                sublabel: `${t.defaultDaysPerYear} days - ${t.isPaid ? 'Paid' : 'Unpaid'}`,
              }))}
              placeholder="Select Category"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="leave-start-date" required>Start Date</Label>
              <DatePicker
                id="leave-start-date"
                required
                value={applyForm.startDate}
                onChange={value => handleDateChange(value, applyForm.endDate)}
              />
            </div>
            <div>
              <Label htmlFor="leave-end-date" required>End Date</Label>
              <DatePicker
                id="leave-end-date"
                min={applyForm.startDate}
                required
                value={applyForm.endDate}
                onChange={value => handleDateChange(applyForm.startDate, value)}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Calculated Duration:</span>
            <span className="text-indigo-400 font-bold font-mono">
              {applyForm.durationDays} {applyForm.durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div>
            <Label required>Reason for Leave</Label>
            <Textarea
              required
              rows={3}
              placeholder="Briefly state the reason for this absence..."
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={submitting}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Review Request (Approve / Reject) ────────────────────── */}
      <Modal
        isOpen={!!reviewingRequest}
        onClose={() => setReviewingRequest(null)}
        title="Review Leave Application"
        icon={<FileCheck className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        {reviewingRequest && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {reviewError && <p role="alert" className="text-sm text-rose-400">{reviewError}</p>}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white font-bold">{reviewingRequest.durationDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dates:</span>
                <span className="text-slate-200">
                  {reviewingRequest.startDate} to {reviewingRequest.endDate}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Applicant Reason:</span>
                <p className="text-white mt-0.5 italic">"{reviewingRequest.reason}"</p>
              </div>
            </div>

            <div>
              <Label required>Decision</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={reviewDecision === 'APPROVED' ? 'success' : 'secondary'}
                  onClick={() => setReviewDecision('APPROVED')}
                  leftIcon={<ThumbsUp className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={reviewDecision === 'REJECTED' ? 'danger' : 'secondary'}
                  onClick={() => setReviewDecision('REJECTED')}
                  leftIcon={<ThumbsDown className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Reject
                </Button>
              </div>
            </div>

            <div>
              <Label>Review Notes / Feedback (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="Enter notes visible to the applicant..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReviewingRequest(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewDecision === 'APPROVED' ? 'success' : 'danger'}
                size="sm"
                isLoading={submittingReview}
                disabled={submittingReview}
              >
                {reviewDecision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Create Leave Policy Type ────────────────────────────── */}
      <Modal
        isOpen={isNewTypeModalOpen}
        onClose={() => { setIsNewTypeModalOpen(false); setEditingType(null); }}
        title={editingType ? `Edit: ${editingType.name}` : 'Define New Leave Policy'}
        icon={<Plus className="w-4 h-4 text-indigo-400" />}
        maxWidth="md"
      >
        <form onSubmit={handleNewTypeSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {formError}
            </div>
          )}
          <div>
            <Label required>Policy Name</Label>
            <Input
              type="text"
              required
              placeholder="e.g. Parental Leave"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Code</Label>
              <Input
                type="text"
                required
                placeholder="e.g. PARENTAL"
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label required>Annual Allowance (Days)</Label>
              <Input
                type="number"
                required
                min={1}
                value={typeForm.defaultDaysPerYear}
                onChange={(e) => setTypeForm({ ...typeForm, defaultDaysPerYear: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              type="text"
              placeholder="Eligibility criteria and conditions..."
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              role="checkbox"
              aria-checked={typeForm.isPaid}
              onClick={() => setTypeForm({ ...typeForm, isPaid: !typeForm.isPaid })}
              className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                typeForm.isPaid ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  typeForm.isPaid ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <Label className="mb-0 cursor-pointer" onClick={() => setTypeForm({ ...typeForm, isPaid: !typeForm.isPaid })}>
              Compensated / Paid Leave
            </Label>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setIsNewTypeModalOpen(false); setEditingType(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={submitting}
            >
              {editingType ? 'Update Policy' : 'Save Policy'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
