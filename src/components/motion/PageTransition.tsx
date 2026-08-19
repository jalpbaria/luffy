import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{
          duration: motionTokens.duration.standard,
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
