import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, Star, Calendar, Clock, Award, Video, 
  ArrowRight, Sparkles, AlertTriangle, Send, UserCheck, RefreshCw, X
} from 'lucide-react';
import { Booking, UserProfile, LiveSession, Review, Skill, LearningOption } from '../types';

interface SessionCompleteSummaryProps {
  booking: Booking;
  liveSession?: LiveSession;
  currentUser: UserProfile;
  otherUser: UserProfile;
  allUsers: UserProfile[];
  allReviews: Review[];
  durationSeconds: number;
  onLeaveReview: (reviewData: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  onBookAnotherSession?: (teacher: UserProfile, skill: Skill, option: LearningOption, date: string, slot: 'Morning' | 'Afternoon' | 'Evening', notes: string) => void;
  onClose: () => void;
}

export function SessionCompleteSummary({
  booking,
  liveSession,
  currentUser,
  otherUser,
  allUsers,
  allReviews,
  durationSeconds,
  onLeaveReview,
  onBookAnotherSession,
  onClose
}: SessionCompleteSummaryProps) {
  const isLearner = currentUser.id === booking.learnerId;
  const teacherName = booking.teacherName;
  const teacherUser = allUsers.find(u => u.id === booking.teacherId) || otherUser;
  
  // Generic reviewee determination
  const revieweeId = isLearner ? booking.teacherId : booking.learnerId;
  const revieweeName = isLearner ? booking.teacherName : booking.learnerName;

  // Check if current user has already submitted a review for this booking
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const reviewFound = allReviews.some(
      r => r.bookingId === booking.id && (
        r.reviewerId === currentUser.id ||
        (!r.reviewerId && isLearner && r.learnerId === currentUser.id) ||
        (!r.reviewerId && !isLearner && r.teacherId === currentUser.id && r.learnerId === booking.learnerId)
      )
    );
    setHasReviewed(reviewFound);
  }, [allReviews, booking.id, currentUser.id, isLearner, booking.learnerId, booking.teacherId]);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Rebook Modal state
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [rebookDate, setRebookDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [rebookSlot, setRebookSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [rebookOption, setRebookOption] = useState<LearningOption>('Live 1-on-1 Session');
  const [rebookNotes, setRebookNotes] = useState('Follow-up session request.');
  const [rebookSubmitted, setRebookSubmitted] = useState(false);

  // Format session duration
  const formatDuration = (secs: number) => {
    if (secs <= 0) return 'Less than 1 min';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    const parts: string[] = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (remainingSecs > 0 || parts.length === 0) parts.push(`${remainingSecs}s`);

    return parts.join(' ');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await onLeaveReview({
        bookingId: booking.id,
        teacherId: booking.teacherId,
        learnerId: booking.learnerId,
        learnerName: booking.learnerName,
        reviewerId: currentUser.id,
        revieweeId,
        reviewerRole: isLearner ? 'learner' : 'teacher',
        revieweeName,
        skillName: booking.skillName,
        rating: starRating,
        teachingQuality: starRating,
        communication: starRating,
        helpfulness: starRating,
        punctuality: starRating,
        comment: reviewComment.trim()
      });
      setHasReviewed(true);
      setShowReviewForm(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRebookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onBookAnotherSession && teacherUser) {
      const targetSkill: Skill = {
        name: booking.skillName,
        category: booking.category || 'Peer Classroom',
        level: 'Intermediate'
      };
      onBookAnotherSession(
        teacherUser,
        targetSkill,
        rebookOption,
        rebookDate,
        rebookSlot,
        rebookNotes
      );
      setRebookSubmitted(true);
      setTimeout(() => {
        setShowRebookModal(false);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full text-white p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Session Complete
          </h2>
          <p className="text-xs text-slate-300">
            Your live 1-on-1 session for <span className="font-bold text-indigo-300">{booking.skillName}</span> has concluded.
          </p>
        </div>

        {/* Duration & Details Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3 relative z-10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Session Duration</span>
            </div>
            <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
              {formatDuration(durationSeconds)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <img
                src={teacherUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={teacherName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-indigo-400 font-bold uppercase block">Instructor</span>
                <p className="font-bold text-white truncate">{teacherName}</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <img
                src={currentUser.id === booking.learnerId ? currentUser.avatar : (otherUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')}
                alt={booking.learnerName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-500"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Student</span>
                <p className="font-bold text-white truncate">{booking.learnerName}</p>
              </div>
            </div>
          </div>

          {/* No-show callout if flag is active */}
          {booking.isNoShow && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200 mt-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">No-Show Recorded</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                  The join window closed before both participants joined the room. This session is recorded as a no-show for attendance tracking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Review Form / Status Section (Available for both Learner and Teacher) */}
        <div className="space-y-3 relative z-10">
          {hasReviewed ? (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold">Review Submitted!</span>
              </div>
              <span className="text-emerald-400 font-medium">Thank you for rating {revieweeName}</span>
            </div>
          ) : showReviewForm ? (
            <form onSubmit={handleReviewSubmit} className="bg-slate-800/90 border border-indigo-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white">Leave a Review for {revieweeName}</h4>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1.5 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={`Write a brief review about your experience with ${revieweeName}...`}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />

              <button
                type="submit"
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowReviewForm(true)}
              className="w-full py-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Leave a Review for {revieweeName}</span>
            </button>
          )}
        </div>

        {/* Rebook Shortcut & Actions */}
        <div className="space-y-2.5 relative z-10 pt-2">
          {/* Rebook Shortcut Button (for Learner) */}
          {isLearner && (
            <button
              type="button"
              onClick={() => setShowRebookModal(true)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Book Another Session with {teacherName}</span>
            </button>
          )}

          {/* Return to Dashboard */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-2xl transition cursor-pointer text-center"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Rebook Modal Sub-Dialog */}
        <AnimatePresence>
          {showRebookModal && (
            <div className="fixed inset-0 z-[160] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl relative"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">Book Another Session</h3>
                  </div>
                  <button
                    onClick={() => setShowRebookModal(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {rebookSubmitted ? (
                  <div className="text-center py-6 space-y-2 text-emerald-400">
                    <CheckCircle className="w-10 h-10 mx-auto" />
                    <p className="font-bold text-sm">Session Rebooked!</p>
                    <p className="text-xs text-slate-300">Your new request was sent to {teacherName}.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRebookSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Instructor
                      </label>
                      <input
                        type="text"
                        disabled
                        value={teacherName}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-300 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Skill
                      </label>
                      <input
                        type="text"
                        disabled
                        value={booking.skillName}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-300 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={rebookDate}
                          onChange={(e) => setRebookDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Time Slot
                        </label>
                        <select
                          value={rebookSlot}
                          onChange={(e: any) => setRebookSlot(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Morning">Morning (9:00 AM)</option>
                          <option value="Afternoon">Afternoon (2:00 PM)</option>
                          <option value="Evening">Evening (7:00 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Notes for Instructor
                      </label>
                      <input
                        type="text"
                        value={rebookNotes}
                        onChange={(e) => setRebookNotes(e.target.value)}
                        placeholder="What topics would you like to focus on?"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRebookModal(false)}
                        className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Confirm Rebooking
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
