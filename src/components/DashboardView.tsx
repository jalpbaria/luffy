import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Calendar, Clock, Star, MessageSquare, CheckCircle, AlertCircle, Trash2, 
  RefreshCw, Check, X, ShieldAlert, BookOpen, ThumbsUp, Trophy, ChevronRight, UserMinus, Plus, Video, Sparkles
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review } from '../types';
import { getSessionGateStatus } from '../lib/liveSessions';
import { computeAllUserMatches } from '../lib/matchUtils';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

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
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer text-xs"
        >
          <Video className="w-4 h-4 animate-pulse" /> Join Live Classroom
        </button>
        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Classroom Open Now
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
          className="px-3.5 py-1.5 bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 rounded-xl font-medium transition flex items-center gap-1.5 cursor-not-allowed text-xs"
        >
          <Video className="w-3.5 h-3.5" /> Join Live Classroom
        </button>
        <div className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" /> Starts at {gate.formattedTime} • {countdownStr}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled
        title="This session's scheduled time has passed."
        className="px-3.5 py-1.5 bg-zinc-800/50 text-zinc-600 border border-zinc-800 rounded-xl font-medium transition flex items-center gap-1.5 cursor-not-allowed text-xs"
      >
        <Video className="w-3.5 h-3.5" /> Session Window Expired
      </button>
      <span className="text-[10px] text-zinc-500 font-medium">
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
  allReviews = []
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'progress' | 'notifications'>('sessions');
  const [showRescheduleId, setShowRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleSlot, setRescheduleSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');

  // Compute Perfect Skill Barter Matches for Home Dashboard
  const allUserMatches = useMemo(() => computeAllUserMatches(currentUser, allUsers), [currentUser, allUsers]);
  const perfectMatches = useMemo(() => allUserMatches.filter(m => m.isPerfectMatch), [allUserMatches]);
  
  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTeaching, setReviewTeaching] = useState(5);
  const [reviewComm, setReviewComm] = useState(5);
  const [reviewHelp, setReviewHelp] = useState(5);
  const [reviewPunct, setReviewPunct] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Live timer for auto-disappearing completed/cancelled bookings
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isBookingVisibleInCalendar = (b: Booking) => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    if (b.status === 'completed') {
      const timeStr = b.completedAt || b.createdAt;
      if (!timeStr) return true;
      const t = new Date(timeStr).getTime();
      if (isNaN(t)) return true;
      return (now - t) <= TEN_MINUTES_MS;
    }

    if (b.status === 'cancelled') {
      const timeStr = b.cancelledAt || b.createdAt;
      if (!timeStr) return true;
      const t = new Date(timeStr).getTime();
      if (isNaN(t)) return true;
      return (now - t) <= TEN_MINUTES_MS;
    }

    return true;
  };

  // Notifications filtering
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);

  // Bookings where user is Learner or Teacher
  const asLearnerBookings = bookings.filter(b => b.learnerId === currentUser.id && isBookingVisibleInCalendar(b));
  const asTeacherBookings = bookings.filter(b => b.teacherId === currentUser.id && isBookingVisibleInCalendar(b));

  const handleRescheduleSubmit = (bookingId: string) => {
    if (!rescheduleDate) return;
    let scheduledTime: string | undefined = undefined;
    if (rescheduleDate && rescheduleTime) {
      const d = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      if (!isNaN(d.getTime())) scheduledTime = d.toISOString();
    }
    onUpdateBookingStatus(bookingId, 'rescheduled', currentUser.id, {
      date: rescheduleDate,
      timeSlot: rescheduleSlot,
      scheduledTime
    });
    setShowRescheduleId(null);
    setRescheduleDate('');
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
      teachingQuality: reviewTeaching,
      communication: reviewComm,
      helpfulness: reviewHelp,
      punctuality: reviewPunct,
      comment: reviewComment
    });

    // Mark booking as fully archived or just clear modal
    setReviewBooking(null);
    setReviewComment('');
    setReviewRating(5);
    setReviewTeaching(5);
    setReviewComm(5);
    setReviewHelp(5);
    setReviewPunct(5);
  };

  return (
    <div id="dashboard-view-root" className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-[28px] bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 p-6 sm:p-8 border border-zinc-800/80 relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-300">
            ✨ SkillSwap Elite Member
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back, {currentUser.name}!</h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Manage your skill barter exchanges, inspect upcoming appointments, track learning milestones, and connect with fellow community members.
          </p>
        </div>

        {/* Dynamic Credit Counter & Badges */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 relative z-10">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/25">
              ✨
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Spark Credits</p>
              <p className="text-2xl font-black text-white">{currentUser.credits} <span className="text-xs text-indigo-400 font-normal">pts</span></p>
            </div>
          </div>
          
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-8 text-xs">
            <span className="text-zinc-400">Successful Swaps:</span>
            <span className="font-extrabold text-emerald-400 text-sm">{currentUser.successfulExchanges}</span>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Perfect Skill Barter Matches Featured Banner */}
      {perfectMatches.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-zinc-900 text-white rounded-[24px] p-5 sm:p-6 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                {perfectMatches.length} Perfect Barter Match{perfectMatches.length > 1 ? 'es' : ''} Available
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Mutual Skill Fit Discovered!</h3>
            <p className="text-zinc-300 text-xs">
              We found members who teach skills on your wishlist and want to learn what you teach.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {perfectMatches.slice(0, 3).map(m => (
              <img
                key={m.user.id}
                src={m.user.avatar}
                alt={m.user.name}
                title={`${m.user.name}: Perfect Fit!`}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 ring-4 ring-emerald-500/20"
              />
            ))}
            <button
              onClick={() => onNavigateToExplore?.()}
              className="ml-2 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              Explore Matches <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Skills & Badges */}
        <div className="space-y-6 lg:col-span-1">
          {/* Skills Card */}
          <div className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 shadow-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Skill Directory
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">I am Teaching</span>
                <div className="space-y-2 mt-2">
                  {(currentUser?.skillsOffered ?? []).map((sk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="font-semibold text-white truncate">{sk.name}</span>
                        <VerifiedSkillBadge teacherId={currentUser.id} skillName={sk.name} allReviews={allReviews} />
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 rounded-md border border-indigo-500/20 font-semibold text-[10px] shrink-0">{sk.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">I want to Learn</span>
                <div className="space-y-2 mt-2">
                  {(currentUser?.skillsWanted ?? []).map((sk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <span className="font-semibold text-zinc-200">{sk.name}</span>
                      <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-md border border-amber-500/20 font-semibold text-[10px]">{sk.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          <div className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 shadow-xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Trophy className="w-4 h-4 text-amber-400" />
              Achievements & Badges
            </h3>

            {(!currentUser?.badges || currentUser.badges.length === 0) ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No badges earned yet. Complete exchanges to earn your first badge!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {currentUser.badges.map((badge) => (
                  <div key={badge.id} className="p-3 border border-zinc-800/80 bg-zinc-950/60 rounded-xl flex flex-col items-center text-center space-y-1 hover:border-amber-500/30 transition">
                    <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                      🏅
                    </div>
                    <span className="font-bold text-white text-[11px] leading-tight truncate w-full">{badge.name}</span>
                    <span className="text-[9px] text-zinc-400 leading-normal line-clamp-2">{badge.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right columns: Tabbed Content (Sessions, Progress, Notifications) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-full">
            
            {/* Tabs Header */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/80 px-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-4 px-4 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'sessions' 
                    ? 'border-indigo-500 text-indigo-400 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Booking Calendar ({asLearnerBookings.length + asTeacherBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-4 px-4 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'progress' 
                    ? 'border-indigo-500 text-indigo-400 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Progress Tracking ({progress.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-4 border-b-2 font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'notifications' 
                    ? 'border-indigo-500 text-indigo-400 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Notifications
                {userNotifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                    {userNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>

            {/* Tabs Body */}
            <div className="p-6 flex-1 min-h-[400px]">
              
              {/* Tabs Content 1: Sessions */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  {/* Bookings as Learner (Studying) */}
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">My Classes (As Learner)</h4>
                    {asLearnerBookings.length === 0 ? (
                      <p className="text-zinc-500 text-xs py-5 px-4 bg-zinc-950/60 rounded-xl border border-dashed border-zinc-800">You haven't requested any classes yet. Browse other swappers to book a session.</p>
                    ) : (
                      <div className="space-y-3">
                        {asLearnerBookings.map((b) => (
                          <div key={b.id} className="border border-zinc-800 p-4 rounded-2xl space-y-3 bg-zinc-950/60 hover:border-zinc-700 transition shadow-lg text-xs">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="font-bold text-white text-sm">Swap: {b.skillName}</h5>
                                <p className="text-zinc-400 mt-1">Teacher: <span className="font-semibold text-zinc-200">{b.teacherName}</span> • Option: <span className="text-indigo-400 font-semibold">{b.learningOption}</span></p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                                b.status === 'pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                                b.status === 'completed' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                                b.status === 'rescheduled' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" />{b.date}</span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                {b.scheduledTime 
                                  ? new Date(b.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                  : b.timeSlot}
                              </span>
                              {b.notes && <span className="text-zinc-400 truncate max-w-xs">💬 Notes: "{b.notes}"</span>}
                            </div>

                            {/* Booking Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                              {(b.status === 'confirmed' || b.status === 'rescheduled') && (
                                <SessionJoinGateButton booking={b} onStartLiveSession={onStartLiveSession} />
                              )}

                              {b.status !== 'cancelled' && b.status !== 'completed' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setShowRescheduleId(b.id);
                                      setRescheduleDate(b.date);
                                    }}
                                    className="px-3 py-1.5 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-300 font-medium transition cursor-pointer"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'cancelled', currentUser.id)}
                                    className="px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl font-medium transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              
                              {b.status === 'completed' && (
                                <button
                                  onClick={() => setReviewBooking(b)}
                                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  Leave Review
                                </button>
                              )}
                            </div>

                            {/* Reschedule inline-panel */}
                            {showRescheduleId === b.id && (
                              <div className="mt-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                                <p className="font-bold text-white">Choose New Date & Time</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input 
                                      type="date" 
                                      value={rescheduleDate}
                                      onChange={(e) => setRescheduleDate(e.target.value)}
                                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white focus:outline-none text-xs"
                                    />
                                    <input 
                                      type="time" 
                                      value={rescheduleTime}
                                      onChange={(e) => setRescheduleTime(e.target.value)}
                                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white focus:outline-none text-xs"
                                    />
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setRescheduleSlot(slot)}
                                        className={`py-1.5 border rounded-xl text-[10px] font-bold transition cursor-pointer ${
                                          rescheduleSlot === slot 
                                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        {slot}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 text-[10px]">
                                  <button 
                                    onClick={() => setShowRescheduleId(null)}
                                    className="px-3 py-1.5 border border-zinc-800 rounded-xl font-medium text-zinc-400 hover:text-white cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleRescheduleSubmit(b.id)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bookings as Teacher (Instructing) */}
                  <div>
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">My Classes (As Teacher)</h4>
                    {asTeacherBookings.length === 0 ? (
                      <p className="text-zinc-500 text-xs py-5 px-4 bg-zinc-950/60 rounded-xl border border-dashed border-zinc-800">No swappers have booked classes with you yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {asTeacherBookings.map((b) => (
                          <div key={b.id} className="border border-zinc-800 p-4 rounded-2xl space-y-3 bg-zinc-950/60 hover:border-zinc-700 transition shadow-lg text-xs">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="font-bold text-white text-sm">Teach: {b.skillName}</h5>
                                <p className="text-zinc-400 mt-1">Learner: <span className="font-semibold text-zinc-200">{b.learnerName}</span> • Option: <span className="text-indigo-400 font-semibold">{b.learningOption}</span></p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                                b.status === 'pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                                b.status === 'completed' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                                b.status === 'rescheduled' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-400" />{b.date}</span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                {b.scheduledTime 
                                  ? new Date(b.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                  : b.timeSlot}
                              </span>
                              {b.notes && <span className="text-zinc-400 truncate max-w-xs">💬 Goal: "{b.notes}"</span>}
                            </div>

                            {/* Booking Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'confirmed', currentUser.id)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Accept Session
                                  </button>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'cancelled', currentUser.id)}
                                    className="px-3 py-2 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl font-medium transition cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {(b.status === 'confirmed' || b.status === 'rescheduled') && (
                                <>
                                  <SessionJoinGateButton booking={b} onStartLiveSession={onStartLiveSession} />
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'completed', currentUser.id)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Complete Swap (+1 Credit)
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tabs Content 2: Progress Track */}
              {activeTab === 'progress' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Learning Paths Overview</h4>
                    <span className="text-xs text-indigo-400 font-semibold">Earn badges upon reaching 100%</span>
                  </div>

                  {progress.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs bg-zinc-950/60 rounded-xl border border-dashed border-zinc-800">
                      You haven't completed any sessions yet. Once you complete a session, your progress tracking details will appear here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {progress.map((prog, idx) => (
                        <div key={idx} className="border border-zinc-800 p-4 bg-zinc-950/60 rounded-2xl space-y-3 shadow-lg text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm truncate">{prog.skillName}</span>
                            <span className="font-bold text-indigo-400">{prog.completionPercentage}%</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${prog.completionPercentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Lessons: {prog.lessonsCompleted} / {prog.lessonsTotal}</span>
                            <span className="text-zinc-500">Last: {new Date(prog.lastActive).toLocaleDateString()}</span>
                          </div>

                          {/* Badges in path */}
                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Milestones:</span>
                            <div className="flex gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${prog.lessonsCompleted >= 1 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                                First Step
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${prog.completionPercentage === 100 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                                Graduated
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tabs Content 3: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">System Inbox</h4>
                    {userNotifications.length > 0 && (
                      <button 
                        onClick={() => userNotifications.forEach(n => !n.read && onMarkNotificationRead(n.id))}
                        className="text-xs text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {userNotifications.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      No notifications or reminders at this time.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-4 border rounded-2xl flex items-start justify-between gap-4 transition ${
                            notif.read ? 'bg-zinc-950/40 border-zinc-800/60 opacity-70' : 'bg-zinc-900 border-indigo-500/30 ring-1 ring-indigo-500/20'
                          }`}
                        >
                          <div className="flex gap-3 text-xs">
                            <div className="mt-0.5 text-base">
                              {notif.type === 'match' && '🤝'}
                              {notif.type === 'request' && '📩'}
                              {notif.type === 'upcoming' && '📅'}
                              {notif.type === 'message' && '💬'}
                              {notif.type === 'credit' && '✨'}
                              {notif.type === 'system' && '⚙️'}
                            </div>
                            <div className="space-y-0.5">
                              <p className={`font-bold ${!notif.read ? 'text-white' : 'text-zinc-300'}`}>{notif.title}</p>
                              <p className="text-zinc-400 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-zinc-500">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {!notif.read && (
                              <button
                                onClick={() => onMarkNotificationRead(notif.id)}
                                className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition cursor-pointer"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteNotification(notif.id)}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review & Ratings Modal Form */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 rounded-[28px] w-full max-w-md border border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
                <div>
                  <h3 className="font-bold text-white text-base">Rate your experience</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Teaching review for {reviewBooking.teacherName}</p>
                </div>
                <button 
                  onClick={() => setReviewBooking(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReview} className="p-6 space-y-4 text-xs text-zinc-300">
                {/* 1. Overall Star Rating */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-300">⭐ General Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific metrics */}
                <div className="space-y-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                  <p className="font-bold text-white text-xs">Excellence Metrics (1-5)</p>
                  
                  {/* Metric: Teaching Quality */}
                  <div className="flex items-center justify-between gap-4">
                    <span>📚 Teaching Quality</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewTeaching(val)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer ${reviewTeaching === val ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric: Communication */}
                  <div className="flex items-center justify-between gap-4">
                    <span>💬 Communication</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewComm(val)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer ${reviewComm === val ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric: Helpfulness */}
                  <div className="flex items-center justify-between gap-4">
                    <span>🤝 Helpfulness</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewHelp(val)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer ${reviewHelp === val ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric: Punctuality */}
                  <div className="flex items-center justify-between gap-4">
                    <span>⏱️ Punctuality</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewPunct(val)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer ${reviewPunct === val ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-300">Review Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the session went, what you learned, and how they helped you..."
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-4 py-2.5 border border-zinc-800 hover:bg-zinc-800 rounded-xl font-semibold text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Submit Review
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
