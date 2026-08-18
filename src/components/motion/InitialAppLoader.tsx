import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';
import { AmbientOrb } from '../ui/AmbientOrb';

export interface InitialAppLoaderProps {
  /** Optional callback fired when initial transition finishes */
  onComplete?: () => void;
}

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(() => {
    // Only fire once per browser session, never on internal tab/route navigations
    if (typeof window === 'undefined') return false;
    try {
      const hasLoaded = sessionStorage.getItem('skillswap_initial_load_complete');
      return !hasLoaded;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isVisible) {
      onComplete?.();
      return;
    }

    try {
      // Mark as completed in sessionStorage so it only fires ONCE per browser session
      sessionStorage.setItem('skillswap_initial_load_complete', 'true');
    } catch {
      // Ignore storage restrictions if in sandboxed context
    }

    // Under 1.2s total sequence: brief display then smooth reveal
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1050);

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="initial-app-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(6px)',
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden"
          style={{ willChange: 'opacity, transform, filter' }}
        >
          {/* Minimal motion indicator: AmbientOrb glow emerging from center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.75, scale: 1.15 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <AmbientOrb tone="indigo" size="lg" className="opacity-80" />
            </motion.div>
          </div>

          {/* Logo / Brand mark */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-3.5"
          >
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 border border-white/20">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.25 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center"
              >
                <Sparkles className="w-2.5 h-2.5 text-black" />
              </motion.div>
            </div>

            <div className="text-center space-y-0.5">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-base font-black tracking-tight text-white block"
              >
                SkillSwap
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block"
              >
                Peer Barter Platform
              </motion.span>
            </div>
          </motion.div>

          {/* Smooth Clip/Mask progression indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-slate-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
