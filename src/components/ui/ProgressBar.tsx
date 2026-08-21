import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Zap } from 'lucide-react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'violet';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'violet',
  height = 'md',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClasses = {
    violet: 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_12px_rgba(139,92,246,0.4)]',
    indigo: 'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]',
    purple: 'bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    cyan: 'bg-gradient-to-r from-cyan-400 to-teal-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
    emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  }[color];

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[height];

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-slate-400 font-mono">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#12131A] rounded-full overflow-hidden p-0.5 border border-white/[0.08] ${heightClasses}`}>
        {prefersReducedMotion ? (
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full ${colorClasses}`}
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full ${colorClasses}`}
          />
        )}
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
  const prefersReducedMotion = useReducedMotion();
  const percentage = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));

  return (
    <div className={`dark-surface p-4 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Level {level} Explorer</span>
            <span className="text-[11px] text-slate-400 font-medium">{currentXP} / {nextLevelXP} XP</span>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/25">
          {percentage}% to Lvl {level + 1}
        </span>
      </div>

      <div className="w-full bg-[#0E0F17] rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.08]">
        {prefersReducedMotion ? (
          <div
            style={{ width: `${percentage}%` }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
          />
        )}
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
  color = '#A66CFF',
  label,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {prefersReducedMotion ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        ) : (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            strokeLinecap="round"
            fill="transparent"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-white font-mono">{Math.round(value)}%</span>
        {label && <span className="text-[9px] text-[var(--text-muted,#96919F)] font-medium">{label}</span>}
      </div>
    </div>
  );
};
