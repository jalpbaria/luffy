import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface RevealOnScrollProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Slide direction for entrance animation */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Duration of animation in seconds */
  duration?: number;
  /** Distance in pixels for the slide offset */
  distance?: number;
  /** Custom CSS classes */
  className?: string;
  /** Whether the animation should trigger only once */
  once?: boolean;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 24,
  className = '',
  once = true,
  ...props
}) => {
  const getInitialOffset = () => {
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

  const initialOffset = getInitialOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

RevealOnScroll.displayName = 'RevealOnScroll';
export default RevealOnScroll;
