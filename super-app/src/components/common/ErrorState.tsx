import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({ title = 'Unable to load data', message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
      <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-rose-400" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-100">{title}</p>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
      {onRetry && <Button type="button" variant="secondary" size="sm" isLoading={retrying} onClick={onRetry}>Retry</Button>}
    </div>
  );
}
