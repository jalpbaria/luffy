import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from 'motion/react';
import { isReducedMotion } from './tokens';

export interface HoverCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  maxTilt?: number;
  glowTone?: 'violet' | 'lavender' | 'none';
  className?: string;
}

export const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ children, maxTilt = 8, glowTone = 'violet', className = '', ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const cardRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const springConfig = { damping: 22, stiffness: 220, mass: 0.5 };
    const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isReducedMotion() || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };

    const handleMouseLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    const glowClass = {
      violet: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:border-violet-500/30',
      lavender: 'hover:shadow-[0_0_30px_rgba(196,181,253,0.18)] hover:border-purple-400/30',
      none: '',
    }[glowTone];

    return (
      <div style={{ perspective: 1000 }} className="w-full h-full">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={
            isReducedMotion()
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  transformStyle: 'preserve-3d',
                }
          }
          className={`relative transition-all duration-300 ${glowClass} ${className}`}
          {...props}
        >
          {children}
        </motion.div>
      </div>
    );
  }
);

HoverCard.displayName = 'HoverCard';
export default HoverCard;
