import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GamificationToast, Badge } from '../types';
import { Sparkles, Trophy, Zap, Award, X, CheckCircle2 } from 'lucide-react';
import { triggerCelebrationConfetti } from '../lib/gamification';

interface GamificationOverlayProps {
  toasts: GamificationToast[];
  unlockedBadge: Badge | null;
  onDismissToast: (id: string) => void;
  onCloseBadgeModal: () => void;
}

export const GamificationOverlay: React.FC<GamificationOverlayProps> = ({
  toasts,
  unlockedBadge,
  onDismissToast,
  onCloseBadgeModal
}) => {
  return (
    <>
      {/* Floating XP & Reward Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.8 }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-4 border border-amber-500/40 shadow-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shrink-0">
                  {toast.icon || '⚡'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-white">{toast.title}</h4>
                    {toast.xpAmount && (
                      <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-full text-[10px] font-black">
                        +{toast.xpAmount} XP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
                </div>
              </div>

              <button
                onClick={() => onDismissToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer border-0 bg-transparent shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Badge Earned Celebration Modal */}
      <AnimatePresence>
        {unlockedBadge && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className="bg-slate-900 border border-amber-500/50 text-white rounded-[32px] w-full max-w-md p-8 text-center shadow-2xl relative overflow-hidden space-y-6"
            >
              {/* Background Light Beams */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-xs font-black text-amber-300">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
                <span>NEW ACHIEVEMENT UNLOCKED!</span>
              </div>

              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-amber-500/50 border-4 border-white/20 transform hover:scale-105 transition">
                  {unlockedBadge.icon}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">{unlockedBadge.name}</h2>
                <p className="text-sm text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
                  {unlockedBadge.description}
                </p>
              </div>

              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                <Zap className="w-4 h-4 fill-amber-300" />
                <span>+150 XP Bonus Awarded to Profile!</span>
              </div>

              <button
                onClick={() => {
                  triggerCelebrationConfetti();
                  onCloseBadgeModal();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:opacity-95 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition cursor-pointer"
              >
                Claim Badge Reward 🚀
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
