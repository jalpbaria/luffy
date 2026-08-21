import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from './tokens';

export interface RevealTextProps {
  /** The text string to reveal word-by-word. Can also pass string children */
  text?: string;
  children?: React.ReactNode;
  /** Initial delay before first word starts in seconds */
  delay?: number;
  /** Stagger time between words in seconds (default ~0.04s) */
  staggerDelay?: number;
  /** CSS class for wrapper container */
  className?: string;
  /** CSS class applied to each individual word */
  wordClassName?: string;
  /** Custom translation offset in px */
  offsetY?: number;
  /** Whether to animate as a heading element (h1, h2, h3, span, etc.) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  children,
  delay = 0.05,
  staggerDelay = motionTokens.stagger.fast,
  className = '',
  wordClassName = '',
  offsetY = 16,
  as: Component = 'span',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const content = text || (typeof children === 'string' ? children : '');
  const words = content.trim().split(/\s+/).filter(Boolean);

  if (prefersReducedMotion) {
    if (!text && typeof children !== 'string') {
      return <div className={className}>{children}</div>;
    }
    return <span className={className}>{content}</span>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: offsetY,
      filter: 'blur(5px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: motionTokens.duration.standard,
        ease: motionTokens.ease.outCubic,
      },
    },
  };

  // If children is complex React elements rather than a simple string
  if (!text && typeof children !== 'string') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: offsetY, filter: 'blur(4px)' },
          visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: motionTokens.duration.standard, delay, ease: motionTokens.ease.outCubic },
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`inline-flex flex-wrap gap-x-[0.28em] gap-y-1 ${className}`}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={wordVariants}
          className={`inline-block ${wordClassName}`}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

RevealText.displayName = 'RevealText';
export default RevealText;
