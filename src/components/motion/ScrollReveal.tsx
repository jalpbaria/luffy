import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { motionTokens, isReducedMotion } from './tokens';

export interface ScrollRevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = motionTokens.duration.standard,
  distance = 20,
  className = '',
  once = true,
  ...props
}) => {
  const reduced = isReducedMotion();

  const getInitialOffset = () => {
    if (reduced || direction === 'none') return { x: 0, y: 0 };
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getInitialOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset, filter: reduced ? 'none' : 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-30px' }}
      transition={{
        duration,
        delay,
        ease: motionTokens.ease.outCubic,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.displayName = 'ScrollReveal';
export default ScrollReveal;
