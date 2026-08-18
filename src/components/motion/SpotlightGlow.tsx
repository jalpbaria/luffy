import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';

export interface SpotlightGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Color tone or custom rgba/hex string */
  color?: 'brass' | 'sage' | 'indigo' | 'white' | string;
  /** Spotlight radius in pixels */
  radius?: number;
  /** Spotlight intensity/opacity (0 to 1) */
  opacity?: number;
  /** Custom CSS classes */
  className?: string;
}

export const SpotlightGlow: React.FC<SpotlightGlowProps> = ({
  children,
  color = 'brass',
  radius = 280,
  opacity = 0.18,
  className = '',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const getColorRgba = () => {
    switch (color) {
      case 'brass':
        return `rgba(176, 141, 87, ${opacity})`;
      case 'sage':
        return `rgba(138, 154, 126, ${opacity})`;
      case 'indigo':
        return `rgba(99, 102, 241, ${opacity})`;
      case 'white':
        return `rgba(255, 255, 255, ${opacity})`;
      default:
        return color;
    }
  };

  const colorRgba = getColorRgba();
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${colorRgba}, transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-1000);
    mouseY.set(-1000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{ background }}
      />
      {children}
    </div>
  );
};

SpotlightGlow.displayName = 'SpotlightGlow';
export default SpotlightGlow;
