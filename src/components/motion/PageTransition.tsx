import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { motionTokens } from './tokens';

export interface PageTransitionProps {
  viewKey: string;
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  viewKey,
  children,
  className = 'w-full',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div key={viewKey} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        initial={{
          opacity: 0,
          y: 10,
          scale: 0.995,
          filter: 'blur(3px)',
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.995,
          filter: 'blur(3px)',
        }}
        transition={{
          duration: 0.45,
          ease: motionTokens.ease.outCubic,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

PageTransition.displayName = 'PageTransition';
export default PageTransition;
