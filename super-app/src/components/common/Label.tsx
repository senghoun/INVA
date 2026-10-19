import React from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  children,
  required,
  className,
  ...props
}) => {
  return (
    <label
      className={cn('block text-xs font-medium text-slate-400 mb-1', className)}
      {...props}
    >
      {children}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
};
