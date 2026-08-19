import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, MapPin, Languages, Globe, Clock, Award, GraduationCap,
  Sparkles, MessageSquare, ArrowRight, ExternalLink, Calendar, Check,
  BookOpen, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, User
} from 'lucide-react';
import { UserProfile, Skill, LearningOption, Review } from '../types';
import { calculateMatch } from '../lib/matchUtils';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { Spotlight } from './motion/Spotlight';
import { MagneticButton } from './motion/MagneticButton';
import { getSkillGuide } from '../data/skillGuides';

export interface ProfileDetailModalProps {
  user: UserProfile | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string) => void;
  onBookSession: (
    teacher: UserProfile, 
    skill: Skill, 
    option: LearningOption, 
    date: string, 
    slot: 'Morning' | 'Afternoon' | 'Evening', 
    notes: string, 
    scheduledTime?: string, 
    swapRole?: 'learn' | 'teach'
  ) => void;
  onOpenStudyHub?: (skill: Skill) => void;
  allReviews?: Review[];
}

const LEARNING_OPTIONS: { value: LearningOption; icon: string; desc: string }[] = [
  { value: 'Live 1-on-1 Session', icon: '📹', desc: 'Real-time interactive session via voice or video' },
  { value: 'Group Session', icon: '👥', desc: 'Join a group with other learners sharing the skill' },
  { value: 'Chat Guidance', icon: '💬', desc: 'Text guidance, asynchronous Q&A, and quick feedback' },
  { value: 'Notes & Resources', icon: '📄', desc: 'Handouts, code snippets, templates, or reading list' },
  { value: 'Recorded Video', icon: '🎥', desc: 'Pre-recorded video explaining the key concepts' },
  { value: 'Project-Based Learning', icon: '🛠', desc: 'Build a practical, real-world project together' }
];

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  user,
  currentUser,
  isOpen,
  onClose,
  onOpenChat,
  onBookSession,
  onOpenStudyHub,
  allReviews = []
}) => {
  if (!user || !isOpen) return null;

  const [isBookingMode, setIsBookingMode] = useState(false);
  const [selectedSkillToLearn, setSelectedSkillToLearn] = useState<Skill | null>(
    (user.skillsOffered ?? [])[0] || null
  );
  const [chosenOption, setChosenOption] = useState<LearningOption>('Live 1-on-1 Session');
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingSlot, setBookingSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [swapRole, setSwapRole] = useState<'learn' | 'teach'>('learn');

  // Compute 2-way barter match
  const match = calculateMatch(currentUser, user);
  const isPerfect = match.isPerfectMatch;
  const isPartial = match.isPartialMatch;
  const matchScore = match.score;

  // Filter reviews for this teacher
  const userReviews = allReviews
    .filter(r => r.teacherId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStartBooking = () => {
    setIsBookingMode(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillToLearn) return;
    if (swapRole === 'learn' && (currentUser.credits ?? 0) < 10) return;

    let scheduledTimeStr: string | undefined = undefined;
    if (bookingDate && bookingTime) {
      const d = new Date(`${bookingDate}T${bookingTime}:00`);
      if (!isNaN(d.getTime())) {
        scheduledTimeStr = d.toISOString();
      }
    }

    onBookSession(
      user,
      selectedSkillToLearn,
      chosenOption,
      bookingDate,
      bookingSlot,
      bookingNotes,
      scheduledTimeStr,
      swapRole
    );

    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingMode(false);
      setBookingSuccess(false);
      setBookingNotes('');
      setSwapRole('learn');
      onClose();
    }, 2000);
  };

  const primarySkill = (user.skillsOffered ?? [])[0]?.name || 'General Skills';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface-base w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-surface-interactive text-text-sub hover:text-white border border-white/10 backdrop-blur-md transition cursor-pointer"
            aria-label="Close profile detail"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. IMMERSIVE HERO HEADER: Large NAME, primary skill, match %, avatar */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-b from-surface-raised via-surface-base to-surface-base border-b border-white/10 overflow-hidden">
            {/* Background Ambient Glow */}
            <div className={`absolute top-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10 ${
              isPerfect ? 'bg-emerald-500/15' : 'bg-violet-600/15'
            }`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Large Avatar with Ring */}
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 shadow-2xl bg-surface-raised ${
                    isPerfect ? 'border-emerald-400 ring-4 ring-emerald-500/20' : 'border-violet-500/40 ring-4 ring-violet-500/10'
                  }`}
                />
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-black/80 border border-white/15 text-[10px] font-bold text-amber-400 flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{user.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Identity & Match Stats */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight truncate">
                    {user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface-interactive text-text-sub border border-white/10 text-xs font-semibold">
                    {user.skillLevel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-text-sub">
                  <span className="text-violet-300 font-semibold flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-md">
                    <Award className="w-3.5 h-3.5 text-violet-400" />
                    Specialist in {primarySkill}
                  </span>

                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {user.timeZone}
                  </span>

                  <span className="flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-text-muted" />
                    {user.languages.join(', ')}
                  </span>
                </div>

                {/* Match Affinity Badge */}
                <div className="pt-1 flex items-center gap-2">
                  {isPerfect ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>100% Perfect 2-Way Match</span>
                      <span className="text-[10px] text-emerald-400/80 font-normal">({user.successfulExchanges} completed swaps)</span>
                    </div>
                  ) : isPartial ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-lavender-200 text-xs font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
                      <span>{Math.round(matchScore * 100)}% Barter Match</span>
                      <span className="text-[10px] text-text-muted">({user.successfulExchanges} swaps)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">
                      {user.successfulExchanges} successful peer exchanges
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. BODY CONTENT (Profile Details vs Booking Form) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7">
            {!isBookingMode ? (
              <>
                {/* 2-WAY BARTER FIT BREAKDOWN */}
                {(isPerfect || isPartial) && (
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    isPerfect 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-violet-500/10 border-violet-500/25'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                      {isPerfect ? <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/30" /> : <RefreshCw className="w-4 h-4 text-violet-400" />}
                      Mutual Barter Breakdown
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          They Teach (Matches Your Wishlist)
                        </span>
                        <span className="font-bold text-white text-sm">
                          {match.theyTeachUserWants.length > 0
                            ? match.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')
                            : 'Open to barter requested skills'}
                        </span>
                      </div>
                      <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                          You Teach (Matches Their Wishlist)
                        </span>
                        <span className="font-bold text-white text-sm">
                          {match.userTeachesTheyWant.length > 0
                            ? match.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')
                            : 'Open to learning your expertise'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEACHES SECTION */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-violet-400" />
                      Teaches ({user.skillsOffered?.length || 0})
                    </h3>
                    <span className="text-[11px] text-text-muted">Select a skill to barter</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(user.skillsOffered ?? []).map((sk, idx) => {
                      const isSelected = selectedSkillToLearn?.name === sk.name;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedSkillToLearn(sk)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-violet-500/15 border-violet-500 ring-1 ring-violet-500/30'
                              : 'bg-surface-raised border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm">{sk.name}</span>
                              <VerifiedSkillBadge teacherId={user.id} skillName={sk.name} allReviews={allReviews} />
                            </div>
                            <p className="text-[11px] text-text-sub">{sk.category} • {sk.level} level</p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* WANTS TO LEARN SECTION */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-lavender-300" />
                    Wants to Learn ({user.skillsWanted?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(user.skillsWanted ?? []).map((sk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-white/10 text-xs font-medium text-text-main"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-lavender-300"></span>
                        <span>{sk.name}</span>
                        <span className="text-[10px] text-text-muted">({sk.level})</span>
                      </span>
                    ))}
                  </div>
                </section>

                {/* ABOUT SECTION */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                    About & Experience
                  </h3>
                  <div className="bg-surface-raised p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4 text-xs text-text-sub leading-relaxed">
                    <p className="text-text-main text-sm">
                      {user.bio || 'No personal bio has been provided.'}
                    </p>

                    {(user.education || user.experience) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                        {user.education && (
                          <div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">🎓 Education</span>
                            <span className="text-white text-xs mt-0.5 block">{user.education}</span>
                          </div>
                        )}
                        {user.experience && (
                          <div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">💼 Experience</span>
                            <span className="text-white text-xs mt-0.5 block">{user.experience}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social links */}
                    {user.portfolio && Object.values(user.portfolio).some(Boolean) && (
                      <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
                        {user.portfolio.github && (
                          <a href={user.portfolio.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1 bg-surface-base hover:bg-surface-interactive text-text-sub hover:text-white rounded-lg text-xs border border-white/5 transition">
                            GitHub <ExternalLink className="w-3 h-3 text-text-muted" />
                          </a>
                        )}
                        {user.portfolio.linkedin && (
                          <a href={user.portfolio.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1 bg-surface-base hover:bg-surface-interactive text-text-sub hover:text-white rounded-lg text-xs border border-white/5 transition">
                            LinkedIn <ExternalLink className="w-3 h-3 text-text-muted" />
                          </a>
                        )}
                        {user.portfolio.portfolioUrl && (
                          <a href={user.portfolio.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1 bg-surface-base hover:bg-surface-interactive text-text-sub hover:text-white rounded-lg text-xs border border-white/5 transition">
                            Portfolio <ExternalLink className="w-3 h-3 text-text-muted" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* AVAILABILITY SECTION */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    Availability & Scheduling
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => {
                      const isAvailable = (user.availability ?? []).includes(slot);
                      return (
                        <div
                          key={slot}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isAvailable
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-semibold'
                              : 'bg-surface-raised border-white/5 text-text-dim opacity-50'
                          }`}
                        >
                          <span>{slot} Slots</span>
                          {isAvailable ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="text-[10px] text-text-dim">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* REVIEWS SECTION */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Student Reviews ({userReviews.length})
                    </h3>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                      ★ {user.rating.toFixed(1)} Overall
                    </span>
                  </div>

                  {userReviews.length === 0 ? (
                    <div className="p-4 bg-surface-raised border border-white/5 rounded-2xl text-center text-xs text-text-muted">
                      No reviews yet. Be the first to complete an exchange with {user.name}!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {userReviews.map((rev) => (
                        <div key={rev.id} className="p-3 bg-surface-raised border border-white/5 rounded-2xl text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{rev.learnerName}</span>
                              {rev.skillName && (
                                <span className="px-2 py-0.5 bg-violet-500/20 text-lavender-300 rounded text-[10px]">
                                  {rev.skillName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-text-sub italic">{rev.comment || 'Great exchange!'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              /* BOOKING MODE FORM */
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {bookingSuccess ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Barter Request Sent!</h3>
                    <p className="text-text-sub text-sm">{user.name} will review your session request.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-surface-raised border border-white/10 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-text-muted">Partner: </span>
                        <span className="font-semibold text-white">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Skill: </span>
                        <span className="font-semibold text-violet-400">{selectedSkillToLearn?.name}</span>
                      </div>
                    </div>

                    {/* Role Choice (Learn vs Teach) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-dim uppercase tracking-wider">
                        Session Role <span className="text-violet-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onClick={() => setSwapRole('learn')}
                          className={`p-3.5 border rounded-2xl cursor-pointer transition flex items-start gap-3 ${
                            swapRole === 'learn'
                              ? 'bg-violet-500/15 border-violet-500 ring-1 ring-violet-500/30'
                              : 'bg-surface-raised border-white/5 hover:border-white/15'
                          }`}
                        >
                          <input
                            type="radio"
                            id="modal-role-learn"
                            name="swapRole"
                            value="learn"
                            checked={swapRole === 'learn'}
                            onChange={() => setSwapRole('learn')}
                            className="mt-0.5 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="modal-role-learn" className="font-bold text-white text-xs cursor-pointer block">
                              I want to LEARN this skill
                            </label>
                            <p className="text-[10px] text-text-sub mt-0.5">
                              Learner role (costs 10 credits when completed)
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setSwapRole('teach')}
                          className={`p-3.5 border rounded-2xl cursor-pointer transition flex items-start gap-3 ${
                            swapRole === 'teach'
                              ? 'bg-violet-500/15 border-violet-500 ring-1 ring-violet-500/30'
                              : 'bg-surface-raised border-white/5 hover:border-white/15'
                          }`}
                        >
                          <input
                            type="radio"
                            id="modal-role-teach"
                            name="swapRole"
                            value="teach"
                            checked={swapRole === 'teach'}
                            onChange={() => setSwapRole('teach')}
                            className="mt-0.5 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="modal-role-teach" className="font-bold text-white text-xs cursor-pointer block">
                              I want to TEACH them
                            </label>
                            <p className="text-[10px] text-text-sub mt-0.5">
                              Teacher role (earns 10 credits when completed)
                            </p>
                          </div>
                        </div>
                      </div>

                      {swapRole === 'learn' && (currentUser.credits ?? 0) < 10 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>You need at least 10 credits to book a learning session.</span>
                        </div>
                      )}
                    </div>

                    {/* Learning Options */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-dim uppercase tracking-wider">How do you want to learn?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {LEARNING_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => setChosenOption(opt.value)}
                            className={`p-3 border rounded-2xl cursor-pointer transition flex items-start gap-3 ${
                              chosenOption === opt.value
                                ? 'bg-violet-500/15 border-violet-500 ring-1 ring-violet-500/30'
                                : 'bg-surface-raised border-white/5 hover:border-white/15'
                            }`}
                          >
                            <span className="text-2xl mt-0.5">{opt.icon}</span>
                            <div className="space-y-0.5">
                              <p className="font-bold text-white text-xs">{opt.value}</p>
                              <p className="text-[10px] text-text-sub leading-normal">{opt.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-1.5">Date & Time</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="date" 
                            required
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <input 
                            type="time" 
                            required
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-1.5">Time Slot Availability</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingSlot(slot)}
                              className={`py-2.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                                bookingSlot === slot
                                  ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                                  : user.availability?.includes(slot)
                                    ? 'bg-surface-raised border-white/10 text-text-sub hover:bg-surface-interactive'
                                    : 'bg-black/30 border-white/5 text-text-dim cursor-not-allowed line-through'
                              }`}
                              disabled={!user.availability?.includes(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Booking notes */}
                    <div>
                      <label className="block text-xs font-bold text-text-dim uppercase tracking-wider mb-1.5">What goals do you hope to focus on? (Optional)</label>
                      <textarea 
                        rows={3}
                        placeholder="Introduce your level and what specific topics or project you'd like to work on..."
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
                      />
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          {/* 3. STICKY FOOTER CTA: Clear "Start an Exchange →" */}
          <div className="p-4 sm:p-6 bg-surface-raised border-t border-white/10 flex items-center justify-between gap-4">
            {!isBookingMode ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenChat(user.id)}
                  className="px-4 py-2.5 bg-surface-base hover:bg-surface-interactive text-text-main border border-white/10 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  <span>Chat First</span>
                </button>

                <MagneticButton
                  onClick={handleStartBooking}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs shadow-xl shadow-violet-500/25 flex items-center gap-2 cursor-pointer transition"
                >
                  <span>Start an Exchange</span>
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>
              </>
            ) : (
              <div className="w-full flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingMode(false)}
                  className="px-4 py-2.5 border border-white/10 bg-surface-base hover:bg-surface-interactive rounded-xl font-semibold text-xs text-text-sub transition cursor-pointer"
                >
                  Back to Profile
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={swapRole === 'learn' && (currentUser.credits ?? 0) < 10}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm Session Request</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
