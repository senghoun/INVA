import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      leftIcon,
      rightIcon,
      error,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const isSmall = size === 'sm';

    return (
      <div className={cn('relative flex flex-col w-full', containerClassName)}>
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span
              className={cn(
                'absolute pointer-events-none text-slate-400 flex items-center justify-center',
                isSmall ? 'left-2.5 w-3.5 h-3.5' : 'left-3.5 w-4 h-4'
              )}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-slate-950 border text-white placeholder-slate-500 transition-colors outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800',
              isSmall
                ? `${leftIcon ? 'pl-8' : 'px-3'} ${rightIcon ? 'pr-8' : 'px-3'} h-8 text-xs rounded-lg`
                : `${leftIcon ? 'pl-10' : 'px-3.5'} ${rightIcon ? 'pr-10' : 'px-3.5'} h-10 text-sm rounded-xl`,
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className={cn(
                'absolute pointer-events-none text-slate-400 flex items-center justify-center',
                isSmall ? 'right-2.5 w-3.5 h-3.5' : 'right-3.5 w-4 h-4'
              )}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && <span className="text-[11px] text-rose-400 mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
