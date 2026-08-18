import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, HTMLMotionProps } from 'framer-motion';

export interface TiltCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Glow tone on hover */
  glow?: 'brass' | 'sage';
  /** Optional custom Tailwind classes controlling the visual base */
  className?: string;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
}

export const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ children, glow = 'brass', className = '', maxTilt = 10, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const cardRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    const glowStyles = {
      brass: 'hover:ring-2 hover:ring-brass/40 hover:shadow-[0_0_25px_rgba(176,141,87,0.25)]',
      sage: 'hover:ring-2 hover:ring-sage/40 hover:shadow-[0_0_25px_rgba(138,154,126,0.25)]',
    }[glow];

    return (
      <div style={{ perspective: 1000 }} className="w-full h-full">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className={`relative transition-all duration-300 ${glowStyles} ${className}`}
          {...props}
        >
          {children}
        </motion.div>
      </div>
    );
  }
);

TiltCard.displayName = 'TiltCard';
export default TiltCard;
