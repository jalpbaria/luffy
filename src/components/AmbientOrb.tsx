import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export interface AmbientOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Color tone for the glowing radial gradient */
  tone?: 'brass' | 'sage';
  /** Placement preset within a relative container */
  position?: 'top-left' | 'top-right' | 'center';
  /** Strength multiplier (0 to 1) for opacity */
  intensity?: number;
  /** Whether the orb drifts with heavy inertia toward the cursor on desktop */
  cursorReactive?: boolean;
  /** Optional custom Tailwind classes */
  className?: string;
  /** Size preset of the orb */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AmbientOrb: React.FC<AmbientOrbProps> = ({
  tone = 'brass',
  position = 'center',
  intensity = 0.75,
  cursorReactive = false,
  className = '',
  size = 'lg',
  style,
  ...props
}) => {
  const [isDesktopAndMotionSafe, setIsDesktopAndMotionSafe] = useState(false);

  useEffect(() => {
    if (!cursorReactive || typeof window === 'undefined') return;

    const checkCapabilities = () => {
      const isDesktop = window.innerWidth >= 1024;
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDesktopAndMotionSafe(isDesktop && !isReducedMotion);
    };

    checkCapabilities();
    window.addEventListener('resize', checkCapabilities);
    return () => window.removeEventListener('resize', checkCapabilities);
  }, [cursorReactive]);

  // Inertial spring for slow cursor drift
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 40, damping: 20, mass: 1.2 });
  const springY = useSpring(rawY, { stiffness: 40, damping: 20, mass: 1.2 });

  useEffect(() => {
    if (!cursorReactive || !isDesktopAndMotionSafe || typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = ((e.clientX - centerX) / centerX) * 55;
      const deltaY = ((e.clientY - centerY) / centerY) * 55;
      rawX.set(deltaX);
      rawY.set(deltaY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorReactive, isDesktopAndMotionSafe, rawX, rawY]);

  const sizeClasses = {
    sm: 'w-48 h-48 blur-2xl',
    md: 'w-72 h-72 blur-3xl',
    lg: 'w-96 h-96 blur-3xl',
    xl: 'w-[32rem] h-[32rem] blur-[80px]',
  }[size] || 'w-96 h-96 blur-3xl';

  const positionClasses = {
    'top-left': '-top-24 -left-24',
    'top-right': '-top-24 -right-24',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[position];

  const toneClasses = {
    brass: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brass/35 via-brass-light/15 to-transparent',
    sage: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sage/35 via-sage-light/15 to-transparent',
  }[tone];

  return (
    <motion.div
      aria-hidden="true"
      style={{
        opacity: Math.max(0, Math.min(1, intensity)),
        x: cursorReactive && isDesktopAndMotionSafe ? springX : 0,
        y: cursorReactive && isDesktopAndMotionSafe ? springY : 0,
        ...style,
      }}
      className={`absolute pointer-events-none rounded-full select-none -z-10 motion-safe:animate-orb-pulse motion-safe:animate-orb-drift ${positionClasses} ${sizeClasses} ${toneClasses} ${className}`}
      {...props}
    />
  );
};

AmbientOrb.displayName = 'AmbientOrb';
export default AmbientOrb;
