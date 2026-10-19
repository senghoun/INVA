import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, containerClassName, disabled, ...props }, ref) => {
    return (
      <div className={cn('relative flex flex-col w-full', containerClassName)}>
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 transition-colors outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800',
            className
          )}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-400 mt-1">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
