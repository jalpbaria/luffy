import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Calendar, Clock, Star, MessageSquare, CheckCircle, AlertCircle, Trash2, 
  RefreshCw, Check, X, ShieldAlert, BookOpen, ThumbsUp, Trophy, ChevronRight, UserMinus, Plus
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review } from '../types';

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
  allUsers
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'progress' | 'notifications'>('sessions');
  const [showRescheduleId, setShowRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  
  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTeaching, setReviewTeaching] = useState(5);
  const [reviewComm, setReviewComm] = useState(5);
  const [reviewHelp, setReviewHelp] = useState(5);
  const [reviewPunct, setReviewPunct] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Notifications filtering
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);

  // Bookings where user is Learner or Teacher
  const asLearnerBookings = bookings.filter(b => b.learnerId === currentUser.id);
  const asTeacherBookings = bookings.filter(b => b.teacherId === currentUser.id);

  const handleRescheduleSubmit = (bookingId: string) => {
    if (!rescheduleDate) return;
    onUpdateBookingStatus(bookingId, 'rescheduled', currentUser.id, {
      date: rescheduleDate,
      timeSlot: rescheduleSlot
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
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200">
            ✨ ExchangeYourSkill Member
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight">Welcome back, {currentUser.name}!</h1>
          <p className="text-slate-300 text-xs">
            Manage your skill exchanges, check your upcoming appointments, track learning progress, and connect with other members of the community to swap skills.
          </p>
        </div>

        {/* Dynamic Credit Counter & Badges */}
        <div className="flex flex-row md:flex-col gap-3 flex-shrink-0 relative z-10">
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-2xl shadow-sm">
              ✨
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Spark Credits</p>
              <p className="text-2xl font-bold">{currentUser.credits} <span className="text-xs text-indigo-300 font-normal">points</span></p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between gap-8 text-xs">
            <span className="text-slate-300">Successful Swaps:</span>
            <span className="font-bold text-emerald-400 text-sm">{currentUser.successfulExchanges}</span>
          </div>
        </div>

        {/* Ambient absolute graphics to prevent tech larping visual noise */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Skills & Badges */}
        <div className="space-y-6 lg:col-span-1">
          {/* Skills Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              Skill Directory
            </h3>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">I am Teaching</span>
                <div className="space-y-1.5 mt-1.5">
                  {(currentUser?.skillsOffered ?? []).map((sk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <span className="font-semibold text-slate-800">{sk.name}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium text-[10px]">{sk.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">I want to Learn</span>
                <div className="space-y-1.5 mt-1.5">
                  {(currentUser?.skillsWanted ?? []).map((sk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <span className="font-semibold text-slate-800">{sk.name}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-850 rounded font-medium text-[10px]">{sk.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Trophy className="w-4 h-4 text-slate-500" />
              Achievements & Badges
            </h3>

            {(!currentUser?.badges || currentUser.badges.length === 0) ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No badges earned yet. Complete exchanges to earn your first badge!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {currentUser.badges.map((badge) => (
                  <div key={badge.id} className="p-2.5 border border-slate-100 bg-slate-50 rounded-xl flex flex-col items-center text-center space-y-1">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                      🏅
                    </div>
                    <span className="font-semibold text-slate-800 text-[10px] leading-tight truncate w-full">{badge.name}</span>
                    <span className="text-[9px] text-slate-400 leading-normal line-clamp-2">{badge.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right columns: Tabbed Content (Sessions, Progress, Notifications) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-3.5 px-4 border-b-2 font-medium transition ${
                  activeTab === 'sessions' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Booking Calendar ({asLearnerBookings.length + asTeacherBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-3.5 px-4 border-b-2 font-medium transition ${
                  activeTab === 'progress' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Progress Tracking ({progress.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-3.5 px-4 border-b-2 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'notifications' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
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
            <div className="p-5 flex-1 min-h-[400px]">
              
              {/* Tabs Content 1: Sessions */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  {/* Bookings as Learner (Studying) */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">My Classes (As Learner)</h4>
                    {asLearnerBookings.length === 0 ? (
                      <p className="text-slate-400 text-xs py-4 px-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">You haven't requested any classes yet. Browse other swappers to book a session.</p>
                    ) : (
                      <div className="space-y-3">
                        {asLearnerBookings.map((b) => (
                          <div key={b.id} className="border border-slate-150 p-4 rounded-xl space-y-3 bg-white hover:border-slate-300 transition shadow-xs text-xs">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="font-semibold text-slate-800 text-sm">Swap: {b.skillName}</h5>
                                <p className="text-slate-500 mt-0.5">Teacher: <span className="font-medium text-slate-700">{b.teacherName}</span> • Option: <span className="text-indigo-600 font-semibold">{b.learningOption}</span></p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                b.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                b.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                b.status === 'rescheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-slate-50 text-slate-500'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{b.date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{b.timeSlot}</span>
                              {b.notes && <span className="text-slate-400 truncate max-w-xs">💬 Notes: "{b.notes}"</span>}
                            </div>

                            {/* Booking Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                              {b.status !== 'cancelled' && b.status !== 'completed' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setShowRescheduleId(b.id);
                                      setRescheduleDate(b.date);
                                    }}
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 font-medium transition"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'cancelled', currentUser.id)}
                                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-md font-medium transition"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              
                              {b.status === 'completed' && (
                                <button
                                  onClick={() => setReviewBooking(b)}
                                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-semibold transition flex items-center gap-1"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  Leave Review
                                </button>
                              )}
                            </div>

                            {/* Reschedule inline-panel */}
                            {showRescheduleId === b.id && (
                              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                                <p className="font-semibold text-slate-700">Choose New Date & Time</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input 
                                    type="date" 
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="border border-slate-200 rounded p-2 focus:outline-none"
                                  />
                                  <div className="grid grid-cols-3 gap-1">
                                    {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setRescheduleSlot(slot)}
                                        className={`py-1.5 border rounded text-[10px] font-bold ${
                                          rescheduleSlot === slot 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-white text-slate-700'
                                        }`}
                                      >
                                        {slot}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-1.5 text-[10px]">
                                  <button 
                                    onClick={() => setShowRescheduleId(null)}
                                    className="px-2.5 py-1.5 border border-slate-200 rounded font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleRescheduleSubmit(b.id)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded font-bold"
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
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">My Classes (As Teacher)</h4>
                    {asTeacherBookings.length === 0 ? (
                      <p className="text-slate-400 text-xs py-4 px-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">No swappers have booked classes with you yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {asTeacherBookings.map((b) => (
                          <div key={b.id} className="border border-slate-150 p-4 rounded-xl space-y-3 bg-white hover:border-slate-300 transition shadow-xs text-xs">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h5 className="font-semibold text-slate-800 text-sm">Teach: {b.skillName}</h5>
                                <p className="text-slate-500 mt-0.5">Learner: <span className="font-medium text-slate-700">{b.learnerName}</span> • Option: <span className="text-indigo-600 font-semibold">{b.learningOption}</span></p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                b.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                b.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                b.status === 'rescheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-slate-50 text-slate-500'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{b.date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{b.timeSlot}</span>
                              {b.notes && <span className="text-slate-400 truncate max-w-xs">💬 Goal: "{b.notes}"</span>}
                            </div>

                            {/* Booking Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'confirmed', currentUser.id)}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Accept Session
                                  </button>
                                  <button
                                    onClick={() => onUpdateBookingStatus(b.id, 'cancelled', currentUser.id)}
                                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-md font-medium transition"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(b.id, 'completed', currentUser.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold transition flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Complete Swap (+1 Credit)
                                </button>
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
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Learning Paths Overview</h4>
                    <span className="text-xs text-indigo-600 font-semibold">Earn badges upon reaching 100%</span>
                  </div>

                  {progress.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      You haven't completed any sessions yet. Once you complete a session, your progress tracking details will appear here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {progress.map((prog, idx) => (
                        <div key={idx} className="border border-slate-150 p-4 bg-white rounded-xl space-y-3 shadow-xs text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-sm truncate">{prog.skillName}</span>
                            <span className="font-bold text-indigo-600">{prog.completionPercentage}%</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${prog.completionPercentage}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Lessons: {prog.lessonsCompleted} / {prog.lessonsTotal}</span>
                            <span className="text-slate-400">Last: {new Date(prog.lastActive).toLocaleDateString()}</span>
                          </div>

                          {/* Badges in path */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Milestones:</span>
                            <div className="flex gap-1">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${prog.lessonsCompleted >= 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}`}>
                                First Step
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${prog.completionPercentage === 100 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
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
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Inbox</h4>
                    {userNotifications.length > 0 && (
                      <button 
                        onClick={() => userNotifications.forEach(n => !n.read && onMarkNotificationRead(n.id))}
                        className="text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {userNotifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No notifications or reminders at this time.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userNotifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-3.5 border rounded-xl flex items-start justify-between gap-4 transition ${
                            notif.read ? 'bg-white border-slate-150 opacity-80' : 'bg-indigo-50/40 border-indigo-100 ring-1 ring-indigo-500/5'
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
                              <p className={`font-semibold text-slate-800 ${!notif.read ? 'text-indigo-900' : ''}`}>{notif.title}</p>
                              <p className="text-slate-500 leading-normal">{notif.message}</p>
                              <p className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {!notif.read && (
                              <button
                                onClick={() => onMarkNotificationRead(notif.id)}
                                className="p-1 rounded hover:bg-indigo-100 text-indigo-600 transition"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteNotification(notif.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md border border-slate-150 shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Rate your experience</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Teaching review for {reviewBooking.teacherName}</p>
                </div>
                <button 
                  onClick={() => setReviewBooking(null)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReview} className="p-5 space-y-4 text-xs text-slate-700">
                {/* 1. Overall Star Rating */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-600">⭐ General Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition hover:scale-110 focus:outline-none"
                      >
                        <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific metrics requested by user */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  <p className="font-semibold text-slate-800 text-xs">Excellence Metrics (1-5)</p>
                  
                  {/* Metric: Teaching Quality */}
                  <div className="flex items-center justify-between gap-4">
                    <span>📚 Teaching Quality</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewTeaching(val)}
                          className={`w-6 h-6 rounded text-[10px] font-bold ${reviewTeaching === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
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
                          className={`w-6 h-6 rounded text-[10px] font-bold ${reviewComm === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
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
                          className={`w-6 h-6 rounded text-[10px] font-bold ${reviewHelp === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
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
                          className={`w-6 h-6 rounded text-[10px] font-bold ${reviewPunct === val ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">Review Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the session went, what you learned, and how they helped you..."
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full border border-slate-250 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
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
