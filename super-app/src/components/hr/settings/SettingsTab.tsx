import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Calendar,
  DollarSign,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { HrConfig } from '../../../services/hr.service';
import { Button, Input, Label, DatalistSelect } from '../../common';

interface SettingsTabProps {
  config: HrConfig | null;
  loading: boolean;
  onRefresh: () => void;
  onSaveConfig: (payload: Partial<HrConfig>) => Promise<any>;
}

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  loading,
  onRefresh,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<Partial<HrConfig>>({
    portalTitle: 'INVA HR Portal',
    portalDomain: 'hr.inva.io',
    workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    dailyWorkHours: 8,
    clockInGraceMinutes: 15,
    annualLeaveDays: 18,
    sickLeaveDays: 10,
    allowLeaveCarryover: true,
    payrollFrequency: 'MONTHLY',
    payrollCutoffDay: 25,
    currency: 'USD',
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setFormData({
        portalTitle: config.portalTitle || 'INVA HR Portal',
        portalDomain: config.portalDomain || 'hr.inva.io',
        workDays: config.workDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        dailyWorkHours: config.dailyWorkHours ?? 8,
        clockInGraceMinutes: config.clockInGraceMinutes ?? 15,
        annualLeaveDays: config.annualLeaveDays ?? 18,
        sickLeaveDays: config.sickLeaveDays ?? 10,
        allowLeaveCarryover: config.allowLeaveCarryover ?? true,
        payrollFrequency: config.payrollFrequency || 'MONTHLY',
        payrollCutoffDay: config.payrollCutoffDay ?? 25,
        currency: config.currency || 'USD',
      });
    }
  }, [config]);

  const toggleWorkDay = (day: string) => {
    setFormData((prev) => {
      const days = prev.workDays || [];
      return {
        ...prev,
        workDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSavedSuccess(false);
      await onSaveConfig(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update HR configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Sub Header ───────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Human Resources Policy Configuration
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure working hours, attendance tolerances, leave policies, and payroll cadence.
          </p>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={onRefresh}
          isLoading={loading}
          title="Refresh Settings"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>HR policy configuration updated and saved successfully!</span>
          </div>
        )}

        {/* ── 1. General & Domain Info ─────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Domain & Brand Identity
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>HR Portal Title</Label>
              <Input
                type="text"
                value={formData.portalTitle || ''}
                onChange={(e) => setFormData({ ...formData, portalTitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Subdomain / Domain</Label>
              <Input
                type="text"
                value={formData.portalDomain || ''}
                onChange={(e) => setFormData({ ...formData, portalDomain: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Work Schedule & Shifts ────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            Attendance & Work Shift Parameters
          </h4>

          <div>
            <Label className="mb-2">Designated Work Days</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = (formData.workDays || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label>Daily Work Hours (standard)</Label>
              <Input
                type="number"
                step="0.5"
                min={1}
                max={24}
                value={formData.dailyWorkHours ?? 8}
                onChange={(e) => setFormData({ ...formData, dailyWorkHours: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Clock In Grace Period (Minutes)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={formData.clockInGraceMinutes ?? 15}
                onChange={(e) => setFormData({ ...formData, clockInGraceMinutes: Number(e.target.value) })}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Arrivals within this grace window will not be flagged as LATE.
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Leaves & Payroll ──────────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Leaves & Payroll Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Annual Leave Default (Days)</Label>
              <Input
                type="number"
                value={formData.annualLeaveDays ?? 18}
                onChange={(e) => setFormData({ ...formData, annualLeaveDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sick Leave Default (Days)</Label>
              <Input
                type="number"
                value={formData.sickLeaveDays ?? 10}
                onChange={(e) => setFormData({ ...formData, sickLeaveDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Corporate Currency</Label>
              <Input
                type="text"
                value={formData.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <Label>Payroll Cadence</Label>
              <DatalistSelect
                value={formData.payrollFrequency || 'MONTHLY'}
                onChange={(val) => setFormData({ ...formData, payrollFrequency: val || 'MONTHLY' })}
                options={[
                  { id: 'MONTHLY', label: 'Monthly' },
                  { id: 'BIWEEKLY', label: 'Bi-Weekly' },
                  { id: 'WEEKLY', label: 'Weekly' },
                ]}
                placeholder="Select Frequency"
              />
            </div>
            <div>
              <Label>Monthly Cutoff Day</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={formData.payrollCutoffDay ?? 25}
                onChange={(e) => setFormData({ ...formData, payrollCutoffDay: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="carryover"
              checked={formData.allowLeaveCarryover ?? true}
              onChange={(e) => setFormData({ ...formData, allowLeaveCarryover: e.target.checked })}
              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="carryover" className="text-xs text-slate-300 font-medium">
              Allow unutilized leave days to carry over to next fiscal year
            </label>
          </div>
        </div>

        {/* ── Save Action ──────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            disabled={saving}
            leftIcon={<Save className="w-4 h-4" />}
            className="px-6"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
