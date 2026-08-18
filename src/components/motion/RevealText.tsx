import React from 'react';
import { motion } from 'motion/react';

export interface RevealTextProps {
  /** The text string to reveal word-by-word. Can also pass string children */
  text?: string;
  children?: React.ReactNode;
  /** Initial delay before first word starts in seconds */
  delay?: number;
  /** Stagger time between words in seconds (default ~0.04s for 0-700ms total) */
  staggerDelay?: number;
  /** CSS class for wrapper container */
  className?: string;
  /** CSS class applied to each word */
  wordClassName?: string;
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  children,
  delay = 0,
  staggerDelay = 0.045,
  className = '',
  wordClassName = '',
}) => {
  const content = text || (typeof children === 'string' ? children : '');
  const words = content.split(' ');

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
      y: 16,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
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
          hidden: { opacity: 0, y: 14 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
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
