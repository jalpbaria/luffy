import React from 'react';
import { motion, HTMLMotionProps, useReducedMotion } from 'motion/react';

export interface FadeUpProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Delay before entrance animation in seconds */
  delay?: number;
  /** Duration of entrance animation in seconds */
  duration?: number;
  /** Distance in pixels to slide up */
  distance?: number;
  /** Custom CSS classes */
  className?: string;
}

export const FadeUp: React.FC<FadeUpProps> = ({
  children,
  delay = 0.2,
  duration = 0.45,
  distance = 18,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: distance, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

FadeUp.displayName = 'FadeUp';
export default FadeUp;
