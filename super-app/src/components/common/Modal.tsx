import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  className?: string;
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'md',
  className,
  bodyClassName,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses =
    {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
    }[maxWidth] || maxWidth;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div
          className={cn(
            'bg-slate-900 border border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl',
            maxWidthClasses,
            className
          )}
        >
          <div className="px-6 py-4 border-b border-slate-800 flex shrink-0 items-center justify-between bg-slate-950/60">
            <span className="text-white font-semibold flex items-center gap-2">
              {icon}
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className={cn('p-6', bodyClassName)}>{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
};
