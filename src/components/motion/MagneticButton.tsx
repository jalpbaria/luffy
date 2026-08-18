import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export interface MagneticButtonProps {
  children: React.ReactNode;
  /** Entrance animation delay in seconds */
  delay?: number;
  /** Entrance duration in seconds */
  duration?: number;
  /** Strength of magnetic cursor attraction */
  strength?: number;
  /** Custom CSS classes */
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  delay = 0.4,
  duration = 0.45,
  strength = 0.28,
  className = '',
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 220, mass: 0.5 };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    rawX.set(deltaX);
    rawY.set(deltaY);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={buttonRef}
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ x: smoothX, y: smoothY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

MagneticButton.displayName = 'MagneticButton';
export default MagneticButton;
