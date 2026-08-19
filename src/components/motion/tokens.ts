/**
 * SkillSwap Centralized Motion & Animation Tokens
 * Strict Stage 1 & Stage 8 Foundation
 */

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.18,      // 150 - 200ms
    standard: 0.35,  // 300 - 450ms
    cinematic: 0.65, // 550 - 750ms
  },
  
  spring: {
    // Shared medium stiffness, restrained damping
    medium: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 24,
      mass: 0.4,
    },
    snappy: {
      type: 'spring' as const,
      stiffness: 440,
      damping: 24,
      mass: 0.3,
    },
    gentle: {
      type: 'spring' as const,
      stiffness: 180,
      damping: 26,
      mass: 0.6,
    },
    bouncy: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 16,
      mass: 0.4,
    },
  },

  ease: {
    outCubic: [0.22, 1, 0.36, 1] as [number, number, number, number],
    outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
    editorial: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    inOutCubic: [0.65, 0, 0.35, 1] as [number, number, number, number],
  },

  stagger: {
    fast: 0.035,
    standard: 0.06,
    relaxed: 0.1,
  },

  /** Shared Micro-interaction Presets for Motion components */
  interactions: {
    button: {
      hover: { y: -1, scale: 1.01 },
      tap: { scale: 0.98, y: 0 },
      transition: { type: 'spring', stiffness: 420, damping: 24 },
    },
    card: {
      hover: { y: -3 },
      tap: { scale: 0.995 },
      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    },
    chip: {
      hover: { scale: 1.03 },
      tap: { scale: 0.97 },
      transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
    },
    avatar: {
      hover: { scale: 1.06 },
      tap: { scale: 0.96 },
      transition: { type: 'spring', stiffness: 400, damping: 22 },
    },
    tab: {
      tap: { scale: 0.98 },
      transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
    },
    iconAction: {
      hover: { scale: 1.1 },
      tap: { scale: 0.92 },
      transition: { type: 'spring', stiffness: 450, damping: 20 },
    },
  },
} as const;

/**
 * Utility helper to check if reduced motion is requested
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
