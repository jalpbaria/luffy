import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Booking } from '../../types';
import { getSessionGateStatus } from '../../lib/liveSessions';

export interface ActiveSessionBannerProps {
  /** All user bookings to inspect for active/upcoming live sessions */
  bookings: Booking[];
  /** Current user ID to determine role and ownership */
  currentUserId?: string;
  /** Callback when user clicks to enter the live classroom */
  onJoinSession: (booking: Booking) => void;
  /** Optional custom CSS classes */
  className?: string;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({
  bookings,
  currentUserId,
  onJoinSession,
  className = '',
}) => {
  // Find the most urgent live or upcoming session within a 15-minute start window
  const activeOrUpcomingSession = useMemo(() => {
    if (!currentUserId || !bookings.length) return null;

    const relevant = bookings.filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'rescheduled') &&
        (b.teacherId === currentUserId || b.learnerId === currentUserId)
    );

    for (const booking of relevant) {
      const gate = getSessionGateStatus(booking);
      const now = Date.now();
      const startTime = gate.startTime.getTime();
      const fifteenMinBefore = startTime - 15 * 60 * 1000;
      const oneHourAfter = startTime + 60 * 60 * 1000;

      // Active if within 15 minutes before start, or currently ongoing
      if (now >= fifteenMinBefore && now <= oneHourAfter) {
        const isLiveNow = gate.status === 'joinable';
        const partnerName = booking.teacherId === currentUserId ? booking.learnerName : booking.teacherName;
        const role = booking.teacherId === currentUserId ? 'Teaching' : 'Learning';

        return {
          booking,
          gate,
          isLiveNow,
          partnerName,
          role,
        };
      }
    }
    return null;
  }, [bookings, currentUserId]);

  if (!activeOrUpcomingSession) return null;

  const { booking, gate, isLiveNow, partnerName, role } = activeOrUpcomingSession;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Active session banner"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={`sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-brass/30 px-4 py-2.5 shadow-lg ${className}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          {/* Status Indicator & Details */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLiveNow ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isLiveNow ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>

              <span className="font-extrabold text-parchment flex items-center gap-1.5 text-xs sm:text-sm">
                <Video className="w-4 h-4 text-brass-light" />
                {isLiveNow ? 'Live Classroom Active' : 'Session Starting Soon'}
              </span>
            </div>

            <div className="text-xs text-slate-300 font-medium hidden md:flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                {role} {booking.skillName}
              </span>
              <span>with {partnerName}</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {gate.formattedTime}
              </span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onJoinSession(booking)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brass to-brass-light text-slate-950 font-bold rounded-xl text-xs hover:opacity-95 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isLiveNow ? 'Enter Live Room' : 'Join Early'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

ActiveSessionBanner.displayName = 'ActiveSessionBanner';
export default ActiveSessionBanner;
