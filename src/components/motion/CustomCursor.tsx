import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence, useReducedMotion } from 'motion/react';

export type CursorVariant = 'default' | 'interactive' | 'labeled' | 'hidden';

export interface CustomCursorProps {
  /** Optional custom color tone */
  tone?: 'violet' | 'lavender' | 'brass' | 'sage';
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ tone = 'violet' }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>('default');
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth, snappy trailing spring physics for instant tactile response
  const springConfig = { damping: 26, stiffness: 520, mass: 0.22 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Touch device detection (do not render at all on touch/mobile)
    if (typeof window === 'undefined') return;

    const hasTouch =
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      window.matchMedia('(pointer: coarse)').matches;

    if (hasTouch) {
      setIsTouchDevice(true);
      return;
    }

    setIsTouchDevice(false);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check target element for custom data-cursor-label or interactive tags
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Explicit data-cursor-label element
      const labeledElement = target.closest('[data-cursor-label]') as HTMLElement | null;
      if (labeledElement) {
        const label = labeledElement.getAttribute('data-cursor-label') || 'VIEW';
        setCursorLabel(label);
        setCursorVariant('labeled');
        return;
      }

      // 2. Cards or images without explicit label (auto-tagging common card targets)
      const cardElement = target.closest(
        '[data-cursor-card], .dark-feature-surface, [data-card-interactive]'
      ) as HTMLElement | null;
      if (cardElement) {
        const customCardLabel = cardElement.getAttribute('data-cursor-card') || 'EXPLORE';
        setCursorLabel(customCardLabel);
        setCursorVariant('labeled');
        return;
      }

      // 3. Interactive standard controls
      const interactiveElement = target.closest(
        'button, a, input, select, textarea, [role="button"], [role="tab"], [data-cursor="interactive"], [data-cursor-interactive="true"]'
      );
      if (interactiveElement) {
        setCursorLabel('');
        setCursorVariant('interactive');
        return;
      }

      setCursorLabel('');
      setCursorVariant('default');
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  // If touch device, server-side, or prefers-reduced-motion is true: do not render
  if (isTouchDevice || prefersReducedMotion) {
    return null;
  }

  const toneGlow = {
    violet: 'shadow-[0_0_20px_rgba(139,92,246,0.4)] border-violet-400/50 bg-violet-600/20 text-violet-200',
    lavender: 'shadow-[0_0_20px_rgba(196,181,253,0.4)] border-purple-300/50 bg-purple-500/20 text-purple-200',
    brass: 'shadow-[0_0_20px_rgba(176,141,87,0.4)] border-amber-400/50 bg-amber-500/20 text-amber-200',
    sage: 'shadow-[0_0_20px_rgba(138,154,126,0.4)] border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
  }[tone];

  const dotBg = {
    violet: 'bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.9)]',
    lavender: 'bg-purple-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]',
    brass: 'bg-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.9)]',
    sage: 'bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.9)]',
  }[tone];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          aria-hidden="true"
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center select-none"
        >
          {/* Default: Small Dot (4px) with subtle ambient aura */}
          {cursorVariant === 'default' && (
            <motion.div
              layoutId="custom-cursor-indicator"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`w-2 h-2 rounded-full border border-white/40 backdrop-blur-xs ${dotBg}`}
            />
          )}

          {/* Interactive Control: Medium expanding ring with translucent fill */}
          {cursorVariant === 'interactive' && (
            <motion.div
              layoutId="custom-cursor-indicator"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={`w-8 h-8 rounded-full border backdrop-blur-sm ${toneGlow} transition-colors`}
            />
          )}

          {/* Labeled Card/Image Hover: Crisp pill with uppercase typography */}
          {cursorVariant === 'labeled' && (
            <motion.div
              layoutId="custom-cursor-indicator"
              initial={{ scale: 0.75, opacity: 0, y: 4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={`px-3 py-1 rounded-full border backdrop-blur-md font-sans font-bold text-[10px] uppercase tracking-widest shadow-xl ${toneGlow}`}
            >
              {cursorLabel || 'VIEW'}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

CustomCursor.displayName = 'CustomCursor';
export default CustomCursor;
