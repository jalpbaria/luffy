import React from 'react';

export interface DashboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardButton: React.FC<DashboardButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight select-none cursor-pointer transition-all duration-200 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-purple,#A66CFF)] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5',
  };

  const variantStyles = {
    // Primary: background var(--accent-purple), dark text, rounded corners (not full pill), subtle hover: slight brightness increase + 2-4px translateY lift, transition under 300ms.
    primary:
      'bg-[var(--accent-purple,#A66CFF)] text-[#0B0A0F] font-bold shadow-[0_2px_12px_rgba(166,108,255,0.25)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 border-0',
    // Secondary: dark background, 1px var(--border-subtle) border, var(--text-primary) text, same hover lift pattern but no color fill change.
    secondary:
      'bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[var(--text-primary,#F5F2FA)] font-semibold hover:-translate-y-0.5 hover:border-white/20 active:translate-y-0 shadow-xs',
    // Ghost
    ghost:
      'bg-transparent text-[var(--text-muted,#96919F)] hover:text-[var(--text-primary,#F5F2FA)] hover:bg-white/[0.04] active:translate-y-0 rounded-xl',
    // Danger
    danger:
      'bg-rose-950/70 border border-rose-500/30 text-rose-300 font-semibold hover:bg-rose-900/80 hover:-translate-y-0.5 active:translate-y-0',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};

export interface DashboardTextLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  arrow?: boolean;
}

export const DashboardTextLink: React.FC<DashboardTextLinkProps> = ({
  children,
  arrow = true,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`group inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-purple,#A66CFF)] hover:brightness-110 transition-all duration-200 cursor-pointer select-none border-0 bg-transparent p-0 ${className}`}
      {...props}
    >
      <span>{children}</span>
      {arrow && (
        <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      )}
    </button>
  );
};

export default DashboardButton;
