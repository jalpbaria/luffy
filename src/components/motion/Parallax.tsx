import React, { useRef } from 'react';
import { motion, useScroll, useTransform, HTMLMotionProps } from 'motion/react';
import { isReducedMotion } from './tokens';

export interface ParallaxProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Distance in pixels to travel during scroll (positive moves up, negative moves down) */
  distance?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  distance = 50,
  className = '',
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const reduced = isReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], [-distance / 2, distance / 2]);

  return (
    <div ref={ref} className={`relative overflow-visible ${className}`}>
      <motion.div style={{ y: reduced ? 0 : y }} {...props}>
        {children}
      </motion.div>
    </div>
  );
};

Parallax.displayName = 'Parallax';
export default Parallax;
