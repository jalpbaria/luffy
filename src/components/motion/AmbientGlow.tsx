import React from 'react';
import { motion } from 'motion/react';

export interface AmbientGlowProps {
  tone?: 'violet' | 'lavender' | 'indigo' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vivid';
  pulse?: boolean;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  tone = 'violet',
  size = 'md',
  className = '',
  intensity = 'subtle',
  pulse = true,
}) => {
  const sizeClasses = {
    sm: 'w-48 h-48 blur-2xl',
    md: 'w-72 h-72 blur-3xl',
    lg: 'w-96 h-96 blur-[90px]',
    xl: 'w-[480px] h-[480px] blur-[120px]',
    hero: 'w-[640px] h-[640px] blur-[150px]',
  }[size];

  const toneGradients = {
    violet: 'from-violet-600/30 via-purple-600/20 to-transparent',
    lavender: 'from-purple-400/25 via-violet-300/15 to-transparent',
    indigo: 'from-indigo-600/25 via-violet-600/15 to-transparent',
    emerald: 'from-emerald-500/20 via-teal-600/10 to-transparent',
  }[tone];

  const opacityClass = {
    subtle: 'opacity-40',
    medium: 'opacity-65',
    vivid: 'opacity-90',
  }[intensity];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute select-none -z-10 ${className}`}
    >
      <motion.div
        animate={
          pulse
            ? {
                scale: [1, 1.08, 0.96, 1],
                opacity: [0.35, 0.55, 0.4, 0.35],
              }
            : undefined
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`rounded-full bg-radial ${toneGradients} ${sizeClasses} ${opacityClass}`}
      />
    </div>
  );
};

AmbientGlow.displayName = 'AmbientGlow';
export default AmbientGlow;
