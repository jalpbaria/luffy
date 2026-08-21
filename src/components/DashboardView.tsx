import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  BookOpen,
  Sparkles,
  User,
  Calendar,
  Clock,
  Star,
  Check,
  X,
  Trophy,
  Video,
  Users,
  Flame,
  Zap,
  GraduationCap,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Activity,
  Coins,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review } from '../types';
import { calculateUserXP } from '../lib/gamification';
import { getSessionGateStatus, computeStartTime } from '../lib/liveSessions';
import { computeAllUserMatches } from '../lib/matchUtils';
import { DashboardCard } from './DashboardCard';
import { DashboardButton, DashboardTextLink } from './DashboardButton';
import { ProgressBar, CircularProgress } from './ui';
import { RevealText, MagneticButton, AnimatedCounter, FadeUp } from './motion';
import { motionTokens } from './motion/tokens';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'recently';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'recently';
  const diffSecs = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const mins = Math.floor(diffSecs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffSecs / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LiveCountdownBadge({ startTimeMs, isLive }: { startTimeMs: number; isLive: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isLive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  if (isLive) {
    return <span>LIVE NOW • ROOM OPEN</span>;
  }

  const diffMs = startTimeMs - now;
  if (diffMs > 0) {
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return <span>{`${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`}</span>;
  }

  return <span>SESSION IN PROGRESS</span>;
}

/* ==========================================================================
   Next Exchange Hero Widget (Focus / Session Card)
   ========================================================================== */
export const NextExchangeSection = React.memo(function NextExchangeSection({
  booking,
  currentUser,
  allUsers,
  onStartLiveSession,
  onCancelBooking,
  onRescheduleBooking,
  onNavigateToExplore,
}: {
  booking: Booking | null;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onStartLiveSession?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onRescheduleBooking?: (booking: Booking) => void;
  onNavigateToExplore?: () => void;
}) {
  if (!booking) {
    return (
      <DashboardCard className="p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-purple,#A66CFF)]" />
              <span className="dashboard-section-label">
                YOUR FOCUS TODAY • SCHEDULED EXCHANGE
              </span>
            </div>
            <h3 className="dashboard-content-title text-lg sm:text-xl font-bold">
              No live classroom scheduled for today
            </h3>
            <p className="dashboard-metadata leading-relaxed">
              Your calendar is clear. Connect with a mentor or peer swapper to schedule your next 1-on-1 exchange session.
            </p>
          </div>

          <DashboardButton
            variant="primary"
            size="sm"
            onClick={onNavigateToExplore}
            leftIcon={<Compass className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            Find Exchange Partner
          </DashboardButton>
        </div>
      </DashboardCard>
    );
  }

  const gate = getSessionGateStatus(booking);
  const startTimeIso = computeStartTime(booking.date, booking.timeSlot, booking.scheduledTime);
  const startTimeMs = new Date(startTimeIso).getTime();
  const isLive = gate.status === 'joinable';

  // Teacher & Learner details
  const teacherUser = allUsers.find((u) => u.id === booking.teacherId);
  const teacherAvatar = teacherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const teacherName = booking.teacherName;

  const learnerUser = allUsers.find((u) => u.id === booking.learnerId);
  const learnerAvatar = learnerUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
  const learnerName = booking.learnerName;

  const isCurrentUserTeacher = booking.teacherId === currentUser.id;
  const partnerName = isCurrentUserTeacher ? learnerName : teacherName;
  const partnerAvatar = isCurrentUserTeacher ? learnerAvatar : teacherAvatar;
  const roleLabel = isCurrentUserTeacher ? 'Teaching' : 'Learning from';

  return (
    <DashboardCard
      className={`p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
        isLive ? 'border-emerald-500/50 bg-[#121A16]' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span
              className={`dashboard-section-label ${
                isLive ? 'text-emerald-400' : 'text-[var(--text-muted,#96919F)]'
              }`}
            >
              {isLive ? 'ACTIVE LIVE SESSION • ROOM OPEN' : 'YOUR FOCUS TODAY • SCHEDULED EXCHANGE'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono tabular-nums font-bold tracking-wider ${
              isLive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-[var(--surface-elevated,#1B1722)] text-amber-300 border-[var(--border-subtle,rgba(255,255,255,0.08))]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <LiveCountdownBadge startTimeMs={startTimeMs} isLive={isLive} />
          </div>
        </div>

        {/* Core Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[var(--accent-purple,#A66CFF)] rounded-full text-[11px] font-bold">
                {booking.category || 'Skill Barter'}
              </span>
              <span className="px-2.5 py-0.5 bg-white/[0.04] border border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[var(--text-muted,#96919F)] rounded-full text-[11px] font-medium">
                {booking.learningOption || '1-on-1 Session'}
              </span>
            </div>

            <h2 className="dashboard-content-title text-xl sm:text-2xl font-bold">
              {booking.skillName}
            </h2>

            <div className="dashboard-metadata flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-purple,#A66CFF)]" />
                <span>{gate.formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-purple,#A66CFF)]" />
                <span>{gate.formattedTime} ({booking.timeSlot})</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2.5 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--surface,#15131A)]"
                />
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--accent-purple,#A66CFF)]"
                />
              </div>
              <div className="min-w-0">
                <span className="dashboard-section-label text-[10px] text-[var(--accent-purple,#A66CFF)] block">
                  {roleLabel}
                </span>
                <p className="dashboard-content-title text-xs font-bold truncate">{partnerName}</p>
              </div>
            </div>

            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Confirmed
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle,rgba(255,255,255,0.08))]">
          <p className="dashboard-metadata text-center sm:text-left">
            {isLive
              ? '🟢 Classroom is live! Click to join video & audio room.'
              : '🕒 Live classroom unlocks 10 minutes prior to scheduled start.'}
          </p>

          <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2">
            <DashboardButton
              variant="secondary"
              size="sm"
              onClick={() => onRescheduleBooking?.(booking)}
              leftIcon={<Calendar className="w-3 h-3 text-[var(--accent-purple,#A66CFF)]" />}
            >
              Reschedule
            </DashboardButton>

            <DashboardButton
              variant="secondary"
              size="sm"
              onClick={() => onCancelBooking?.(booking)}
              leftIcon={<X className="w-3 h-3 text-rose-400" />}
            >
              Cancel
            </DashboardButton>

            {isLive ? (
              <MagneticButton
                glow={true}
                glowTone="violet"
                maxDisplacement={5}
                onClick={() => onStartLiveSession?.(booking)}
              >
                <DashboardButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Video className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Join Classroom →
                </DashboardButton>
              </MagneticButton>
            ) : (
              <DashboardButton
                variant="secondary"
                size="sm"
                onClick={() => onStartLiveSession?.(booking)}
                leftIcon={<Video className="w-3.5 h-3.5 text-[var(--accent-purple,#A66CFF)]" />}
              >
                Pre-Check Room
              </DashboardButton>
            )}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});

/* ==========================================================================
   Dashboard View Props
   ========================================================================== */
export interface DashboardViewProps {
  currentUser: UserProfile;
  bookings: Booking[];
  notifications: AppNotification[];
  progress: ProgressTrack[];
  onUpdateBookingStatus: (bookingId: string, status: Booking['status'], actionUserId: string, extra?: Partial<Booking>) => void;
  onLeaveReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  onMarkNotificationRead: (notifId: string) => void;
  onDeleteNotification: (notifId: string) => void;
  allUsers: UserProfile[];
  onStartLiveSession?: (booking: Booking) => void;
  onNavigateToExplore?: () => void;
  onNavigateToGamification?: () => void;
  onNavigateToSkillPath?: () => void;
  onNavigateToChat?: (partnerId?: string) => void;
  onNavigateToStudyHub?: () => void;
  onNavigateToCredits?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onLogout?: () => void;
  onSync?: () => void;
  allReviews?: Review[];
}

const DashboardView = React.memo(function DashboardView({
  currentUser,
  bookings,
  notifications,
  progress,
  onUpdateBookingStatus,
  onLeaveReview,
  onMarkNotificationRead,
  onDeleteNotification,
  allUsers,
  onStartLiveSession,
  onNavigateToExplore,
  onNavigateToGamification,
  onNavigateToSkillPath,
  onNavigateToChat,
  onNavigateToStudyHub,
  onNavigateToCredits,
  onNavigateToProfile,
  onNavigateToTab,
  onLogout,
  onSync,
  allReviews = [],
}: DashboardViewProps) {
  // Modals state
  const [cancelBookingModal, setCancelBookingModal] = useState<Booking | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>('');
  const [cancelReasonCustom, setCancelReasonCustom] = useState<string>('');

  const [rescheduleBookingModal, setRescheduleBookingModal] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleSlot, setRescheduleSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [rescheduleNote, setRescheduleNote] = useState('');

  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Gamification Metrics
  const xpPoints = useMemo(() => calculateUserXP(currentUser), [currentUser]);
  const userLevel = useMemo(() => Math.max(1, Math.floor(xpPoints / 400) + 1), [xpPoints]);
  const xpProgressInLevel = useMemo(() => (xpPoints % 400), [xpPoints]);

  // Matches for recommended partners
  const allUserMatches = useMemo(() => computeAllUserMatches(currentUser, allUsers), [currentUser, allUsers]);
  const recommendedPartners = useMemo(() => allUserMatches.slice(0, 4), [allUserMatches]);

  // Live timer for bookings visibility (checked once every 60 seconds)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const userBookings = useMemo(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    return bookings.filter((b) => {
      const isParticipant = b.learnerId === currentUser.id || b.teacherId === currentUser.id;
      if (!isParticipant) return false;

      if (b.status === 'completed' || b.status === 'cancelled') {
        const timeStr = b.completedAt || b.cancelledAt || b.createdAt;
        if (!timeStr) return true;
        const t = new Date(timeStr).getTime();
        if (isNaN(t)) return true;
        return now - t <= TEN_MINUTES_MS;
      }
      return true;
    });
  }, [bookings, currentUser.id, now]);

  // Find next upcoming session
  const nextUpcomingSession = useMemo(() => {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const ONE_HOUR_MS = 60 * 60 * 1000;

    const userUpcoming = userBookings.filter((b) => {
      if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;

      const startTimeIso = computeStartTime(b.date, b.timeSlot, b.scheduledTime);
      const startTimeMs = new Date(startTimeIso).getTime();
      if (isNaN(startTimeMs)) return false;

      const diffMs = startTimeMs - now;
      return diffMs <= TWENTY_FOUR_HOURS_MS && diffMs >= -ONE_HOUR_MS;
    });

    userUpcoming.sort((a, b) => {
      const tA = new Date(computeStartTime(a.date, a.timeSlot, a.scheduledTime)).getTime();
      const tB = new Date(computeStartTime(b.date, b.timeSlot, b.scheduledTime)).getTime();
      return tA - tB;
    });

    return userUpcoming[0] || null;
  }, [userBookings, now]);

  // Cancellation handler
  const handleCancelSubmit = () => {
    if (!cancelBookingModal) return;
    const reasonCombined = [cancelReasonPreset, cancelReasonCustom].filter(Boolean).join(' - ') || 'No reason specified';

    const startTimeIso = computeStartTime(
      cancelBookingModal.date,
      cancelBookingModal.timeSlot,
      cancelBookingModal.scheduledTime
    );
    const startTimeMs = new Date(startTimeIso).getTime();
    const diffMs = startTimeMs - Date.now();
    const isLateCancellation = diffMs <= 30 * 60 * 1000;

    onUpdateBookingStatus(cancelBookingModal.id, 'cancelled', currentUser.id, {
      cancellationReason: reasonCombined,
      isLateCancellation,
    });

    setCancelBookingModal(null);
    setCancelReasonPreset('');
    setCancelReasonCustom('');
  };

  // Reschedule handler
  const handleRescheduleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rescheduleBookingModal || !rescheduleDate) return;

    let scheduledTime: string | undefined = undefined;
    if (rescheduleDate && rescheduleTime) {
      const d = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      if (!isNaN(d.getTime())) scheduledTime = d.toISOString();
    }

    onUpdateBookingStatus(rescheduleBookingModal.id, 'rescheduled', currentUser.id, {
      date: rescheduleDate,
      timeSlot: rescheduleSlot,
      scheduledTime,
      notes: rescheduleNote || undefined,
    });

    setRescheduleBookingModal(null);
    setRescheduleDate('');
    setRescheduleTime('14:00');
    setRescheduleNote('');
  };

  // Review handler
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    onLeaveReview({
      bookingId: reviewBooking.id,
      teacherId: reviewBooking.teacherId,
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      skillName: reviewBooking.skillName,
      rating: reviewRating,
      teachingQuality: reviewRating,
      communication: reviewRating,
      helpfulness: reviewRating,
      punctuality: reviewRating,
      comment: reviewComment,
    });

    setReviewBooking(null);
    setReviewComment('');
    setReviewRating(5);
  };

  const navItems = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: true,
      onClick: () => {},
    },
    {
      id: 'explore',
      label: 'Explore Skills',
      icon: Compass,
      active: false,
      onClick: onNavigateToExplore,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageSquare,
      active: false,
      onClick: () => onNavigateToChat ? onNavigateToChat() : onNavigateToTab?.('chat'),
    },
    {
      id: 'study-hub',
      label: 'Study Hub',
      icon: BookOpen,
      active: false,
      onClick: () => onNavigateToStudyHub ? onNavigateToStudyHub() : onNavigateToTab?.('study-hub'),
    },
    {
      id: 'skill-path',
      label: 'AI Skill Path',
      icon: Sparkles,
      active: false,
      onClick: onNavigateToSkillPath,
    },
    {
      id: 'gamification',
      label: 'Quests & Rewards',
      icon: Trophy,
      active: false,
      onClick: onNavigateToGamification,
    },
    {
      id: 'credits',
      label: 'Skill Credits',
      icon: Coins,
      active: false,
      onClick: () => onNavigateToCredits ? onNavigateToCredits() : onNavigateToTab?.('credits'),
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      active: false,
      onClick: () => onNavigateToProfile ? onNavigateToProfile() : onNavigateToTab?.('profile'),
    },
  ], [onNavigateToExplore, onNavigateToChat, onNavigateToTab, onNavigateToStudyHub, onNavigateToSkillPath, onNavigateToGamification, onNavigateToCredits, onNavigateToProfile]);

  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      id="dashboard-view-root"
      className="dashboard-theme w-full min-h-screen text-[var(--text-primary,#F5F2FA)] relative"
    >
      {/* Restrained subtle violet ambient background glow with slow drifting movement */}
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 20, -15, 0],
                y: [0, -15, 10, 0],
                scale: [1, 1.04, 0.98, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-purple,#A66CFF)]/5 rounded-full blur-[100px] pointer-events-none -z-10"
      />
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, -18, 14, 0],
                y: [0, 18, -10, 0],
                scale: [1, 0.97, 1.03, 1],
              }
        }
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 right-10 w-80 h-80 bg-[var(--accent-purple-bright,#C04DFF)]/5 rounded-full blur-[120px] pointer-events-none -z-10"
      />

      {/* ====================================================================
          TOP NAVIGATION BAR (Compact / Dense)
          ==================================================================== */}
      <FadeUp delay={0.0} distance={10}>
        <header className="w-full mb-5 bg-[var(--surface,#15131A)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple,#A66CFF)]" />
              <span className="dashboard-section-label text-white">
                Dashboard Overview
              </span>
            </div>
            <span className="hidden sm:inline-block dashboard-metadata">
              • Peer Skill Exchange 2026
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Wallet Credits Pill */}
            <button
              onClick={() => onNavigateToCredits ? onNavigateToCredits() : onNavigateToTab?.('credits')}
              className="px-2.5 py-1 bg-[var(--surface-elevated,#1B1722)] hover:bg-[#252030] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition cursor-pointer font-mono tabular-nums"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span><AnimatedCounter value={currentUser.credits ?? 100} /> Credits</span>
            </button>

            {/* Quick Streak Pill */}
            <button
              onClick={onNavigateToGamification}
              className="px-2.5 py-1 bg-[var(--surface-elevated,#1B1722)] hover:bg-[#252030] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer font-mono tabular-nums"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span><AnimatedCounter value={currentUser.loginStreak ?? 7} />d Streak</span>
            </button>

            {/* Sync status / action */}
            {onSync && (
              <button
                onClick={onSync}
                title="Sync state with cloud"
                className="p-1.5 text-[var(--text-muted,#96919F)] hover:text-white bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.08))] rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>
      </FadeUp>

      {/* ====================================================================
          3-PART GRID LAYOUT: SIDEBAR (Left) + MAIN (Center) + INSIGHTS (Right)
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ==================================================================
            1. SIDEBAR COLUMN (Left - 2.5 / 12 on large screens)
            ================================================================== */}
        <aside className="lg:col-span-3 space-y-4">
          <FadeUp delay={0.06} distance={12}>
            <DashboardCard className="p-3 space-y-1">
              <div className="dashboard-section-label px-3 py-2">
                NAVIGATION
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                        item.active
                          ? 'bg-[var(--surface-elevated,#1B1722)] text-[var(--accent-purple,#A66CFF)] border-[var(--accent-purple,#A66CFF)]/40 shadow-xs'
                          : 'bg-transparent text-[var(--text-muted,#96919F)] hover:text-[var(--text-primary,#F5F2FA)] hover:bg-[var(--surface-elevated,#1B1722)]/50 border-transparent hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className={`w-4 h-4 ${item.active ? 'text-[var(--accent-purple,#A66CFF)]' : 'text-[var(--text-muted,#96919F)]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-purple,#A66CFF)]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </DashboardCard>
          </FadeUp>

          {/* User Profile Summary Card */}
          <FadeUp delay={0.12} distance={12}>
            <DashboardCard className="p-4 space-y-3">
              <div className="dashboard-section-label">
                VOYAGER PROFILE
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-[var(--border-subtle,rgba(255,255,255,0.08))]"
                />
                <div className="min-w-0 flex-1">
                  <p className="dashboard-content-title text-xs font-bold truncate">
                    {currentUser.name}
                  </p>
                  <p className="dashboard-metadata text-[11px] truncate">
                    Lvl {userLevel} Voyager
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle,rgba(255,255,255,0.08))] text-[11px]">
                <div className="flex items-center justify-between text-[var(--text-muted,#96919F)]">
                  <span className="dashboard-metadata">XP Level Progress</span>
                  <span className="dashboard-stat-number text-xs text-white">
                    <AnimatedCounter value={xpProgressInLevel} /> / 400
                  </span>
                </div>
                <ProgressBar value={Math.round((xpProgressInLevel / 400) * 100)} color="violet" showPercentage={false} />
              </div>

              {onNavigateToProfile && (
                <DashboardButton
                  variant="secondary"
                  size="sm"
                  onClick={onNavigateToProfile}
                  className="w-full justify-center"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Edit Profile
                </DashboardButton>
              )}
            </DashboardCard>
          </FadeUp>
        </aside>

        {/* ==================================================================
            2. MAIN CONTENT COLUMN (Center - 5.5 / 12 on large screens)
            ================================================================== */}
        <main className="lg:col-span-5 space-y-5">
          
          {/* A. GREETING CARD */}
          <FadeUp delay={0.14} distance={14}>
            <DashboardCard className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="dashboard-section-label text-[var(--accent-purple,#A66CFF)] block">
                    VOYAGER WELCOME
                  </span>
                  <h1 className="dashboard-display">
                    <RevealText
                      text={`${greetingTime}, ${currentUser.name}.`}
                      delay={0.15}
                      staggerDelay={0.035}
                    />
                  </h1>
                  <p className="dashboard-content-title text-sm sm:text-base text-[var(--text-primary,#F5F2FA)]/90 pt-0.5">
                    Exchange what you know. Learn what you don't.
                  </p>
                  <p className="dashboard-metadata leading-relaxed">
                    Trade domain expertise for hands-on skills with peer swappers worldwide. No money required.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <DashboardButton
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToExplore}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Explore skills
                </DashboardButton>
                <DashboardButton
                  variant="secondary"
                  size="sm"
                  onClick={onNavigateToSkillPath}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-purple,#A66CFF)]" />}
                >
                  View your path
                </DashboardButton>
              </div>
            </DashboardCard>
          </FadeUp>

          {/* B. FOCUS / SESSION CARD */}
          <FadeUp delay={0.2} distance={14}>
            <NextExchangeSection
              booking={nextUpcomingSession}
              currentUser={currentUser}
              allUsers={allUsers}
              onStartLiveSession={onStartLiveSession}
              onCancelBooking={(b) => setCancelBookingModal(b)}
              onRescheduleBooking={(b) => {
                setRescheduleBookingModal(b);
                setRescheduleDate(b.date || new Date().toISOString().split('T')[0]);
                setRescheduleSlot(b.timeSlot || 'Afternoon');
              }}
              onNavigateToExplore={onNavigateToExplore}
            />
          </FadeUp>

          {/* C. LEARNING PATH / ACTIVE TRACKS CARD */}
          <FadeUp delay={0.26} distance={14}>
            <DashboardCard className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--accent-purple,#A66CFF)]" />
                  <h3 className="dashboard-section-label">
                    ACTIVE LEARNING TRACKS
                  </h3>
                </div>
                <DashboardTextLink onClick={onNavigateToSkillPath}>
                  View All
                </DashboardTextLink>
              </div>

              {progress.length === 0 ? (
                <div className="py-4 text-center space-y-2">
                  <p className="dashboard-metadata">
                    No active tracks started yet. Connect with a peer partner or browse customized AI learning roadmaps.
                  </p>
                  <DashboardButton variant="secondary" size="sm" onClick={onNavigateToExplore}>
                    Start a Learning Track
                  </DashboardButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {progress.slice(0, 3).map((prog, idx) => (
                    <div
                      key={`${prog.userId}-${prog.skillName}-${idx}`}
                      className="p-3 bg-[var(--surface-elevated,#1B1722)] rounded-xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CircularProgress
                            value={prog.completionPercentage}
                            size={36}
                            strokeWidth={3.5}
                            color="#A66CFF"
                          />
                          <div className="min-w-0">
                            <h4 className="dashboard-content-title text-xs sm:text-sm font-semibold truncate">
                              {prog.skillName}
                            </h4>
                            <span className="dashboard-metadata text-[10px] block">
                              {prog.lessonsCompleted} of {prog.lessonsTotal} milestones
                            </span>
                          </div>
                        </div>
                        <span className="dashboard-stat-number text-xs text-[var(--accent-purple,#A66CFF)] shrink-0 font-bold">
                          <AnimatedCounter value={prog.completionPercentage} suffix="%" />
                        </span>
                      </div>
                      <ProgressBar value={prog.completionPercentage} color="violet" showPercentage={false} />
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted,#96919F)] pt-0.5">
                        <span className="dashboard-metadata">{prog.lessonsTotal - prog.lessonsCompleted} milestones remaining</span>
                        <DashboardTextLink onClick={onNavigateToSkillPath}>
                          Resume
                        </DashboardTextLink>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </FadeUp>

          {/* D. RECOMMENDED PARTNERS ("People worth learning from") */}
          <FadeUp delay={0.32} distance={14}>
            <DashboardCard className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent-purple,#A66CFF)]" />
                  <h3 className="dashboard-section-label">
                    PEOPLE WORTH LEARNING FROM
                  </h3>
                </div>
                <DashboardTextLink onClick={onNavigateToExplore}>
                  Explore All
                </DashboardTextLink>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedPartners.map(({ user, matchScore }) => {
                  const primarySkill = user.skillsOffered?.[0]?.name || 'Specialist';
                  const matchPct = Math.min(99, Math.max(78, Math.round((matchScore || 0.85) * 100)));
                  return (
                    <div
                      key={user.id}
                      className="p-3 bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.06))] rounded-xl flex flex-col justify-between gap-3 hover:border-[var(--accent-purple,#A66CFF)]/40 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-[var(--border-subtle,rgba(255,255,255,0.08))] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="dashboard-content-title text-xs font-bold truncate">
                              {user.name}
                            </p>
                            <span className="dashboard-stat-number text-[11px] text-[var(--accent-purple,#A66CFF)] shrink-0 font-bold">
                              <AnimatedCounter value={matchPct} suffix="%" />
                            </span>
                          </div>
                          <p className="dashboard-metadata text-[11px] truncate">{primarySkill}</p>
                          <div className="dashboard-metadata flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="font-mono text-amber-300">{user.rating?.toFixed(1) || '4.9'}</span>
                            <span className="text-[var(--text-muted,#96919F)]">({user.successfulExchanges || 5} swaps)</span>
                          </div>
                        </div>
                      </div>

                      <DashboardButton
                        variant="secondary"
                        size="sm"
                        onClick={onNavigateToExplore}
                        className="w-full justify-center text-xs py-1.5"
                      >
                        Propose Exchange
                      </DashboardButton>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </FadeUp>

        </main>

        {/* ==================================================================
            3. INSIGHTS & METRICS COLUMN (Right - 4 / 12 on large screens)
            ================================================================== */}
        <aside className="lg:col-span-4 space-y-4">
          
          {/* A. MENTOR INSIGHTS CARD */}
          <FadeUp delay={0.36} distance={14}>
            <DashboardCard className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="w-7 h-7 rounded-lg bg-[var(--surface-elevated,#1B1722)] border border-[var(--accent-purple,#A66CFF)]/30 flex items-center justify-center text-[var(--accent-purple,#A66CFF)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="dashboard-section-label">
                    AI MENTOR INSIGHTS
                  </h3>
                  <p className="dashboard-metadata text-[10px]">Real-time barter suggestions</p>
                </div>
              </div>

              <div className="bg-[var(--surface-elevated,#1B1722)] p-3 rounded-xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] space-y-1">
                <p className="dashboard-content-title text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Daily Tip
                </p>
                <p className="dashboard-metadata leading-relaxed text-[var(--text-muted,#96919F)]">
                  "Completing a peer barter in React or Product Design earns +50 XP towards your Level {userLevel + 1} badge."
                </p>
              </div>

              <DashboardButton
                variant="secondary"
                size="sm"
                onClick={onNavigateToSkillPath}
                className="w-full justify-center"
                rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Browse AI Recommendations
              </DashboardButton>
            </DashboardCard>
          </FadeUp>

          {/* B. RECENT ACTIVITY CARD */}
          <FadeUp delay={0.42} distance={14}>
            <DashboardCard className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-purple,#A66CFF)]" />
                  <h3 className="dashboard-section-label">
                    RECENT ACTIVITY
                  </h3>
                </div>
                <span className="dashboard-section-label text-[10px]">COMMUNITY SWAPS</span>
              </div>

              <div className="space-y-2.5">
                {allReviews.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-[var(--surface-elevated,#1B1722)] rounded-xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="dashboard-content-title text-xs font-semibold truncate max-w-[130px]">
                        {r.learnerName}
                      </span>
                      <div className="flex items-center text-amber-400">
                        {[...Array(r.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="dashboard-metadata truncate">
                      Session in <span className="text-[var(--accent-purple,#A66CFF)] font-medium">{r.skillName}</span>
                    </p>
                    {r.comment && (
                      <p className="dashboard-metadata text-slate-300 italic line-clamp-1">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </DashboardCard>
          </FadeUp>

          {/* C. BOTTOM-RIGHT STACK: SKILL CREDITS, XP + STREAK, LEADERBOARD */}
          <FadeUp delay={0.48} distance={14}>
            <div className="space-y-3">
              
              {/* 1. Skill Credits Card */}
              <DashboardCard className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="dashboard-section-label block">
                        SKILL CREDITS
                      </span>
                      <span className="dashboard-stat-number text-xl sm:text-2xl text-amber-300 block">
                        <AnimatedCounter value={currentUser.credits ?? 100} /> <span className="text-xs font-sans font-medium text-[var(--text-muted,#96919F)]">Credits</span>
                      </span>
                    </div>
                  </div>

                  <DashboardTextLink
                    onClick={() => onNavigateToCredits ? onNavigateToCredits() : onNavigateToTab?.('credits')}
                  >
                    Manage
                  </DashboardTextLink>
                </div>
                <p className="dashboard-metadata text-[11px] pt-1 border-t border-[var(--border-subtle,rgba(255,255,255,0.06))]">
                  1 Credit = 1 Hour Peer Barter Session (No money needed)
                </p>
              </DashboardCard>

              {/* 2. XP & Streak Side-by-Side */}
              <div className="grid grid-cols-2 gap-3">
                <DashboardCard className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[var(--accent-purple,#A66CFF)]">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="dashboard-section-label">EXPERIENCE</span>
                  </div>
                  <p className="dashboard-stat-number text-xl sm:text-2xl text-white">
                    <AnimatedCounter value={xpPoints} /> <span className="text-xs font-sans font-medium text-[var(--text-muted,#96919F)]">XP</span>
                  </p>
                  <p className="dashboard-metadata text-[10px]">Lvl {userLevel} Standing</p>
                </DashboardCard>

                <DashboardCard className="p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="dashboard-section-label text-amber-400">STREAK</span>
                  </div>
                  <p className="dashboard-stat-number text-xl sm:text-2xl text-white">
                    <AnimatedCounter value={currentUser.loginStreak ?? 7} /> <span className="text-xs font-sans font-medium text-[var(--text-muted,#96919F)]">Days</span>
                  </p>
                  <p className="dashboard-metadata text-[10px]">Best: {currentUser.longestStreak ?? 14}d</p>
                </DashboardCard>
              </div>

              {/* 3. Leaderboard Card */}
              <DashboardCard className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h4 className="dashboard-section-label text-white">
                      LEADERBOARD
                    </h4>
                  </div>
                  <span className="dashboard-stat-number text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Top 12%
                  </span>
                </div>

                <p className="dashboard-metadata leading-relaxed">
                  Participate in weekly barter quests to climb rank and unlock verified skill credentials.
                </p>

                {onNavigateToGamification && (
                  <DashboardButton
                    variant="secondary"
                    size="sm"
                    onClick={onNavigateToGamification}
                    className="w-full justify-center"
                    leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    rightIcon={<ChevronRight className="w-3 h-3" />}
                  >
                    View Full Rankings
                  </DashboardButton>
                )}
              </DashboardCard>

            </div>
          </FadeUp>

        </aside>

      </div>

      {/* ====================================================================
          MODALS: REVIEW, CANCEL, RESCHEDULE
          ==================================================================== */}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={motionTokens.spring.snappy}
              className="bg-[var(--surface,#15131A)] rounded-2xl w-full max-w-md border border-[var(--border-subtle,rgba(255,255,255,0.12))] shadow-2xl overflow-hidden p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div>
                  <h3 className="dashboard-content-title font-bold text-sm">Rate your session</h3>
                  <p className="dashboard-metadata text-xs mt-0.5">Review for {reviewBooking.teacherName}</p>
                </div>
                <button
                  onClick={() => setReviewBooking(null)}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-[var(--text-muted,#96919F)] hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitReview} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition hover:scale-110 cursor-pointer border-0 bg-transparent p-0.5"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">Written Feedback</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe how helpful the peer session was..."
                    className="w-full bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.1))] rounded-xl p-3 text-white placeholder:text-[var(--text-muted,#96919F)] focus:outline-none focus:border-[var(--accent-purple,#A66CFF)] text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <DashboardButton variant="ghost" size="sm" onClick={() => setReviewBooking(null)}>
                    Cancel
                  </DashboardButton>
                  <DashboardButton variant="primary" size="sm" type="submit">
                    Submit Review
                  </DashboardButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Booking Modal */}
      <AnimatePresence>
        {cancelBookingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={motionTokens.spring.snappy}
              className="bg-[var(--surface,#15131A)] rounded-2xl w-full max-w-md border border-[var(--border-subtle,rgba(255,255,255,0.12))] shadow-2xl overflow-hidden p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="dashboard-content-title font-bold text-white text-sm">Cancel Session</h3>
                    <p className="dashboard-metadata text-xs">Confirm cancellation</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelBookingModal(null)}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-[var(--text-muted,#96919F)] hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[var(--surface-elevated,#1B1722)] p-3 rounded-xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] space-y-1">
                  <p className="dashboard-content-title text-xs font-bold text-white">
                    Cancel exchange for {cancelBookingModal.skillName}?
                  </p>
                  <p className="dashboard-metadata text-[11px]">
                    Scheduled for {cancelBookingModal.date} ({cancelBookingModal.timeSlot})
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">Reason (Optional)</label>
                  <select
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                    className="w-full bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.1))] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[var(--accent-purple,#A66CFF)] text-xs cursor-pointer"
                  >
                    <option value="">Select reason...</option>
                    <option value="Schedule conflict">Schedule conflict</option>
                    <option value="Found another time">Found another time</option>
                    <option value="No longer needed">No longer needed</option>
                    <option value="Other">Other</option>
                  </select>

                  <textarea
                    rows={2}
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    placeholder="Additional note for peer..."
                    className="w-full bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.1))] rounded-xl p-2.5 text-white placeholder:text-[var(--text-muted,#96919F)] focus:outline-none focus:border-[var(--accent-purple,#A66CFF)] text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <DashboardButton variant="ghost" size="sm" onClick={() => setCancelBookingModal(null)}>
                    Keep Session
                  </DashboardButton>
                  <DashboardButton variant="danger" size="sm" onClick={handleCancelSubmit}>
                    Confirm Cancel
                  </DashboardButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Booking Modal */}
      <AnimatePresence>
        {rescheduleBookingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={motionTokens.spring.snappy}
              className="bg-[var(--surface,#15131A)] rounded-2xl w-full max-w-md border border-[var(--border-subtle,rgba(255,255,255,0.12))] shadow-2xl overflow-hidden p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle,rgba(255,255,255,0.08))]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-elevated,#1B1722)] text-[var(--accent-purple,#A66CFF)] border border-[var(--accent-purple,#A66CFF)]/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="dashboard-content-title font-bold text-white text-sm">Propose New Time</h3>
                    <p className="dashboard-metadata text-xs">Reschedule session</p>
                  </div>
                </div>
                <button
                  onClick={() => setRescheduleBookingModal(null)}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-[var(--text-muted,#96919F)] hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">New Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.1))] rounded-xl p-2.5 text-white focus:outline-none focus:border-[var(--accent-purple,#A66CFF)] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">Time Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Morning', 'Afternoon', 'Evening'] as const).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleSlot(slot)}
                        className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          rescheduleSlot === slot
                            ? 'bg-[var(--accent-purple,#A66CFF)] text-[#0B0A0F] font-bold border-[var(--accent-purple-bright,#C04DFF)] shadow-xs -translate-y-0.5'
                            : 'bg-[var(--surface-elevated,#1B1722)] text-[var(--text-muted,#96919F)] border-[var(--border-subtle,rgba(255,255,255,0.08))] hover:bg-[#252030] hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[var(--text-primary,#F5F2FA)]">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-[var(--surface-elevated,#1B1722)] border border-[var(--border-subtle,rgba(255,255,255,0.1))] rounded-xl p-2.5 text-white focus:outline-none focus:border-[var(--accent-purple,#A66CFF)] text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <DashboardButton variant="ghost" size="sm" onClick={() => setRescheduleBookingModal(null)}>
                    Cancel
                  </DashboardButton>
                  <DashboardButton variant="primary" size="sm" type="submit">
                    Send Proposed Time
                  </DashboardButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default DashboardView;
