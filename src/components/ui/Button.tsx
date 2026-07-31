import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'outline' 
  | 'ghost' 
  | 'tactile' 
  | 'tactile-success'
  | 'gradient'
  | 'danger'
  | 'glass';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'px-2.5 py-1 text-[11px] rounded-lg font-semibold gap-1',
      sm: 'px-3.5 py-1.5 text-xs rounded-xl font-bold gap-1.5',
      md: 'px-4.5 py-2.5 text-xs sm:text-sm rounded-2xl font-bold gap-2',
      lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl font-extrabold gap-2.5',
      xl: 'px-7 py-4 text-base rounded-2xl font-black gap-3',
    }[size];

    const variantClasses = {
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30 hover:shadow-lg hover:shadow-indigo-500/35 transition-all',
      secondary:
        'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 border border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/35 transition-all',
      accent:
        'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-md shadow-cyan-500/20 border border-cyan-300/40 hover:shadow-lg hover:shadow-cyan-500/30 transition-all',
      outline:
        'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 transition-all',
      ghost:
        'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 transition-all',
      tactile:
        'btn-tactile-primary text-white font-extrabold tracking-wide uppercase',
      'tactile-success':
        'btn-tactile-success text-white font-extrabold tracking-wide uppercase',
      gradient:
        'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 border border-white/20 hover:shadow-xl hover:shadow-indigo-500/35 transition-all',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20 border border-rose-400/30 hover:shadow-lg hover:shadow-rose-500/30 transition-all',
      glass:
        'bg-white/80 hover:bg-white text-slate-900 backdrop-blur-md border border-white/60 shadow-md shadow-slate-200/50 transition-all',
    }[variant];

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={disabled || isLoading ? undefined : { y: -1.5, scale: 1.01 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`inline-flex items-center justify-center transition-all cursor-pointer select-none tracking-tight ${
          fullWidth ? 'w-full' : ''
        } ${sizeClasses} ${variantClasses} ${
          disabled || isLoading ? 'opacity-60 pointer-events-none' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
