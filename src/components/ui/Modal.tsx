import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`relative w-full ${maxWidthClasses} bg-white rounded-[28px] border border-slate-200/90 shadow-2xl overflow-hidden z-10 my-auto`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  {typeof title === 'string' ? (
                    <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {subtitle && (
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer border-0 bg-transparent shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {!title && !subtitle && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer border-0 bg-transparent z-20"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
