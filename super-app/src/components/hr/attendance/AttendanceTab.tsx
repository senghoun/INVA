import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  Calendar,
  User,
  MapPin,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  TodayAttendanceStatus,
  AttendanceRecord,
  ClockInDto,
  ClockOutDto,
  EmployeeProfile,
} from '../../../services/hr.service';
import { Button, Input, Label, Badge, DatalistSelect } from '../../common';

interface AttendanceTabProps {
  todayStatus: TodayAttendanceStatus;
  records: AttendanceRecord[];
  employees: EmployeeProfile[];
  loading: boolean;
  error?: string | null;
  punching: boolean;
  onRefresh: () => void;
  onClockIn: (dto?: ClockInDto) => Promise<any>;
  onClockOut: (dto?: ClockOutDto) => Promise<any>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  todayStatus,
  records,
  employees,
  loading,
  error,
  punching,
  onRefresh,
  onClockIn,
  onClockOut,
}) => {
  // Digital clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [punchMessage, setPunchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    try {
      setPunchMessage(null);
      let coords: { latitude?: number; longitude?: number } = {};
      if ('geolocation' in navigator) {
        try {
          const pos: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (_) {
          // GPS optional fallback
        }
      }
      await onClockIn({ ...coords, notes: notes.trim() || undefined });
      setPunchMessage({ type: 'success', text: 'Checked in successfully! Have a productive day.' });
      setNotes('');
    } catch (err: any) {
      setPunchMessage({ type: 'error', text: err.message || 'Failed to clock in.' });
    }
  };

  const handleClockOut = async () => {
    try {
      setPunchMessage(null);
      let coords: { latitude?: number; longitude?: number } = {};
      if ('geolocation' in navigator) {
        try {
          const pos: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (_) {
          // GPS optional fallback
        }
      }
      await onClockOut({ ...coords, notes: notes.trim() || undefined });
      setPunchMessage({ type: 'success', text: 'Checked out successfully! Great work today.' });
      setNotes('');
    } catch (err: any) {
      setPunchMessage({ type: 'error', text: err.message || 'Failed to clock out.' });
    }
  };

  const formatTimeStr = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isCheckedIn = todayStatus.status === 'CHECKED_IN';
  const isCheckedOut = todayStatus.status === 'CHECKED_OUT';
  const notCheckedIn = todayStatus.status === 'NOT_CHECKED_IN';

  const filteredRecords = records.filter((rec) => {
    if (statusFilter === 'ALL') return true;
    return rec.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {/* ── Top Punch Action & Today Status Card ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clock Punch Hero Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Real-Time Attendance Terminal</span>
              </div>

              {/* Digital Clock */}
              <div className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Today Status:</span>
                {(loading || todayStatus.status === 'UNAVAILABLE') && <Badge variant="default">Status unavailable</Badge>}
                {!loading && todayStatus.status === 'NO_EMPLOYEE_PROFILE' && <Badge variant="default">No employee profile in this company</Badge>}
                {notCheckedIn && (
                  <Badge variant="warning">Not Checked In</Badge>
                )}
                {isCheckedIn && (
                  <Badge variant="success" dot className="animate-pulse">
                    Checked In
                  </Badge>
                )}
                {isCheckedOut && (
                  <Badge variant="info">✓ Checked Out for Today</Badge>
                )}
              </div>
              {!loading && todayStatus.status === 'NO_EMPLOYEE_PROFILE' && (
                <p className="mt-2 text-sm text-slate-400">Link your account to an employee in this company to clock in. You can still view attendance records with your assigned permissions.</p>
              )}
            </div>

            {/* Clock In / Out Action Button */}
            <div className="flex flex-col items-center gap-3 w-full md:w-auto">
              {notCheckedIn && (
                <Button
                  onClick={handleClockIn}
                  disabled={punching}
                  isLoading={punching}
                  variant="success"
                  size="lg"
                  className="w-full md:w-48 font-bold text-base rounded-2xl shadow-xl shadow-emerald-600/30"
                  leftIcon={!punching ? <Play className="w-5 h-5 fill-current" /> : undefined}
                >
                  Clock In
                </Button>
              )}

              {isCheckedIn && (
                <Button
                  onClick={handleClockOut}
                  disabled={punching}
                  isLoading={punching}
                  variant="danger"
                  size="lg"
                  className="w-full md:w-48 font-bold text-base rounded-2xl shadow-xl shadow-rose-600/30"
                  leftIcon={!punching ? <Square className="w-5 h-5 fill-current" /> : undefined}
                >
                  Clock Out
                </Button>
              )}

              {isCheckedOut && (
                <div className="text-center px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <span>Work day complete</span>
                </div>
              )}

              {/* Optional Notes Input */}
              {!isCheckedOut && (
                <div className="w-full md:w-48">
                  <Label className="mb-1">Note (optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g. WFH today"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    size="sm"
                    className="w-full text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {punchMessage && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                punchMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {punchMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{punchMessage.text}</span>
            </div>
          )}
        </div>

        {/* Right: Today Attendance Log Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Today's Session
            </h4>
            <p className="text-xs text-slate-400 mt-1">Logged session details for your account</p>

            <div className="mt-5 space-y-3">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Check-in:</span>
                <span className="text-white font-mono font-semibold">
                  {formatTimeStr(todayStatus.record?.checkInTime)}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Check-out:</span>
                <span className="text-white font-mono font-semibold">
                  {formatTimeStr(todayStatus.record?.checkOutTime)}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Hours Recorded:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {todayStatus.record?.hoursWorked
                    ? `${Number(todayStatus.record.hoursWorked).toFixed(1)} hrs`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <span className="text-slate-500 text-[11px]">
              Geofence policy active • Standard grace 15 mins
            </span>
          </div>
        </div>
      </div>

      {/* ── Attendance Records History Table ───────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white text-sm">Attendance Logs</span>
            <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs font-mono text-slate-300">
              {filteredRecords.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="w-44 sm:w-48">
              <DatalistSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val || 'ALL')}
                options={[
                  { id: 'ALL', label: 'All Status' },
                  { id: 'PRESENT', label: 'Present' },
                  { id: 'LATE', label: 'Late' },
                  { id: 'ABSENT', label: 'Absent' },
                  { id: 'HALF_DAY', label: 'Half Day' },
                  { id: 'ON_LEAVE', label: 'On Leave' },
                ]}
                placeholder="All Status"
              />
            </div>

            <Button
              variant="secondary"
              size="icon"
              onClick={onRefresh}
              isLoading={loading}
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-slate-600" />
                      <span className="font-medium">No attendance records logged yet</span>
                      <span className="text-xs text-slate-600">
                        Use the Clock In button above to register today's attendance.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const emp = employees.find((e) => e.id === rec.employeeId);
                  const empName = emp
                    ? `${emp.firstName} ${emp.lastName}`
                    : rec.employee
                    ? `${rec.employee.firstName} ${rec.employee.lastName}`
                    : 'Team Member';

                  const getStatusVariant = (status: string) => {
                    switch (status) {
                      case 'PRESENT':
                        return 'success' as const;
                      case 'LATE':
                        return 'warning' as const;
                      case 'ABSENT':
                        return 'danger' as const;
                      case 'HALF_DAY':
                        return 'primary' as const;
                      case 'ON_LEAVE':
                        return 'info' as const;
                      default:
                        return 'default' as const;
                    }
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                        {formatDateStr(rec.date)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {empName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{empName}</p>
                            <p className="text-[11px] text-slate-500">{emp?.employeeCode || ''}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {formatTimeStr(rec.checkInTime)}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {formatTimeStr(rec.checkOutTime)}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-emerald-400 whitespace-nowrap">
                        {rec.hoursWorked ? `${Number(rec.hoursWorked).toFixed(1)} hrs` : '—'}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(rec.status)}>
                          {rec.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                        <div>{rec.notes || '—'}</div>
                        {rec.checkOutNotes && <div className="text-slate-400">Checkout: {rec.checkOutNotes}</div>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
