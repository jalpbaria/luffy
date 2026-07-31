import React from 'react';
import { motion } from 'motion/react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // Size in px
  strokeWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  label?: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  gradientFrom = '#6366f1',
  gradientTo = '#a855f7',
  label,
  sublabel,
  icon
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const gradientId = `progress-ring-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-40"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Center Label Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {icon && <div className="text-xl mb-0.5">{icon}</div>}
        <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">
          {label !== undefined ? label : `${Math.round(clampedProgress)}%`}
        </span>
        {sublabel && (
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
