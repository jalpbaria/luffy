import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'indigo',
  className = '',
}) => {
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badgeBg: 'bg-indigo-50/80 text-indigo-700',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badgeBg: 'bg-purple-50/80 text-purple-700',
    },
    cyan: {
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      badgeBg: 'bg-cyan-50/80 text-cyan-700',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeBg: 'bg-emerald-50/80 text-emerald-700',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badgeBg: 'bg-amber-50/80 text-amber-700',
    },
  }[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`white-card p-5 sm:p-6 space-y-3 relative overflow-hidden group ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${colorStyles.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {trend.isPositive !== false ? (
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-600" />
            )}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
