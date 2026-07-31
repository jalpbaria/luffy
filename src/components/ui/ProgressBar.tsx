import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'indigo',
  height = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClasses = {
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    cyan: 'bg-gradient-to-r from-cyan-400 to-teal-500',
    emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
  }[color];

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[height];

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-slate-500 font-mono">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 ${heightClasses}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClasses}`}
        />
      </div>
    </div>
  );
};

export interface XPProgressProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
}

export const XPProgress: React.FC<XPProgressProps> = ({
  currentXP,
  nextLevelXP,
  level,
  className = '',
}) => {
  const percentage = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block">Level {level} Explorer</span>
            <span className="text-[11px] text-slate-500">{currentXP} / {nextLevelXP} XP</span>
          </div>
        </div>
        <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
          {percentage}% to Lvl {level + 1}
        </span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 shadow-xs"
        />
      </div>
    </div>
  );
};

export interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 64,
  strokeWidth = 6,
  color = '#6366F1',
  label,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-extrabold text-slate-900">{Math.round(value)}%</span>
        {label && <span className="text-[9px] text-slate-500 font-medium">{label}</span>}
      </div>
    </div>
  );
};
