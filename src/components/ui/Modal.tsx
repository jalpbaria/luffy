import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { motionTokens } from '../motion/tokens';

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
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={motionTokens.spring.medium}
            className={`relative w-full ${maxWidthClasses} bg-[#12131A] rounded-[24px] border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden z-10 my-auto text-slate-100`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="p-6 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-4 bg-[#181924]/60">
                <div>
                  {typeof title === 'string' ? (
                    <h3 className="font-bold text-white text-lg tracking-tight">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {subtitle && (
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition cursor-pointer border-0 bg-transparent shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {!title && !subtitle && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition cursor-pointer border-0 bg-transparent z-20"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 sm:p-6 bg-[#0E0F17]/80 border-t border-white/[0.06] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
