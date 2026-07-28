import React, { useState, useEffect } from 'react';
import { 
  User, Star, MapPin, Clock, Award, ShieldCheck, Share2, Check, 
  ArrowLeft, MessageSquare, Calendar, Sparkles, BookOpen, ExternalLink, Globe, LogIn
} from 'lucide-react';
import { UserProfile, Review, Skill } from '../types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { supabase, mapSupabaseToProfile, mapSupabaseToReview } from '../lib/supabase';
import { fallbackUsers } from '../data/fallbackUsers';
import { fallbackReviews } from '../data/fallbackReviews';

interface PublicProfileViewProps {
  userId: string;
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  allReviews: Review[];
  onBookSession?: (teacher: UserProfile, skill: Skill) => void;
  onOpenChat?: (userId: string) => void;
  onClose?: () => void;
  onRequireLogin?: () => void;
}

export function PublicProfileView({
  userId,
  currentUser,
  allUsers,
  allReviews,
  onBookSession,
  onOpenChat,
  onClose,
  onRequireLogin
}: PublicProfileViewProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load user profile and reviews
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingProfile(true);

      // 1. Try finding in allUsers first
      let foundUser = allUsers.find(u => u.id === userId);

      // 2. If not found in props, query Supabase directly (unauthenticated read)
      if (!foundUser) {
        try {
          const { data: dbUser, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && dbUser) {
            foundUser = mapSupabaseToProfile(dbUser);
          }
        } catch {
          // Fallback check
          foundUser = fallbackUsers.find(u => u.id === userId);
        }
      }

      if (!foundUser) {
        // Fallback user if non-existent
        foundUser = fallbackUsers.find(u => u.id === userId) || null;
      }

      if (isMounted) {
        setUserProfile(foundUser);
      }

      // Load reviews for this user
      let reviews = allReviews.filter(r => r.teacherId === userId);

      if (reviews.length === 0) {
        try {
          const { data: dbRevs, error: revErr } = await supabase
            .from('reviews')
            .select('*')
            .eq('teacher_id', userId);

          if (!revErr && dbRevs && Array.isArray(dbRevs)) {
            reviews = dbRevs.map(mapSupabaseToReview);
          }
        } catch {
          reviews = fallbackReviews.filter(r => r.teacherId === userId);
        }
      }

      if (isMounted) {
        setUserReviews(
          reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        setIsLoadingProfile(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, allUsers, allReviews]);

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/profile/${userId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">Loading public profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
          <p className="text-xs text-slate-500">The user profile you are looking for does not exist or may have been removed.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Return to App
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                XS
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base">ExchangeYourSkill</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs border ${
                copiedLink 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Share Profile</span>
                </>
              )}
            </button>

            {!currentUser && onRequireLogin && (
              <button
                onClick={onRequireLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 relative">
            <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-200" />
              Public Profile Page
            </div>
          </div>

          {/* Profile Details Header */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-end gap-4">
                <img
                  src={userProfile.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`}
                  alt={userProfile.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-md bg-slate-100"
                />
                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{userProfile.name}</h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Member
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">{userProfile.title || 'Skill Swap Educator & Learner'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                {currentUser ? (
                  <>
                    {currentUser.id !== userProfile.id && onOpenChat && (
                      <button
                        onClick={() => onOpenChat(userProfile.id)}
                        className="px-3.5 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <span>Message</span>
                      </button>
                    )}
                    {currentUser.id !== userProfile.id && onBookSession && userProfile.skillsOffered && userProfile.skillsOffered.length > 0 && (
                      <button
                        onClick={() => onBookSession(userProfile, userProfile.skillsOffered[0])}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book 1-on-1 Session</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={onRequireLogin}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Exchange Skills</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>{userProfile.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-slate-400 font-normal">({userProfile.reviewsCount || userReviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>{userProfile.totalSwaps ?? 5} Swaps Completed</span>
              </div>
              {userProfile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{userProfile.location}</span>
                </div>
              )}
              {userProfile.timezone && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{userProfile.timezone}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            {userProfile.badges && userProfile.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                {userProfile.badges.map((badge, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio / About */}
        {userProfile.bio && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">About Me</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{userProfile.bio}</p>
          </div>
        )}

        {/* Skills Grid: Offered vs Wanted */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Skills Offered (TEACHES) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Teaches ({userProfile.skillsOffered?.length || 0})
              </h3>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Offered Skills
              </span>
            </div>

            <div className="space-y-3">
              {(userProfile.skillsOffered ?? []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No teaching skills listed.</p>
              ) : (
                userProfile.skillsOffered.map((sk, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{sk.name}</span>
                        <VerifiedSkillBadge teacherId={userProfile.id} skillName={sk.name} allReviews={allReviews} />
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-semibold text-[10px]">
                        {sk.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Category: {sk.category}</span>
                      {currentUser && currentUser.id !== userProfile.id && onBookSession && (
                        <button
                          onClick={() => onBookSession(userProfile, sk)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                        >
                          Book this <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills Wanted (WANTS TO LEARN) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Wants to Learn ({userProfile.skillsWanted?.length || 0})
              </h3>
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Learning Goals
              </span>
            </div>

            <div className="space-y-3">
              {(userProfile.skillsWanted ?? []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No learning goals listed.</p>
              ) : (
                userProfile.skillsWanted.map((sk, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm">{sk.name}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-semibold text-[10px]">
                        {sk.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Category: {sk.category}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              Student Reviews ({userReviews.length})
            </h3>
            <span className="text-xs font-bold text-slate-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1">
              ★ {userProfile.rating?.toFixed(1) || '5.0'} Rating
            </span>
          </div>

          {userReviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              No individual student reviews posted yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {userReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{rev.learnerName}</span>
                      {rev.skillName && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-semibold text-[10px]">
                          {rev.skillName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 italic leading-relaxed">{rev.comment || 'No written feedback provided.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guest Join Prompt Banner if not logged in */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white text-center space-y-3 shadow-md">
            <h3 className="text-lg font-bold">Want to learn from {userProfile.name} or swap skills?</h3>
            <p className="text-xs text-indigo-100 max-w-xl mx-auto">
              ExchangeYourSkill is a 1-on-1 peer skill exchange platform. Connect directly with verified members to teach what you know and learn what you want!
            </p>
            {onRequireLogin && (
              <button
                onClick={onRequireLogin}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-50 transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Join ExchangeYourSkill Now
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
