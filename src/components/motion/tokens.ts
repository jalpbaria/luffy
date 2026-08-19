/**
 * SkillSwap Centralized Motion & Animation Tokens
 * Strict Stage 1 Foundation
 */

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.18,      // 150 - 200ms
    standard: 0.35,  // 300 - 450ms
    cinematic: 0.75, // 600 - 900ms
  },
  
  spring: {
    // Shared medium stiffness, restrained damping
    medium: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      mass: 0.5,
    },
    snappy: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 22,
      mass: 0.4,
    },
    gentle: {
      type: 'spring' as const,
      stiffness: 180,
      damping: 28,
      mass: 0.8,
    },
    bouncy: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 15,
      mass: 0.5,
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
} as const;

/**
 * Utility helper to check if reduced motion is requested
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
