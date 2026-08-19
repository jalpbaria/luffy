import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'duolingo';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  pill = true,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-violet-950/60 text-violet-300 border-violet-500/25 shadow-xs',
    secondary: 'bg-purple-950/60 text-lavender-200 border-purple-400/25 shadow-xs',
    accent: 'bg-violet-900/40 text-violet-200 border-violet-400/25 shadow-xs',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/25 shadow-xs',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-500/25 shadow-xs',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-500/25 shadow-xs',
    neutral: 'bg-white/[0.06] text-slate-300 border-white/[0.08]',
    duolingo: 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border transition-colors ${
        pill ? 'rounded-full' : 'rounded-lg'
      } ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  children,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
        active
          ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.35)]'
          : 'bg-[#181924] text-slate-400 hover:text-white border-white/[0.07] hover:border-white/[0.16]'
      } ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export interface SkillTagProps {
  name: string;
  level?: string;
  category?: string;
  onClick?: () => void;
  className?: string;
}

export const SkillTag: React.FC<SkillTagProps> = ({
  name,
  level,
  category,
  onClick,
  className = '',
}) => {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#181924] hover:bg-[#202230] border border-white/[0.08] rounded-xl text-xs font-medium text-slate-200 transition-all ${
        onClick ? 'cursor-pointer hover:border-violet-400/40 hover:text-white' : ''
      } ${className}`}
    >
      <span>{name}</span>
      {level && (
        <span className="px-1.5 py-0.2 bg-white/[0.06] text-slate-400 text-[10px] font-semibold rounded-md">
          {level}
        </span>
      )}
    </span>
  );
};
