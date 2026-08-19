import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';
import { motionTokens } from '../motion/tokens';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'outline' 
  | 'ghost' 
  | 'accent' 
  | 'gradient'
  | 'danger'
  | 'tactile'
  | 'tactile-success'
  | 'glass';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** When true for tertiary variant, appends the animated right arrow */
  showArrow?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Foundation Button Component:
 * - Primary: Crisp dark/light contrast + subtle electric violet glow
 * - Secondary: Minimal dark surface + subtle border
 * - Tertiary: Plain text + animated arrow (e.g., "Explore skills →")
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      showArrow = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // 3. Tertiary variant: Plain text + animated arrow
    if (variant === 'tertiary') {
      const tertiarySizeClasses = {
        xs: 'text-xs gap-1 py-1 px-1',
        sm: 'text-xs gap-1.5 py-1 px-1.5 font-semibold',
        md: 'text-sm gap-2 py-1.5 px-2 font-semibold',
        lg: 'text-base gap-2.5 py-2 px-2.5 font-bold',
        xl: 'text-lg gap-3 py-2 px-3 font-bold',
      }[size];

      return (
        <button
          ref={ref}
          disabled={disabled || isLoading}
          className={`group inline-flex items-center text-violet-300 hover:text-white font-medium transition-colors cursor-pointer select-none bg-transparent border-0 p-0 ${
            fullWidth ? 'w-full justify-between' : ''
          } ${tertiarySizeClasses} ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''} ${className}`}
          {...(props as any)}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            leftIcon && <span className="shrink-0">{leftIcon}</span>
          )}
          <span>{children}</span>
          {!isLoading && (rightIcon || showArrow || true) && (
            <span className="inline-flex shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1.5">
              {rightIcon || <ArrowRight className="w-3.5 h-3.5" />}
            </span>
          )}
        </button>
      );
    }

    const sizeClasses = {
      xs: 'px-2.5 py-1 text-[11px] rounded-lg font-semibold gap-1',
      sm: 'px-3.5 py-1.5 text-xs rounded-xl font-semibold gap-1.5',
      md: 'px-4.5 py-2.5 text-xs sm:text-sm rounded-xl font-semibold gap-2',
      lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl font-bold gap-2.5',
      xl: 'px-7 py-3.5 text-base rounded-2xl font-bold gap-3',
    }[size];

    const variantClasses = {
      // 1. Primary: High contrast white surface + subtle electric violet aura
      primary:
        'bg-white text-zinc-950 font-bold hover:bg-slate-100 shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_32px_rgba(139,92,246,0.5)] border border-white/20 active:scale-[0.98]',
      
      // 2. Secondary: Minimal dark surface + subtle border
      secondary:
        'bg-[#181924]/90 hover:bg-[#222433] text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.18] shadow-xs active:scale-[0.98]',
      
      outline:
        'bg-transparent hover:bg-white/[0.06] text-slate-200 hover:text-white border border-white/[0.12] hover:border-violet-400/40',
      
      ghost:
        'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border-0',
      
      accent:
        'bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-violet-400/30',
      
      gradient:
        'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-[0_0_25px_rgba(139,92,246,0.35)] border border-white/15',
      
      danger:
        'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 hover:border-rose-400/50 shadow-xs',
      
      tactile:
        'bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-[0_4px_0_0_#5B21B6] active:translate-y-1 active:shadow-none',
      
      'tactile-success':
        'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_4px_0_0_#065F46] active:translate-y-1 active:shadow-none',
      
      glass:
        'bg-[#12131A]/75 hover:bg-[#181924]/90 text-slate-200 hover:text-white backdrop-blur-md border border-white/[0.08] shadow-xs',
    }[variant];

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={disabled || isLoading ? undefined : { y: -1, scale: 1.01 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        className={`group inline-flex items-center justify-center transition-all cursor-pointer select-none tracking-tight ${
          fullWidth ? 'w-full' : ''
        } ${sizeClasses} ${variantClasses} ${
          disabled || isLoading ? 'opacity-50 pointer-events-none' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && (
            <span className="inline-flex shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5">
              {leftIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1">
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
