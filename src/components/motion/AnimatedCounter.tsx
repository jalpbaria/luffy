import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue, useReducedMotion } from 'motion/react';

export interface AnimatedCounterProps {
  /** Target numeric value */
  value: number;
  /** Optional string prefix (e.g. '$', '+') */
  prefix?: string;
  /** Optional string suffix (e.g. ' XP', ' Credits') */
  suffix?: string;
  /** Number of decimal places to format */
  decimals?: number;
  /** Additional CSS classes */
  className?: string;
  /** Spring stiffness */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  stiffness = 60,
  damping = 16,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const motionVal = useMotionValue<number>(prefersReducedMotion ? value : 0);
  const springVal = useSpring(motionVal, { stiffness, damping, mass: 0.6 });
  const displayVal = useTransform(springVal, (current: number) => {
    const num = typeof current === 'number' ? current : Number(current) || 0;
    const formatted = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      motionVal.set(value);
    } else {
      // Trigger smooth spring animation up to target value
      motionVal.set(0);
      const frame = requestAnimationFrame(() => {
        motionVal.set(value);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [value, motionVal, prefersReducedMotion]);

  if (prefersReducedMotion) {
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
    return <span className={className}>{`${prefix}${formatted}${suffix}`}</span>;
  }

  return <motion.span className={className}>{displayVal}</motion.span>;
};

AnimatedCounter.displayName = 'AnimatedCounter';
export default AnimatedCounter;
