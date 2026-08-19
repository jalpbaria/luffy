import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate, useReducedMotion } from 'motion/react';

export interface MagneticButtonProps {
  children: React.ReactNode;
  /** Entrance animation delay in seconds */
  delay?: number;
  /** Entrance duration in seconds */
  duration?: number;
  /** Maximum magnetic displacement distance in pixels (defaults to 6px, restrained) */
  maxDisplacement?: number;
  /** Whether to render subtle pointer-following ambient glow inside the button */
  glow?: boolean;
  /** Glow color tone */
  glowTone?: 'violet' | 'lavender' | 'emerald' | 'white';
  /** Custom CSS classes */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional custom cursor label */
  cursorLabel?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  maxDisplacement = 6,
  glow = true,
  glowTone = 'violet',
  className = '',
  onClick,
  cursorLabel,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Magnetic displacement motion values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Restrained, physical spring physics (tactile, not floaty or playful)
  const springConfig = { damping: 24, stiffness: 340, mass: 0.35 };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);

  // Internal pointer glow coordinates
  const glowX = useMotionValue(-100);
  const glowY = useMotionValue(-100);

  const glowColorMap = {
    violet: 'rgba(139, 92, 246, 0.22)',
    lavender: 'rgba(196, 181, 253, 0.22)',
    emerald: 'rgba(16, 185, 129, 0.22)',
    white: 'rgba(255, 255, 255, 0.15)',
  };

  const glowBackground = useMotionTemplate`radial-gradient(120px circle at ${glowX}px ${glowY}px, ${glowColorMap[glowTone]}, transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !buttonRef.current) return;

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Normalize and clamp displacement to maxDisplacement
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    const distance = Math.hypot(offsetX, offsetY);
    const maxRadius = Math.max(width, height) / 2;

    if (distance > 0) {
      const factor = Math.min(1, distance / maxRadius);
      const clampedX = (offsetX / distance) * factor * maxDisplacement;
      const clampedY = (offsetY / distance) * factor * maxDisplacement;
      rawX.set(clampedX);
      rawY.set(clampedY);
    }

    if (glow) {
      glowX.set(e.clientX - left);
      glowY.set(e.clientY - top);
    }
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
    if (glow) {
      glowX.set(-100);
      glowY.set(-100);
    }
  };

  if (prefersReducedMotion) {
    return (
      <div
        onClick={onClick}
        data-cursor="interactive"
        data-cursor-label={cursorLabel}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={buttonRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ x: smoothX, y: smoothY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-cursor="interactive"
      data-cursor-label={cursorLabel}
      className={`relative inline-block overflow-hidden rounded-xl ${className}`}
    >
      {/* Subtle pointer-following radial light glow */}
      {glow && (
        <motion.div
          className="pointer-events-none absolute -inset-px z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-inherit"
          style={{ background: glowBackground }}
        />
      )}
      {children}
    </motion.div>
  );
};

MagneticButton.displayName = 'MagneticButton';
export default MagneticButton;
