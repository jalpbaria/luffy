import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Calendar, Clock, Star, MessageSquare, CheckCircle, AlertCircle, Trash2, 
  RefreshCw, Check, X, ShieldAlert, BookOpen, ThumbsUp, Trophy, ChevronRight, UserMinus, Plus, Video, Sparkles,
  Compass, Users, Target, Flame, Zap, GraduationCap, ArrowUpRight, Lightbulb, CheckCheck, TrendingUp,
  Play, Bot, Heart, Share2, Activity, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, Coins
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review } from '../types';
import { calculateUserXP } from '../lib/gamification';
import { getSessionGateStatus, computeStartTime } from '../lib/liveSessions';
import { computeAllUserMatches } from '../lib/matchUtils';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { Button, Card, Badge, Avatar, ProgressBar, StatCard, MotionCard, EmptyState, AmbientOrb, TiltCard, RevealOnScroll } from './ui';
import { supabase, mapSupabaseToBooking } from '../lib/supabase';

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

export function NextSessionHeroCard({
  booking,
  currentUser,
  allUsers,
  onStartLiveSession,
  onCancelBooking,
  onRescheduleBooking
}: {
  booking: Booking;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onStartLiveSession?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onRescheduleBooking?: (booking: Booking) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const gate = getSessionGateStatus(booking);
  const startTimeIso = computeStartTime(booking.date, booking.timeSlot, booking.scheduledTime);
  const startTimeMs = new Date(startTimeIso).getTime();
  const diffMs = startTimeMs - now;

  // Participant 1: Teacher
  const teacherUser = allUsers.find((u) => u.id === booking.teacherId);
  const teacherAvatar = teacherUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const teacherName = booking.teacherName;

  // Participant 2: Learner
  const learnerUser = allUsers.find((u) => u.id === booking.learnerId);
  const learnerAvatar = learnerUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
  const learnerName = booking.learnerName;

  // Live countdown string
  let countdownDisplay = '';
  if (gate.status === 'joinable') {
    countdownDisplay = 'LIVE NOW • ROOM OPEN';
  } else if (diffMs > 0) {
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    countdownDisplay = `${hrs.toString().padStart(2, '0')}h : ${mins.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
  } else {
    countdownDisplay = 'SESSION STARTING NOW';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 border-2 border-indigo-500/40 shadow-2xl overflow-hidden group"
    >
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* Top bar: Badge & Live Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-indigo-800/60">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gate.status === 'joinable' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${gate.status === 'joinable' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
              Next Live Session • Starts Within 24 Hours
            </span>
          </div>

          <div className="flex items-center gap-2 bg-indigo-900/80 px-4 py-1.5 rounded-full border border-indigo-700/60 shadow-inner">
            <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
              {countdownDisplay}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Skill & Session Metadata */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 rounded-full text-[11px] font-bold">
                {booking.category || 'Peer Classroom'}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-[11px] font-bold">
                {booking.learningOption}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {booking.skillName}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{gate.formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{gate.formattedTime} ({booking.timeSlot})</span>
              </div>
            </div>
          </div>

          {/* Participants Side */}
          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
              Session Participants
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Teacher */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={teacherAvatar}
                    alt={teacherName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
                  />
                  {booking.teacherId === currentUser.id && (
                    <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] font-black px-1 rounded-full">
                      YOU
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-indigo-400 block uppercase">
                    Instructor
                  </span>
                  <p className="text-xs font-bold text-white truncate">{teacherName}</p>
                </div>
              </div>

              {/* Learner */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={learnerAvatar}
                    alt={learnerName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                  />
                  {booking.learnerId === currentUser.id && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1 rounded-full">
                      YOU
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-emerald-400 block uppercase">
                    Student
                  </span>
                  <p className="text-xs font-bold text-white truncate">{learnerName}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action CTA Bar */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-indigo-800/40">
          <p className="text-xs text-indigo-200/90 font-medium text-center sm:text-left">
            {gate.status === 'joinable' 
              ? '🟢 The classroom is live! Test your camera and audio in the green room before entering.'
              : '🕒 Join window opens 10 minutes prior to session start time.'}
          </p>

          <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onRescheduleBooking?.(booking)}
              className="px-3.5 py-2.5 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-700/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span>Propose New Time</span>
            </button>

            <button
              type="button"
              onClick={() => onCancelBooking?.(booking)}
              className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 font-bold text-xs rounded-xl border border-rose-800/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel Session</span>
            </button>

            {gate.status === 'joinable' ? (
              <button
                type="button"
                onClick={() => onStartLiveSession?.(booking)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer animate-pulse border border-emerald-400/40"
              >
                <Video className="w-4 h-4 fill-current" />
                <span>Join Live Classroom</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartLiveSession?.(booking)}
                className="px-4 py-2.5 bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl border border-indigo-600/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Pre-Check Camera Room</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export function SessionJoinGateButton({
  booking,
  onStartLiveSession
}: {
  booking: Booking;
  onStartLiveSession?: (booking: Booking) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const gate = getSessionGateStatus(booking);

  if (gate.status === 'joinable') {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => onStartLiveSession?.(booking)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer text-xs"
        >
          <Video className="w-4 h-4 animate-pulse" /> Join Live Classroom
        </button>
        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Classroom Open Now
        </span>
      </div>
    );
  }

  if (gate.status === 'too_early') {
    const totalSecs = Math.max(0, Math.floor((gate.windowStart.getTime() - now) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const remSecs = totalSecs % 60;

    let countdownStr = '';
    if (hrs > 0) {
      countdownStr = `Opens in ${hrs}h ${remMins}m`;
    } else if (mins > 0) {
      countdownStr = `Opens in ${mins}m ${remSecs}s`;
    } else {
      countdownStr = `Opens in ${remSecs}s`;
    }

    return (
      <div className="flex flex-col items-end gap-1">
        <button
          disabled
          onClick={() => alert(`This session starts at ${gate.formattedTime}. You can join 10 minutes before.`)}
          title={`This session starts at ${gate.formattedTime}. You can join 10 minutes before.`}
          className="px-3.5 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-medium transition flex items-center gap-1.5 cursor-not-allowed text-xs"
        >
          <Video className="w-3.5 h-3.5" /> Join Live Classroom
        </button>
        <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> Starts at {gate.formattedTime} • {countdownStr}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled
        title="This session's scheduled time has passed."
        className="px-3.5 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-medium transition flex items-center gap-1.5 cursor-not-allowed text-xs"
      >
        <Video className="w-3.5 h-3.5" /> Session Window Expired
      </button>
      <span className="text-[10px] text-slate-400 font-medium">
        Scheduled time has passed
      </span>
    </div>
  );
}

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
  allReviews = []
}: DashboardViewProps) {
  // Modals for Cancellation and Reschedule flows
  const [cancelBookingModal, setCancelBookingModal] = useState<Booking | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>('');
  const [cancelReasonCustom, setCancelReasonCustom] = useState<string>('');

  const [rescheduleBookingModal, setRescheduleBookingModal] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleSlot, setRescheduleSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [rescheduleNote, setRescheduleNote] = useState('');

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
      isLateCancellation
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
      notes: rescheduleNote || undefined
    });

    setRescheduleBookingModal(null);
    setRescheduleDate('');
    setRescheduleTime('14:00');
    setRescheduleNote('');
  };

  // Time Greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // XP & Gamification Metrics
  const xpPoints = useMemo(() => {
    return calculateUserXP(currentUser);
  }, [currentUser]);

  const userLevel = useMemo(() => {
    return Math.max(1, Math.floor(xpPoints / 400) + 1);
  }, [xpPoints]);

  const hoursLearned = useMemo(() => {
    return (currentUser.successfulExchanges || 0) * 2.5 + (progress.length * 1.5) + 4;
  }, [currentUser, progress]);

  // Compute Skill Matches
  const allUserMatches = useMemo(() => computeAllUserMatches(currentUser, allUsers), [currentUser, allUsers]);
  const recommendedPartners = useMemo(() => allUserMatches.slice(0, 4), [allUserMatches]);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTeaching, setReviewTeaching] = useState(5);
  const [reviewComm, setReviewComm] = useState(5);
  const [reviewHelp, setReviewHelp] = useState(5);
  const [reviewPunct, setReviewPunct] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Live timer for booking visibility
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isBookingVisible = (b: Booking) => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (b.status === 'completed' || b.status === 'cancelled') {
      const timeStr = b.completedAt || b.cancelledAt || b.createdAt;
      if (!timeStr) return true;
      const t = new Date(timeStr).getTime();
      if (isNaN(t)) return true;
      return (now - t) <= TEN_MINUTES_MS;
    }
    return true;
  };

  const userBookings = bookings.filter(b => (b.learnerId === currentUser.id || b.teacherId === currentUser.id) && isBookingVisible(b));
  const activeSwapsCount = userBookings.filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'rescheduled').length;

  // Summary Metrics including Credits Balance, Active Swaps, and Skills Offered
  const summaryCards = useMemo(() => [
    {
      title: 'Credits Balance',
      value: `${currentUser.credits ?? 0} Credits`,
      subtitle: 'Available for peer barter',
      icon: <Coins className="w-5 h-5" />,
      trend: { value: '+2 earned recently', isPositive: true },
    },
    {
      title: 'Active Swaps',
      value: `${activeSwapsCount} Sessions`,
      subtitle: 'In exchange pipeline',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Skills Offered',
      value: `${currentUser.skillsOffered?.length || 0} Skills`,
      subtitle: currentUser.skillsOffered?.map(s => s.name).slice(0, 2).join(', ') || 'Ready to teach',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      title: 'Total XP Points',
      value: `${xpPoints} XP`,
      subtitle: `Level ${userLevel} Voyager`,
      icon: <Zap className="w-5 h-5" />,
      trend: { value: '+240 XP this week', isPositive: true },
    },
    {
      title: 'Learning Streak',
      value: `${currentUser.loginStreak ?? 7} Days 🔥`,
      subtitle: 'Personal record!',
      icon: <Flame className="w-5 h-5" />,
    },
  ], [currentUser.credits, currentUser.skillsOffered, currentUser.loginStreak, activeSwapsCount, xpPoints, userLevel]);

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
      teachingQuality: reviewTeaching,
      communication: reviewComm,
      helpfulness: reviewHelp,
      punctuality: reviewPunct,
      comment: reviewComment
    });

    setReviewBooking(null);
    setReviewComment('');
    setReviewRating(5);
  };

  // Static Sample Trending Skills Universe
  const trendingSkills = [
    { name: 'React 19 & Next.js', learners: '1,420 learners', category: 'Web Dev', gradient: 'from-indigo-500 to-purple-600', icon: '⚡' },
    { name: 'AI Prompt Engineering', learners: '2,890 learners', category: 'Artificial Intelligence', gradient: 'from-cyan-500 to-blue-600', icon: '🤖' },
    { name: 'Conversational Spanish', learners: '980 learners', category: 'Languages', gradient: 'from-amber-500 to-orange-600', icon: '💬' },
    { name: 'Figma System Design', learners: '1,150 learners', category: 'UI/UX Design', gradient: 'from-emerald-500 to-teal-600', icon: '🎨' },
  ];

  // Dynamic Community Feed items from real registered database records
  const [dbBookings, setDbBookings] = useState<Booking[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchGlobalBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);
        if (!error && data && Array.isArray(data) && isMounted) {
          setDbBookings(data.map(mapSupabaseToBooking));
        }
      } catch {
        // network / offline fallback
      }
    };
    fetchGlobalBookings();
    return () => { isMounted = false; };
  }, []);

  const communityActivities = useMemo(() => {
    const items: Array<{ id: string; user: string; action: string; topic: string; time: string; avatar?: string; timestamp: number }> = [];

    // Deduplicate bookings from props and fetched DB
    const allBookingsMap = new Map<string, Booking>();
    [...bookings, ...dbBookings].forEach(b => {
      if (b && b.id) allBookingsMap.set(b.id, b);
    });

    allBookingsMap.forEach(b => {
      const learner = allUsers.find(u => u.id === b.learnerId) || allUsers.find(u => u.name === b.learnerName);
      const userName = learner?.name || b.learnerName || 'A member';
      const userAvatar = learner?.avatar;

      if (b.status === 'completed') {
        items.push({
          id: `act-b-comp-${b.id}`,
          user: userName,
          action: 'completed a session in',
          topic: b.skillName,
          time: formatRelativeTime(b.completedAt || b.createdAt),
          avatar: userAvatar,
          timestamp: new Date(b.completedAt || b.createdAt).getTime() || 0
        });
      } else if (b.status === 'confirmed' || b.status === 'pending' || b.status === 'rescheduled') {
        items.push({
          id: `act-b-book-${b.id}`,
          user: userName,
          action: 'booked a skill exchange for',
          topic: b.skillName,
          time: formatRelativeTime(b.createdAt),
          avatar: userAvatar,
          timestamp: new Date(b.createdAt).getTime() || 0
        });
      }
    });

    // Add real reviews
    allReviews.forEach(r => {
      const learner = allUsers.find(u => u.id === r.learnerId) || allUsers.find(u => u.name === r.learnerName);
      const userName = learner?.name || r.learnerName || 'A member';
      const userAvatar = learner?.avatar;

      items.push({
        id: `act-rev-${r.id}`,
        user: userName,
        action: `left a ${r.rating}★ review for`,
        topic: r.skillName,
        time: formatRelativeTime(r.createdAt),
        avatar: userAvatar,
        timestamp: new Date(r.createdAt).getTime() || 0
      });
    });

    // Add real badges earned from real profiles in allUsers
    allUsers.forEach(u => {
      if (u.badges && Array.isArray(u.badges)) {
        u.badges.forEach(badge => {
          items.push({
            id: `act-badge-${u.id}-${badge.id}`,
            user: u.name,
            action: 'earned the badge',
            topic: `${badge.name} ${badge.icon || '🏅'}`,
            time: formatRelativeTime(badge.dateEarned),
            avatar: u.avatar,
            timestamp: badge.dateEarned ? new Date(badge.dateEarned).getTime() : 0
          });
        });
      }
    });

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 10);
  }, [bookings, dbBookings, allReviews, allUsers]);

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

  return (
    <div id="dashboard-view-root" className="space-y-10 pb-12">
      
      {/* 🌟 Next Upcoming Live Session Hero Card (Within 24 Hours) */}
      {nextUpcomingSession && (
        <NextSessionHeroCard
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
        />
      )}

      {/* 🚀 Welcome Hero Section */}
      <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5 relative">
            {/* 🌟 Glowing Ambient Orb positioned behind the welcome header */}
            <AmbientOrb tone="brass" size="xl" className="-top-20 -left-20 opacity-80" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-extrabold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-300 animate-pulse" />
              <span>SkillSwap 2026 Peer Academy</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                👋 {greetingTime}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">{currentUser.name}</span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-200 leading-snug">
                Accelerate your growth through peer barter exchanges today.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                Swap your domain mastery for new skills. No cash required — purely collaborative peer learning powered by AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateToExplore?.()}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Find Skill Partner</span>
              </button>

              <button
                onClick={() => onNavigateToExplore?.()}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Teach a Skill</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-extrabold text-slate-950 text-xl shadow-lg shadow-amber-500/30">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Current Rank</span>
                  <span className="text-lg font-black text-white">Lvl {userLevel} Voyager</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-300">{xpPoints}</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase block tracking-wider">Total XP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Flame className="w-5 h-5 fill-orange-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Streak</span>
                  <span className="text-sm font-extrabold text-white">7 Days 🔥</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Today's Goal</span>
                  <span className="text-sm font-extrabold text-emerald-400">1 Swap Ready</span>
                </div>
              </div>
            </div>

            {onNavigateToGamification && (
              <button
                onClick={onNavigateToGamification}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 rounded-2xl font-bold text-xs text-amber-200 flex items-center justify-center gap-2 transition cursor-pointer group"
              >
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span>Rewards, Badges & Leaderboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📊 SECTION 1: STATISTICS & SUMMARY CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Performance & Growth Metrics
          </h2>
          <span className="text-xs text-slate-500 font-bold">Updated live</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {summaryCards.map((card, index) => (
            <RevealOnScroll key={card.title} delay={index * 0.1} className="h-full">
              <TiltCard
                glow={index % 2 === 0 ? 'brass' : 'sage'}
                className="h-full flex flex-col justify-between bg-navy text-parchment border border-brass/30 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      {card.title}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        index % 2 === 0
                          ? 'bg-brass/20 text-brass-light border-brass/40 shadow-xs'
                          : 'bg-sage/20 text-sage-light border-sage/40 shadow-xs'
                      }`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-parchment tracking-tight">
                      {card.value}
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {card.subtitle}
                    </div>
                  </div>
                </div>

                {card.trend && (
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{card.trend.value}</span>
                  </div>
                )}
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* 📚 SECTION 2 & 3: CONTINUE LEARNING & AI MENTOR PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 2: CONTINUE LEARNING (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Continue Learning
            </h2>
            <span className="text-xs font-bold text-indigo-600">{progress.length} active courses</span>
          </div>

          {progress.length === 0 ? (
            <EmptyState
              preset="courses"
              title="Start Your First Barter Learning Track"
              description="No active skill tracks in progress. Connect with peer swappers to unlock customized learning roadmaps."
              actionText="Explore Skill Partners"
              onAction={() => onNavigateToExplore?.()}
            />
          ) : (
            <div className="space-y-4">
              {progress.map((prog, idx) => (
                <MotionCard key={`${prog.userId}-${prog.skillName}-${idx}`} className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{prog.skillName}</h3>
                        <span className="text-xs text-slate-500">
                          {prog.lessonsCompleted} of {prog.lessonsTotal} modules completed
                        </span>
                      </div>
                    </div>
                    <Badge variant="primary">{prog.completionPercentage}% Done</Badge>
                  </div>

                  <ProgressBar value={prog.completionPercentage} color="indigo" showPercentage={false} />

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Est. ~25 mins left
                    </span>
                    <button
                      onClick={() => onNavigateToExplore?.()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Resume Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </MotionCard>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: AI MENTOR CARD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              AI Mentor Proactive Insights
            </h2>
            <Badge variant="secondary" icon={<Sparkles className="w-3 h-3 text-purple-600" />}>
              Active Guidance
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-[28px] p-6 border border-purple-500/30 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Personalized AI Recommendation</h3>
                <p className="text-[11px] text-purple-300">Based on your teaching profile & goals</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs space-y-1">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 fill-amber-300" />
                  Daily Tip
                </p>
                <p className="text-slate-200 leading-relaxed">
                  "You're only 20 minutes away from completing your next skill milestone in React 19. Scheduling a peer review now gives +50 bonus XP!"
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs space-y-1">
                <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Suggested Partner Match
                </p>
                <p className="text-slate-200 leading-relaxed">
                  3 peer swappers are currently looking for your taught skill <span className="font-extrabold text-white">"{currentUser.skillsOffered?.[0]?.name || 'TypeScript'}"</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToExplore?.()}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View AI Suggested Partners</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 🤝 SECTION 4: RECOMMENDED SKILL PARTNERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Recommended Skill Partners
            </h2>
            <p className="text-slate-500 text-xs">High affinity peer swappers tailored to your wanted skills</p>
          </div>
          <button
            onClick={() => onNavigateToExplore?.()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>See All Swappers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedPartners.map(({ user, isPerfectMatch }) => (
            <MotionCard key={user.id} className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Avatar src={user.avatar} name={user.name} size="lg" isOnline={true} />
                  {isPerfectMatch && (
                    <Badge variant="success" icon={<Sparkles className="w-3 h-3" />}>
                      Perfect Match
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{user.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{user.rating?.toFixed(1) || '4.9'}</span>
                    <span className="text-slate-400 font-normal">({user.successfulExchanges || 12} swaps)</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Teaches</span>
                    <p className="font-bold text-slate-800 truncate">
                      {user.skillsOffered?.map(s => s.name).join(', ') || 'Web Dev'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Wants to Learn</span>
                    <p className="font-bold text-indigo-600 truncate">
                      {user.skillsWanted?.map(s => s.name).join(', ') || 'UI Design'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToExplore?.()}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200/80 transition cursor-pointer"
              >
                Exchange Skill
              </button>
            </MotionCard>
          ))}
        </div>
      </section>

      {/* 📅 SECTION 5: UPCOMING SESSIONS & TIMELINE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Upcoming Classrooms & Timeline
          </h2>
          <span className="text-xs text-slate-500 font-bold">{userBookings.length} scheduled sessions</span>
        </div>

        <Card>
          {userBookings.length === 0 ? (
            <EmptyState
              preset="bookings"
              title="Your Timeline is Wide Open"
              description="No upcoming sessions scheduled. Discover skill partners and book 1-on-1 barter classrooms!"
              actionText="Book a Session"
              onAction={() => onNavigateToExplore?.()}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {userBookings.map((booking) => (
                <div key={booking.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{booking.skillName}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">
                        With <span className="font-bold text-slate-800">{booking.teacherName}</span> • Option: <span className="text-indigo-600 font-bold">{booking.learningOption}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {booking.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {booking.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {booking.isNoShow ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        No-Show Flagged
                      </span>
                    ) : booking.status === 'completed' ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed
                      </span>
                    ) : booking.status === 'cancelled' ? (
                      <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        Cancelled {booking.isLateCancellation ? '(Late)' : ''}
                      </span>
                    ) : null}

                    {(booking.status === 'confirmed' || booking.status === 'rescheduled') && (
                      <SessionJoinGateButton booking={booking} onStartLiveSession={onStartLiveSession} />
                    )}
                    {booking.status === 'pending' && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                        Pending Confirmation
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
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Propose New Time</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancelBookingModal(booking)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* 🌐 SECTION 6 & 7: COMMUNITY FEED & TRENDING SKILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 6: COMMUNITY ACTIVITY FEED (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Live Peer Activity Feed
            </h2>
            <span className="text-xs text-slate-500 font-bold">Global Swapper Highlights</span>
          </div>

          {communityActivities.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl shadow-inner">
                📚
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-slate-900 text-base">No community activity yet.</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Be the first member to exchange a skill and inspire others.
                </p>
              </div>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => onNavigateToExplore?.()}
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Find Skill Partner
              </Button>
            </div>
          ) : (
            <Card className="space-y-4">
              {communityActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <Avatar src={act.avatar} name={act.user} size="sm" />
                  <div className="flex-1 text-xs">
                    <p className="text-slate-800 font-medium">
                      <span className="font-extrabold text-slate-900">{act.user}</span> {act.action} <span className="font-bold text-indigo-600">{act.topic}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* SECTION 7: TRENDING SKILLS UNIVERSE (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Trending Skills Universe
            </h2>
            <button onClick={() => onNavigateToExplore?.()} className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {trendingSkills.map((sk, idx) => (
              <button
                key={idx}
                onClick={() => onNavigateToExplore?.()}
                className={`p-4 rounded-2xl bg-gradient-to-br ${sk.gradient} text-white text-left space-y-2 shadow-md transition transform hover:-translate-y-1 cursor-pointer border-0`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{sk.icon}</span>
                  <span className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {sk.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm leading-tight text-white">{sk.name}</h3>
                  <p className="text-[10px] text-white/80 mt-1">{sk.learners}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Review & Ratings Modal Form */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Rate your experience</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Teaching review for {reviewBooking.teacherName}</p>
                </div>
                <button 
                  onClick={() => setReviewBooking(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReview} className="p-6 space-y-4 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">⭐ General Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition hover:scale-110 focus:outline-none cursor-pointer border-0 bg-transparent"
                      >
                        <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">Written Feedback</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe how well the swapper taught this session..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛑 CANCEL BOOKING MODAL */}
      <AnimatePresence>
        {cancelBookingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Cancel Session</h3>
                    <p className="text-slate-500 text-xs">Confirm booking cancellation</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setCancelBookingModal(null);
                    setCancelReasonPreset('');
                    setCancelReasonCustom('');
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700">
                {/* Confirmation Question */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <p className="font-extrabold text-slate-900 text-sm">
                    Are you sure you want to cancel this session with{' '}
                    <span className="text-indigo-600 font-black">
                      {currentUser.id === cancelBookingModal.learnerId ? cancelBookingModal.teacherName : cancelBookingModal.learnerName}
                    </span>?
                  </p>
                  <p className="text-slate-500 text-xs">
                    Skill: <strong>{cancelBookingModal.skillName}</strong> • Scheduled: <strong>{cancelBookingModal.date} ({cancelBookingModal.timeSlot})</strong>
                  </p>
                </div>

                {/* Late Cancellation Check & Warning */}
                {(() => {
                  const startTimeIso = computeStartTime(cancelBookingModal.date, cancelBookingModal.timeSlot, cancelBookingModal.scheduledTime);
                  const startTimeMs = new Date(startTimeIso).getTime();
                  const diffMs = startTimeMs - Date.now();
                  const isLate = diffMs <= 30 * 60 * 1000;

                  if (isLate) {
                    return (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <p className="font-bold">Late Cancellation Notice (&lt;30 Mins)</p>
                          <p className="text-amber-800 leading-snug">
                            This session is scheduled to start in less than 30 minutes. Cancelling now is flagged as a late cancellation.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-900">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-bold">Standard Cancellation Policy</p>
                        <p className="text-emerald-800 leading-snug">
                          You can cancel standard bookings anytime prior to 30 minutes before the session starts.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-900">Reason for Cancellation (Optional)</label>
                  <select
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs font-medium cursor-pointer"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Change of plans">Change of plans</option>
                    <option value="Found another time">Found another time</option>
                    <option value="No longer needed">No longer needed</option>
                    <option value="Other">Other</option>
                  </select>

                  <textarea
                    rows={2}
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    placeholder="Additional details or note for peer (optional)..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelBookingModal(null);
                      setCancelReasonPreset('');
                      setCancelReasonCustom('');
                    }}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
                  >
                    Keep Session
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSubmit}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer text-xs transition transform active:scale-95"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📅 PROPOSE NEW TIME MODAL */}
      <AnimatePresence>
        {rescheduleBookingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Propose New Time</h3>
                    <p className="text-slate-500 text-xs">
                      Reschedule session with {currentUser.id === rescheduleBookingModal.learnerId ? rescheduleBookingModal.teacherName : rescheduleBookingModal.learnerName}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setRescheduleBookingModal(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <p className="font-bold text-slate-800 text-xs">
                    Current Schedule: <span className="text-indigo-600 font-extrabold">{rescheduleBookingModal.date} ({rescheduleBookingModal.timeSlot})</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">New Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">Time Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Morning', 'Afternoon', 'Evening'] as const).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          rescheduleSlot === slot
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">Exact Start Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-900">Note for Peer (Optional)</label>
                  <textarea
                    rows={2}
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                    placeholder="Explain why you are proposing a new time..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRescheduleBookingModal(null)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
                  >
                    Keep Original Time
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer text-xs transition transform active:scale-95"
                  >
                    Send Proposed Time
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
