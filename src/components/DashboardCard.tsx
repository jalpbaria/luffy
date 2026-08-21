import React from 'react';
import { SpotlightGlow } from './motion/SpotlightGlow';

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  spotlight?: boolean;
  className?: string;
  id?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  variant = 'default',
  spotlight = true,
  className = '',
  id,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[var(--surface,#15131A)] border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[var(--text-primary,#F5F2FA)] shadow-[0_4px_20px_rgba(0,0,0,0.45)]',
    elevated: 'bg-[var(--surface-elevated,#1B1722)] border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[var(--text-primary,#F5F2FA)] shadow-[0_8px_28px_rgba(0,0,0,0.55)]',
    subtle: 'bg-[var(--surface,#15131A)]/60 border-[var(--border-subtle,rgba(255,255,255,0.06))] text-[var(--text-primary,#F5F2FA)]',
  };

  const cardClasses = `dashboard-card group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 ${variantStyles[variant]} ${className}`;

  if (spotlight) {
    return (
      <SpotlightGlow
        id={id}
        color="violet"
        radius={280}
        opacity={0.06}
        className={cardClasses}
        {...props}
      >
        {children}
      </SpotlightGlow>
    );
  }

  return (
    <div
      id={id}
      className={cardClasses}
      {...props}
    >
      {children}
    </div>
  );
};

export default DashboardCard;
