import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
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
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    secondary: 'bg-purple-50 text-purple-700 border-purple-200/80',
    accent: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    duolingo: 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-2xs',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold border transition-colors ${
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
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
          : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs'
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 shadow-2xs transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:text-indigo-600' : ''
      } ${className}`}
    >
      <span>{name}</span>
      {level && (
        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
          {level}
        </span>
      )}
    </span>
  );
};
