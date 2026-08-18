import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';

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
  stiffness = 100,
  damping = 18,
}) => {
  const motionVal = useMotionValue<number>(value);
  const springVal = useSpring(motionVal, { stiffness, damping, mass: 0.8 });
  const displayVal = useTransform(springVal, (current: number) => {
    const num = typeof current === 'number' ? current : Number(current) || 0;
    const formatted = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{displayVal}</motion.span>;
};

AnimatedCounter.displayName = 'AnimatedCounter';
export default AnimatedCounter;
