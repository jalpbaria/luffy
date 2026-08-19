import React, { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';

export interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Spotlight color theme */
  tone?: 'violet' | 'lavender' | 'white' | string;
  /** Spotlight radius in pixels */
  radius?: number;
  /** Spotlight intensity (0 to 1) */
  opacity?: number;
  /** Custom CSS classes */
  className?: string;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  children,
  tone = 'violet',
  radius = 280,
  opacity = 0.14,
  className = '',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const getColorRgba = () => {
    switch (tone) {
      case 'violet':
        return `rgba(139, 92, 246, ${opacity})`;
      case 'lavender':
        return `rgba(196, 181, 253, ${opacity})`;
      case 'white':
        return `rgba(255, 255, 255, ${opacity})`;
      default:
        return tone;
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

Spotlight.displayName = 'Spotlight';
export default Spotlight;
