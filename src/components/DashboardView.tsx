import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Star,
  Check,
  X,
  BookOpen,
  Trophy,
  Video,
  Sparkles,
  Compass,
  Users,
  Flame,
  Zap,
  GraduationCap,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Play,
  Bot,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Coins,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review } from '../types';
import { calculateUserXP } from '../lib/gamification';
import { getSessionGateStatus, computeStartTime } from '../lib/liveSessions';
import { computeAllUserMatches } from '../lib/matchUtils';
import {
  Button,
  Card,
  SurfaceCard,
  EditorialCard,
  Badge,
  Avatar,
  ProgressBar,
  EmptyState,
  AmbientOrb,
  RevealText,
  FadeUp,
  MagneticButton,
  PinnedHorizontalScroll,
  Spotlight,
  AnimatedCounter,
  HoverCard,
} from './ui';
import { supabase, mapSupabaseToBooking } from '../lib/supabase';
import { motionTokens } from './motion/tokens';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'recently';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'recently';
  const diffSecs = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const mins = Math.floor(diffSecs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ==========================================================================
   Next Exchange Hero Component
   ========================================================================== */
export function NextExchangeSection({
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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!booking) {
    return (
      <SurfaceCard className="p-6 sm:p-8 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400/60" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Next Scheduled Exchange
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              No live classroom scheduled for today
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your calendar is clear. Connect with a mentor or peer swapper to schedule your next 1-on-1 exchange session.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToExplore}
            leftIcon={<Compass className="w-4 h-4" />}
          >
            Find Exchange Partner
          </Button>
        </div>
      </SurfaceCard>
    );
  }

  const gate = getSessionGateStatus(booking);
  const startTimeIso = computeStartTime(booking.date, booking.timeSlot, booking.scheduledTime);
  const startTimeMs = new Date(startTimeIso).getTime();
  const diffMs = startTimeMs - now;
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

  // Live countdown formatting
  let countdownDisplay = '';
  if (isLive) {
    countdownDisplay = 'LIVE NOW • ROOM OPEN';
  } else if (diffMs > 0) {
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    countdownDisplay = `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  } else {
    countdownDisplay = 'SESSION IN PROGRESS';
  }

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-500 overflow-hidden border ${
        isLive
          ? 'bg-gradient-to-br from-[#131E1E] via-[#0E151A] to-[#090A0F] border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]'
          : 'bg-[#12131A] border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* Dynamic atmospheric radiance */}
      {isLive ? (
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      ) : (
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="relative z-10 space-y-6">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isLive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isLive ? 'text-emerald-300' : 'text-slate-300'
              }`}
            >
              {isLive ? 'Classroom Ready • Active Live Session' : 'Next Scheduled Exchange'}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wider ${
              isLive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-[#181924] text-amber-300 border-white/[0.08]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{countdownDisplay}</span>
          </div>
        </div>

        {/* Core Session Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Skill Title & Meta */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-violet-950/70 border border-violet-500/30 text-violet-300 rounded-full text-[11px] font-bold">
                {booking.category || 'Skill Barter'}
              </span>
              <span className="px-3 py-1 bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded-full text-[11px] font-semibold">
                {booking.learningOption || '1-on-1 Session'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              {booking.skillName}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>{gate.formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>{gate.formattedTime} ({booking.timeSlot})</span>
              </div>
            </div>
          </div>

          {/* Overlapping Avatar & Partner Display */}
          <div className="lg:col-span-5 bg-[#181924]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex -space-x-3 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#12131A]"
                />
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-500"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                  {roleLabel}
                </span>
                <p className="text-sm font-bold text-white truncate">{partnerName}</p>
                <p className="text-[11px] text-slate-400 truncate">Peer Swapper</p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Confirmed
              </span>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.08]">
          <p className="text-xs text-slate-400 font-medium text-center sm:text-left">
            {isLive
              ? '🟢 Classroom is live! Click below to enter camera & audio room.'
              : '🕒 Live classroom unlocks 10 minutes prior to scheduled start.'}
          </p>

          <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onRescheduleBooking?.(booking)}
              className="px-3.5 py-2 bg-[#181924] hover:bg-[#202230] text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>Propose New Time</span>
            </button>

            <button
              type="button"
              onClick={() => onCancelBooking?.(booking)}
              className="px-3.5 py-2 bg-[#181924] hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-semibold text-xs rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel</span>
            </button>

            {isLive ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => onStartLiveSession?.(booking)}
                leftIcon={<Video className="w-4 h-4 animate-pulse" />}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
              >
                Enter Live Classroom
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={() => onStartLiveSession?.(booking)}
                leftIcon={<Video className="w-4 h-4 text-violet-400" />}
              >
                Pre-Check Camera Room
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ==========================================================================
   Dashboard View Main Component
   ========================================================================== */
interface DashboardViewProps {
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
  allReviews?: Review[];
}

export default function DashboardView({
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
  allReviews = [],
}: DashboardViewProps) {
  // Modals for Cancellation, Rescheduling, and Reviews
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

  // Active secondary tab for progressive disclosure
  const [secondaryTab, setSecondaryTab] = useState<'pipeline' | 'tracks' | 'community'>('pipeline');

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

  // Matches for "People worth learning from"
  const allUserMatches = useMemo(() => computeAllUserMatches(currentUser, allUsers), [currentUser, allUsers]);
  const recommendedPartners = useMemo(() => allUserMatches.slice(0, 8), [allUserMatches]);

  // Live timer for bookings visibility
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
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

  // Find next upcoming session in next 24h
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

  // Handlers for cancel / reschedule / review
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

  return (
    <div id="dashboard-view-root" className="space-y-12 pb-16">
      
      {/* ====================================================================
          1. LARGE EDITORIAL HERO SECTION
          ==================================================================== */}
      <section className="relative rounded-[32px] bg-[#12131A] border border-white/[0.08] p-8 sm:p-12 lg:p-14 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        {/* Ambient violet glow backdrop */}
        <AmbientOrb tone="violet" size="xl" cursorReactive className="-top-24 -left-24 opacity-70" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Editorial Text */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.06] border border-white/[0.1] rounded-full text-xs font-semibold text-violet-300">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>SkillSwap 2026 • Peer Barter Academy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              <RevealText delay={0.05} staggerDelay={0.03}>
                Exchange what you know.
              </RevealText>
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-300">
                Learn what you don't.
              </span>
            </h1>

            <FadeUp delay={0.2} duration={0.45}>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
                Trade your domain expertise for hands-on skills with creators and swappers worldwide. No money required — pure collaborative learning. {greetingTime}, <span className="text-slate-200 font-semibold">{currentUser.name}</span>.
              </p>
            </FadeUp>

            {/* Primary Hero Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <MagneticButton delay={0.3} duration={0.4}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onNavigateToExplore}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore skills
                </Button>
              </MagneticButton>

              <MagneticButton delay={0.38} duration={0.4}>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onNavigateToSkillPath}
                  leftIcon={<Sparkles className="w-4 h-4 text-violet-400" />}
                >
                  View your path
                </Button>
              </MagneticButton>
            </div>
          </div>

          {/* Side Rep / Quick Glance Pill */}
          <div className="lg:col-span-4 bg-[#181924]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Standing
                </span>
                <span className="text-base font-bold text-white">
                  Lvl {userLevel} Voyager
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-300">
                  <AnimatedCounter value={currentUser.credits ?? 100} />
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Credits Wallet</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#12131A] p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-medium text-slate-400 uppercase block">Active Streak</span>
                <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {currentUser.loginStreak ?? 7} Days
                </span>
              </div>

              <div className="bg-[#12131A] p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-medium text-slate-400 uppercase block">Swaps Done</span>
                <span className="text-sm font-bold text-violet-300 flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
                  {currentUser.successfulExchanges || 0}
                </span>
              </div>
            </div>

            {onNavigateToGamification && (
              <button
                onClick={onNavigateToGamification}
                className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] text-violet-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/[0.06]"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Rewards & Leaderboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ====================================================================
          2. NEXT EXCHANGE SECTION
          ==================================================================== */}
      <section className="space-y-3">
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
      </section>

      {/* ====================================================================
          3. PEOPLE WORTH LEARNING FROM (HORIZONTAL CAROUSEL / SCROLL)
          ==================================================================== */}
      <section className="space-y-4">
        <PinnedHorizontalScroll
          scrollDistanceMultiplier={2.2}
          header={
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  People worth learning from
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                  High-affinity peer swappers tailored to your target skills
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToExplore}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                See all
              </Button>
            </div>
          }
        >
          {recommendedPartners.map(({ user, isPerfectMatch, matchScore }) => {
            const primarySkill = user.skillsOffered?.[0]?.name || 'Domain Specialist';
            const teachesList = user.skillsOffered?.map((s) => s.name).slice(0, 2).join(', ') || 'Custom Skills';
            const wantsList = user.skillsWanted?.map((s) => s.name).slice(0, 2).join(', ') || 'Design / Code';
            const matchPercentage = Math.min(99, Math.max(78, Math.round((matchScore || 0.85) * 100)));

            return (
              <div key={user.id} className="w-[320px] sm:w-[360px] shrink-0">
                <Spotlight
                  spotlightColor="rgba(139, 92, 246, 0.15)"
                  className="h-full bg-[#12131A] border border-white/[0.08] hover:border-violet-500/40 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 shadow-lg group select-none"
                >
                  <div className="space-y-4">
                    
                    {/* Header: Portrait & Affinity Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/[0.1] group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-[#12131A]" />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-1 bg-violet-950/80 text-violet-300 border border-violet-500/30 rounded-full text-[10px] font-bold tracking-wide">
                          {matchPercentage}% Match
                        </span>
                        {isPerfectMatch && (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Mutual Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Primary Skill */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{primarySkill}</p>

                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{user.rating?.toFixed(1) || '4.9'}</span>
                        <span className="text-slate-500 font-normal">
                          ({user.successfulExchanges || 8} swaps)
                        </span>
                      </div>
                    </div>

                    {/* Teaches vs Wants Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Teaches
                        </span>
                        <p className="text-slate-200 font-medium truncate">{teachesList}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                          Wants to learn
                        </span>
                        <p className="text-violet-300 font-medium truncate">{wantsList}</p>
                      </div>
                    </div>

                  </div>

                  {/* Magnetic / Action Button */}
                  <div className="pt-4 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onNavigateToExplore}
                      className="w-full justify-center group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-500 transition-all"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Propose Exchange
                    </Button>
                  </div>
                </Spotlight>
              </div>
            );
          })}
        </PinnedHorizontalScroll>
      </section>

      {/* ====================================================================
          4. PROGRESSIVE DISCLOSURE: SECONDARY SECTIONS
          ==================================================================== */}
      <section className="space-y-6 pt-4 border-t border-white/[0.08]">
        
        {/* Navigation Tabs for Secondary Insights */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-[#12131A] p-1.5 rounded-2xl border border-white/[0.08]">
            <button
              onClick={() => setSecondaryTab('pipeline')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ${
                secondaryTab === 'pipeline'
                  ? 'bg-[#181924] text-white shadow-xs border border-white/[0.1]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              Exchange Pipeline ({userBookings.length})
            </button>
            <button
              onClick={() => setSecondaryTab('tracks')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ${
                secondaryTab === 'tracks'
                  ? 'bg-[#181924] text-white shadow-xs border border-white/[0.1]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              Learning Tracks ({progress.length})
            </button>
            <button
              onClick={() => setSecondaryTab('community')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ${
                secondaryTab === 'community'
                  ? 'bg-[#181924] text-white shadow-xs border border-white/[0.1]'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              Community Activity
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Progressive Insights
          </span>
        </div>

        {/* Tab 1: Exchange Pipeline / Bookings Timeline */}
        {secondaryTab === 'pipeline' && (
          <div className="space-y-4">
            {userBookings.length === 0 ? (
              <EmptyState
                preset="bookings"
                title="Your timeline is wide open"
                description="No upcoming sessions scheduled. Connect with a skill partner to schedule your next classroom."
                actionText="Book a Session"
                onAction={onNavigateToExplore}
              />
            ) : (
              <SurfaceCard className="p-6 divide-y divide-white/[0.06]">
                {userBookings.map((booking) => {
                  const isTeacher = booking.teacherId === currentUser.id;
                  const otherPartyName = isTeacher ? booking.learnerName : booking.teacherName;

                  return (
                    <div
                      key={booking.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-violet-950/60 border border-violet-500/25 flex items-center justify-center text-violet-400 font-bold shrink-0">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm sm:text-base">
                            {booking.skillName}
                          </h4>
                          <p className="text-slate-400 text-xs mt-0.5">
                            With <span className="font-semibold text-slate-200">{otherPartyName}</span> • Option:{' '}
                            <span className="text-violet-300 font-semibold">{booking.learningOption}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {booking.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> {booking.timeSlot}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {booking.status === 'completed' ? (
                          <span className="px-3 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/25 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                          </span>
                        ) : booking.status === 'cancelled' ? (
                          <span className="px-3 py-1 bg-rose-950/60 text-rose-300 border border-rose-500/25 rounded-full text-xs font-semibold flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-400" /> Cancelled
                          </span>
                        ) : booking.status === 'pending' ? (
                          <span className="px-3 py-1 bg-amber-950/60 text-amber-300 border border-amber-500/25 rounded-full text-xs font-semibold">
                            Pending Confirmation
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-violet-950/60 text-violet-300 border border-violet-500/25 rounded-full text-xs font-semibold">
                            Confirmed
                          </span>
                        )}

                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleBookingModal(booking);
                                setRescheduleDate(booking.date || new Date().toISOString().split('T')[0]);
                                setRescheduleSlot(booking.timeSlot || 'Afternoon');
                              }}
                              className="px-3 py-1.5 bg-[#181924] hover:bg-[#202230] text-slate-300 font-semibold text-xs rounded-xl border border-white/[0.08] transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-violet-400" />
                              <span>Reschedule</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCancelBookingModal(booking)}
                              className="px-3 py-1.5 bg-[#181924] hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-semibold text-xs rounded-xl border border-white/[0.08] transition cursor-pointer flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </SurfaceCard>
            )}
          </div>
        )}

        {/* Tab 2: Learning Tracks & AI Guidance */}
        {secondaryTab === 'tracks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {progress.length === 0 ? (
                <EmptyState
                  preset="courses"
                  title="Start your first skill track"
                  description="No active skill tracks in progress. Connect with peer swappers to unlock customized learning roadmaps."
                  actionText="Explore Skill Partners"
                  onAction={onNavigateToExplore}
                />
              ) : (
                progress.map((prog, idx) => (
                  <SurfaceCard key={`${prog.userId}-${prog.skillName}-${idx}`} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-950/60 border border-violet-500/25 flex items-center justify-center text-violet-400 font-bold">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">{prog.skillName}</h4>
                          <span className="text-xs text-slate-400">
                            {prog.lessonsCompleted} of {prog.lessonsTotal} milestones completed
                          </span>
                        </div>
                      </div>
                      <Badge variant="primary">{prog.completionPercentage}% Done</Badge>
                    </div>

                    <ProgressBar value={prog.completionPercentage} color="violet" showPercentage={false} />

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> ~25 mins left
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNavigateToExplore}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Resume Module
                      </Button>
                    </div>
                  </SurfaceCard>
                ))
              )}
            </div>

            <div className="lg:col-span-5 bg-[#12131A] border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-2xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">AI Mentor Insight</h3>
                  <p className="text-[11px] text-violet-300">Personalized peer recommendations</p>
                </div>
              </div>

              <div className="bg-[#181924] p-4 rounded-2xl border border-white/[0.06] text-xs space-y-1.5">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Daily Tip
                </p>
                <p className="text-slate-300 leading-relaxed">
                  "Completing a peer session in React or Design unlocks +50 XP towards your Level {userLevel + 1} milestone."
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToExplore}
                className="w-full justify-center"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Browse AI Matches
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Community Highlights */}
        {secondaryTab === 'community' && (
          <SurfaceCard className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Live Swapper Highlights
              </h3>
              <span className="text-xs text-slate-400">Global Peer Barter Community</span>
            </div>

            <div className="space-y-3">
              {allReviews.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-[#181924] rounded-2xl border border-white/[0.04]">
                  <Avatar name={r.learnerName} size="sm" />
                  <div className="flex-1 text-xs">
                    <p className="text-slate-300 font-medium">
                      <span className="font-bold text-white">{r.learnerName}</span> rated session in{' '}
                      <span className="font-semibold text-violet-300">{r.skillName}</span>
                    </p>
                    <div className="flex items-center gap-1 text-amber-400 mt-1">
                      {[...Array(r.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                      {r.comment && <span className="text-slate-400 ml-2 italic">"{r.comment}"</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}

      </section>

      {/* ====================================================================
          MODALS: REVIEW, CANCEL, RESCHEDULE
          ==================================================================== */}

      {/* Review & Ratings Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={motionTokens.spring.snappy}
              className="bg-[#12131A] rounded-3xl w-full max-w-md border border-white/[0.12] shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="font-bold text-white text-base">Rate your session</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Review for {reviewBooking.teacherName}</p>
                </div>
                <button
                  onClick={() => setReviewBooking(null)}
                  className="p-1.5 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReview} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition hover:scale-110 cursor-pointer border-0 bg-transparent"
                      >
                        <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">Written Feedback</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe how helpful the peer session was..."
                    className="w-full bg-[#181924] border border-white/[0.1] rounded-2xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setReviewBooking(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Submit Review
                  </Button>
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
              className="bg-[#12131A] rounded-3xl w-full max-w-md border border-white/[0.12] shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Cancel Session</h3>
                    <p className="text-slate-400 text-xs">Confirm cancellation</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelBookingModal(null)}
                  className="p-1.5 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-[#181924] p-4 rounded-2xl border border-white/[0.06] space-y-1">
                  <p className="font-bold text-white">
                    Cancel exchange for {cancelBookingModal.skillName}?
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Scheduled for {cancelBookingModal.date} ({cancelBookingModal.timeSlot})
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-300">Reason (Optional)</label>
                  <select
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                    className="w-full bg-[#181924] border border-white/[0.1] rounded-2xl px-3 py-2.5 text-white focus:outline-none focus:border-violet-500 text-xs font-medium cursor-pointer"
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
                    className="w-full bg-[#181924] border border-white/[0.1] rounded-2xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <Button variant="ghost" size="sm" onClick={() => setCancelBookingModal(null)}>
                    Keep Session
                  </Button>
                  <button
                    type="button"
                    onClick={handleCancelSubmit}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer border-0"
                  >
                    Confirm Cancel
                  </button>
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
              className="bg-[#12131A] rounded-3xl w-full max-w-md border border-white/[0.12] shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-violet-950/80 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Propose New Time</h3>
                    <p className="text-slate-400 text-xs">Reschedule session</p>
                  </div>
                </div>
                <button
                  onClick={() => setRescheduleBookingModal(null)}
                  className="p-1.5 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">New Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-[#181924] border border-white/[0.1] rounded-2xl p-3 text-white focus:outline-none focus:border-violet-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">Time Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Morning', 'Afternoon', 'Evening'] as const).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          rescheduleSlot === slot
                            ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                            : 'bg-[#181924] text-slate-400 border-white/[0.08] hover:bg-[#202230]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-[#181924] border border-white/[0.1] rounded-2xl p-3 text-white focus:outline-none focus:border-violet-500 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <Button variant="ghost" size="sm" onClick={() => setRescheduleBookingModal(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Send Proposed Time
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
