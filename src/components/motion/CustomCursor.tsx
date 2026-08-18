import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

export type CursorVariant = 'default' | 'interactive' | 'labeled' | 'hidden';

export interface CustomCursorProps {
  /** Optional custom color tone */
  tone?: 'brass' | 'sage';
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ tone = 'brass' }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>('default');
  const [cursorLabel, setCursorLabel] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth trailing spring physics
  const springConfig = { damping: 28, stiffness: 450, mass: 0.4 };
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

      // Check target element for custom data-cursor-label or interactive tag
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const labeledElement = target.closest('[data-cursor-label]') as HTMLElement | null;
      if (labeledElement) {
        const label = labeledElement.getAttribute('data-cursor-label') || 'VIEW';
        setCursorLabel(label);
        setCursorVariant('labeled');
        return;
      }

      const interactiveElement = target.closest(
        'button, a, input, select, textarea, [role="button"], [data-cursor="interactive"], [data-cursor-interactive="true"]'
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

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  // If touch device or server-side, completely return null (no DOM tree added)
  if (isTouchDevice) {
    return null;
  }

  const toneGlow =
    tone === 'brass'
      ? 'shadow-[0_0_20px_rgba(176,141,87,0.45)] border-brass/60 bg-brass/20 text-brass-light'
      : 'shadow-[0_0_20px_rgba(138,154,126,0.45)] border-sage/60 bg-sage/20 text-sage-light';

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
          {cursorVariant === 'default' && (
            <motion.div
              layoutId="custom-cursor"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="w-3.5 h-3.5 rounded-full bg-brass/90 border border-white/40 shadow-xs backdrop-blur-xs"
            />
          )}

          {cursorVariant === 'interactive' && (
            <motion.div
              layoutId="custom-cursor"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`w-9 h-9 rounded-full border backdrop-blur-sm ${toneGlow} transition-colors`}
            />
          )}

          {cursorVariant === 'labeled' && (
            <motion.div
              layoutId="custom-cursor"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className={`px-3 py-1 rounded-full border backdrop-blur-md font-black text-[10px] uppercase tracking-widest ${toneGlow}`}
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
