import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input, InputProps } from './Input';
import { Button } from './Button';
import { DatalistSelect } from './DatalistSelect';
import { cn } from '../../utils/cn';

export interface DatePickerProps extends Omit<InputProps, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'leftIcon' | 'rightIcon'> {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

const iso = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
const parse = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && iso(date) === value ? date : null;
};
const todayDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};
const months = Array.from({ length: 12 }, (_, month) => new Date(Date.UTC(2024, month)).toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' }));

/** Date-only values stay in YYYY-MM-DD format; the calendar never converts them to local timestamps. */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  value, onChange, min, max, disabled, readOnly, className, containerClassName, size = 'md', ...props
}, forwardedRef) => {
  const popupId = useId();
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 304 });
  const [focused, setFocused] = useState(iso(parse(value) || todayDate()));
  const [month, setMonth] = useState(parse(value) || todayDate());
  const minimum = parse(min), maximum = parse(max);
  const permitted = (date: Date) => date.getUTCFullYear() >= 1 && date.getUTCFullYear() <= 9999 && (!minimum || date >= minimum) && (!maximum || date <= maximum);
  const bounded = (date: Date) => minimum && date < minimum ? minimum : maximum && date > maximum ? maximum : date;
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choose = (date: Date) => { if (permitted(date)) { onChange(iso(date)); close(); } };

  useEffect(() => {
    if (!open) return;
    if (disabled || readOnly) { setOpen(false); return; }
    const place = () => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(304, window.innerWidth - 24);
      const height = Math.min(380, window.innerHeight - 24);
      const top = rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 6 : Math.max(12, rect.top - height - 6);
      setPosition({ top: Math.min(top, Math.max(12, window.innerHeight - height - 12)), left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width });
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); close(); } };
    place();
    const frame = requestAnimationFrame(() => popup.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus());
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, disabled, readOnly]);

  const moveFocus = (date: Date, focusDay = true) => {
    const next = bounded(date);
    setMonth(next); setFocused(iso(next));
    if (focusDay) requestAnimationFrame(() => popup.current?.querySelector<HTMLButtonElement>(`[data-date="${iso(next)}"]`)?.focus());
  };
  const navigate = (offset: number) => moveFocus(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1)));
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const start = new Date(first); start.setUTCDate(1 - (first.getUTCDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, offset) => new Date(start.getTime() + offset * 86400000));
  const yearStart = Math.max(1, minimum?.getUTCFullYear() || Math.min(1900, month.getUTCFullYear()));
  const yearEnd = Math.min(9999, maximum?.getUTCFullYear() || Math.max(todayDate().getUTCFullYear() + 20, month.getUTCFullYear()));

  return <div ref={root} className={cn('relative', containerClassName)}>
    <Input {...props} ref={forwardedRef} type="date" value={value} min={min} max={max} disabled={disabled} readOnly={readOnly} size={size}
      onChange={event => onChange(event.target.value)}
      className={cn('pr-11 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden', className)} />
    <button ref={trigger} type="button" disabled={disabled || readOnly} aria-label="Open calendar" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popupId : undefined}
      className={cn('absolute right-1.5 top-1 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40', size === 'sm' ? 'h-6 w-7' : 'h-8 w-8')}
      onClick={() => { if (open) close(); else { const selected = bounded(parse(value) || todayDate()); setMonth(selected); setFocused(iso(selected)); setOpen(true); } }}>
      <CalendarDays className="h-4 w-4" />
    </button>
    {open && createPortal(<div ref={popup} id={popupId} role="dialog" aria-label="Choose date" style={position}
      className="fixed z-[100] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-2xl shadow-black/50"
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !root.current?.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="mb-3 flex items-center gap-2">
        <Button size="icon-sm" variant="ghost" aria-label="Previous month" onClick={() => navigate(-1)} disabled={!!minimum && first <= new Date(Date.UTC(minimum.getUTCFullYear(), minimum.getUTCMonth(), 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${popupId}-month`} className="sr-only">Calendar month</label>
          <DatalistSelect id={`${popupId}-month`} size="sm" hideSearchIcon value={String(month.getUTCMonth())}
            onChange={value => { if (value) moveFocus(new Date(Date.UTC(month.getUTCFullYear(), Number(value), 1)), false); }}
            options={months.map((label, index) => ({ id: String(index), label }))} />
        </div>
        <div className="w-20 shrink-0">
          <label htmlFor={`${popupId}-year`} className="sr-only">Calendar year</label>
          <DatalistSelect id={`${popupId}-year`} size="sm" hideSearchIcon dropdownAlign="right" value={String(month.getUTCFullYear())}
            onChange={value => { if (value) moveFocus(new Date(Date.UTC(Number(value), month.getUTCMonth(), 1)), false); }}
            options={Array.from({ length: Math.max(0, yearEnd - yearStart + 1) }, (_, index) => ({ id: String(yearStart + index), label: String(yearStart + index) }))} />
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Next month" onClick={() => navigate(1)} disabled={!!maximum && first >= new Date(Date.UTC(maximum.getUTCFullYear(), maximum.getUTCMonth(), 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 text-center">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <span key={day} className="py-2 text-[10px] font-semibold text-slate-500">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1" aria-label="Calendar days">
        {days.map(date => { const dateValue = iso(date); return <button key={dateValue} type="button" data-date={dateValue} data-focused={dateValue === focused} tabIndex={dateValue === focused ? 0 : -1}
          aria-label={date.toLocaleDateString(undefined, { dateStyle: 'full', timeZone: 'UTC' })} aria-pressed={dateValue === value} aria-current={dateValue === iso(todayDate()) ? 'date' : undefined} disabled={!permitted(date)}
          onClick={() => choose(date)} onKeyDown={event => {
            const next = new Date(date); let handled = true;
            if (event.key === 'ArrowLeft') next.setUTCDate(next.getUTCDate() - 1);
            else if (event.key === 'ArrowRight') next.setUTCDate(next.getUTCDate() + 1);
            else if (event.key === 'ArrowUp') next.setUTCDate(next.getUTCDate() - 7);
            else if (event.key === 'ArrowDown') next.setUTCDate(next.getUTCDate() + 7);
            else if (event.key === 'Home') next.setUTCDate(next.getUTCDate() - (next.getUTCDay() + 6) % 7);
            else if (event.key === 'End') next.setUTCDate(next.getUTCDate() + 6 - (next.getUTCDay() + 6) % 7);
            else if (event.key === 'PageUp' || event.key === 'PageDown') { next.setUTCDate(1); next.setUTCMonth(next.getUTCMonth() + (event.key === 'PageUp' ? -1 : 1)); }
            else handled = false;
            if (handled) { event.preventDefault(); moveFocus(next); }
          }}
          className={cn('h-8 rounded-lg text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 disabled:opacity-25 disabled:cursor-not-allowed', dateValue === value ? 'bg-indigo-600 font-semibold text-white' : 'hover:bg-slate-800', date.getUTCMonth() !== month.getUTCMonth() ? 'text-slate-600' : 'text-slate-200', dateValue === iso(todayDate()) && dateValue !== value && 'ring-1 ring-inset ring-indigo-500/50')}>{date.getUTCDate()}</button>; })}
      </div>
      <div className="mt-3 flex justify-between border-t border-slate-800 pt-2">
        <Button type="button" size="sm" variant="ghost" disabled={!permitted(todayDate())} onClick={() => choose(todayDate())}>Today</Button>
        {!props.required && <Button type="button" size="sm" variant="ghost" onClick={() => { onChange(''); close(); }}>Clear</Button>}
        <Button type="button" size="sm" variant="ghost" onClick={close}>Close</Button>
      </div>
    </div>, document.body)}
  </div>;
});
DatePicker.displayName = 'DatePicker';
