import React from 'react';
import { PasswordStrength } from '../../types';

export function getPasswordStrength(pwd: string): PasswordStrength {
  const checks = {
    minLength: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;

  const labels: PasswordStrength['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return {
    score,
    label: labels[score] ?? 'Very Weak',
    color: colors[score] ?? '#ef4444',
    checks,
  };
}

export const PasswordStrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color, checks } = getPasswordStrength(password);

  const segmentColors = [
    score >= 1 ? colors[Math.max(0, score - 1)] : '#1e293b',
    score >= 2 ? colors[Math.max(0, score - 1)] : '#1e293b',
    score >= 3 ? colors[Math.max(0, score - 1)] : '#1e293b',
    score >= 4 ? colors[Math.max(0, score - 1)] : '#1e293b',
    score >= 5 ? colors[Math.max(0, score - 1)] : '#1e293b',
  ];

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {segmentColors.map((c, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="text-[11px] text-slate-500">{score}/5</span>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {(
          [
            ['minLength', '8+ characters'],
            ['uppercase', 'Uppercase letter'],
            ['lowercase', 'Lowercase letter'],
            ['number', 'Number'],
            ['special', 'Special character'],
          ] as [keyof typeof checks, string][]
        ).map(([key, label]) => (
          <div key={key} className={`flex items-center space-x-1.5 text-[11px] ${checks[key] ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${checks[key] ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
