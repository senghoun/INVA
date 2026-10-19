import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}) => {
  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold',
    secondary:
      'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 font-semibold',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30',
    danger:
      'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-rose-600/30',
    warning:
      'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20',
    outline:
      'border border-slate-800 hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium',
    ghost:
      'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium',
  }[variant];

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-4 text-sm rounded-xl gap-2',
    lg: 'h-12 px-6 text-base rounded-2xl gap-2.5',
    icon: 'h-10 w-10 p-0 rounded-xl justify-center shrink-0',
    'icon-sm': 'h-8 w-8 p-0 rounded-lg justify-center shrink-0',
  }[size];

  const isIconButton = size === 'icon' || size === 'icon-sm';
  const iconSizeClass = size === 'sm' || size === 'icon-sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-[background-color,border-color,color,transform] cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transform active:translate-y-0',
        variant !== 'ghost' && variant !== 'outline' && 'hover:-translate-y-0.5',
        variantClasses,
        sizeClasses,
        className
      )}
      {...props}
    >
      {isIconButton ? (
        isLoading ? (
          <RefreshCw className={cn(iconSizeClass, 'animate-spin text-current shrink-0')} />
        ) : (
          children || leftIcon || <RefreshCw className={cn(iconSizeClass, 'shrink-0')} />
        )
      ) : (
        <>
          {isLoading ? (
            <RefreshCw className={cn(iconSizeClass, 'animate-spin text-current shrink-0')} />
          ) : (
            leftIcon && <span className="shrink-0 flex items-center justify-center">{leftIcon}</span>
          )}
          {children}
          {!isLoading && rightIcon && (
            <span className="shrink-0 flex items-center justify-center">{rightIcon}</span>
          )}
        </>
      )}
    </button>
  );
};
