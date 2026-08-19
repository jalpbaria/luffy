import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Challenge, Certificate, LeaderboardEntry, Badge, Booking } from '../types';
import { 
  Trophy, Zap, Flame, Award, CheckCircle2, ShieldCheck, Star, Clock, Target, 
  Sparkles, Medal, ChevronRight, Download, Share2, Compass, Play, RefreshCw, Check
} from 'lucide-react';
import { ProgressRing } from './ui/ProgressRing';
import { Button, Card, Badge as UiBadge, Avatar, ProgressBar, MotionCard, EmptyState, AnimatedCounter } from './ui';
import { 
  calculateUserXP, calculateUserLevel, initialDailyChallenges, initialWeeklyChallenges, 
  getSampleCertificates, buildGlobalLeaderboard, ALL_BADGES_CATALOG, triggerCelebrationConfetti 
} from '../lib/gamification';
import { CertificateModal } from './CertificateModal';
import { supabase } from '../lib/supabase';

interface GamificationHubViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  bookings?: Booking[];
  onRewardClaimed: (xpAmount: number, challengeTitle: string) => void;
  onNavigateToExplore?: () => void;
}

export function GamificationHubView({
  currentUser,
  allUsers,
  bookings = [],
  onRewardClaimed,
  onNavigateToExplore
}: GamificationHubViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'leaderboard' | 'badges' | 'certificates'>('overview');
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>(initialDailyChallenges);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>(initialWeeklyChallenges);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // User XP & Level
  const userXp = currentUser.xp ?? 0;
  const userLevelInfo = useMemo(() => calculateUserLevel(userXp), [userXp]);

  // XP Transaction History
  const [xpTransactions, setXpTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchXpTransactions = async () => {
      setIsLoadingTx(true);
      try {
        const { data, error } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) {
          setXpTransactions(data);
        }
      } catch (err) {
        console.warn('Failed to fetch xp transactions:', err);
      } finally {
        setIsLoadingTx(false);
      }
    };
    fetchXpTransactions();
  }, [currentUser?.id]);

  // Certificates
  const userCertificates = useMemo(() => getSampleCertificates(currentUser, bookings), [currentUser, bookings]);

  // Leaderboard
  const leaderboardEntries = useMemo(() => buildGlobalLeaderboard(allUsers), [allUsers]);
  const currentUserRank = useMemo(() => {
    const entry = leaderboardEntries.find(e => e.user.id === currentUser.id);
    return entry ? entry.rank : 1;
  }, [leaderboardEntries, currentUser]);

  // Claim Challenge Handler
  const handleClaimChallenge = (challengeId: string, isDaily: boolean) => {
    triggerCelebrationConfetti();
    if (isDaily) {
      setDailyChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, isCompleted: true, currentProgress: c.targetProgress } : c));
      const c = dailyChallenges.find(x => x.id === challengeId);
      if (c) onRewardClaimed(c.rewardXp, c.title);
    } else {
      setWeeklyChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, isCompleted: true, currentProgress: c.targetProgress } : c));
      const c = weeklyChallenges.find(x => x.id === challengeId);
      if (c) onRewardClaimed(c.rewardXp, c.title);
    }
  };

  // Progress Goal Calculations
  const dailyCompletedCount = dailyChallenges.filter(c => c.isCompleted).length;
  const dailyPercent = Math.round((dailyCompletedCount / dailyChallenges.length) * 100);

  const weeklyCompletedCount = weeklyChallenges.filter(c => c.isCompleted).length;
  const weeklyPercent = Math.round((weeklyCompletedCount / weeklyChallenges.length) * 100);

  const monthlyPercent = 65; // Sample monthly goal

  return (
    <div id="gamification-hub-root" className="space-y-8 pb-12">
      
      {/* 🚀 Header Hero Banner: YOUR MOMENTUM */}
      <div className="relative rounded-3xl bg-surface-raised border border-white/10 text-white p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-lavender-300">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>SkillSwap Momentum</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                YOUR MOMENTUM
              </h1>
              <p className="text-text-sub text-sm max-w-xl leading-relaxed">
                Track your learning velocity, maintain exchange streaks, earn verifiable skill milestones, and climb the community leaderboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-surface-base/80 px-4 py-2 rounded-2xl border border-white/10">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-text-sub">Global Rank: <strong className="text-white font-extrabold">#{currentUserRank}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-surface-base/80 px-4 py-2 rounded-2xl border border-white/10">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xs text-text-sub">Active Streak: <strong className="text-white font-extrabold">{currentUser.loginStreak ?? 1} Days 🔥</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-surface-base/80 px-4 py-2 rounded-2xl border border-white/10">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-text-sub">Exchanges: <strong className="text-white font-extrabold">{currentUser.successfulExchanges ?? 0} Completed</strong></span>
              </div>
            </div>
          </div>

          {/* XP & Level Summary Card */}
          <div className="lg:col-span-5 bg-surface-base/90 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-black text-white text-xl shadow-lg">
                  <Zap className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-lavender-300 uppercase block tracking-wider">Level {userLevelInfo.level}</span>
                  <span className="text-lg font-black text-white">{userLevelInfo.title}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white tracking-tight">
                  <AnimatedCounter value={userXp} />
                </span>
                <span className="text-[10px] text-text-dim font-bold uppercase block tracking-wider">Total XP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-text-sub">
                <span>Progress to Level {userLevelInfo.level + 1}</span>
                <span>
                  <AnimatedCounter value={userLevelInfo.currentLevelXp} /> / {userLevelInfo.nextLevelXp} XP
                </span>
              </div>
              <ProgressBar value={userLevelInfo.progressPercent} color="indigo" showPercentage={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Momentum & Goals', icon: <Target className="w-4 h-4" /> },
          { id: 'challenges', label: 'Quests & Sprints', icon: <Zap className="w-4 h-4" /> },
          { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
          { id: 'badges', label: 'Collectible Badges', icon: <Award className="w-4 h-4" /> },
          { id: 'certificates', label: 'Skill Certificates', icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20'
                : 'bg-surface-raised text-text-sub border-white/5 hover:bg-surface-interactive hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 🎯 TAB 1: OVERVIEW & GOAL RINGS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* 📊 Streak & Activity Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl flex items-center gap-4 bg-surface-raised border border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-text-dim uppercase block tracking-wider">Current Streak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{currentUser.loginStreak ?? 1}</span>
                  <span className="text-xs font-extrabold text-orange-400">Days 🔥</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl flex items-center gap-4 bg-surface-raised border border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-text-dim uppercase block tracking-wider">Longest Streak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{currentUser.longestStreak ?? currentUser.loginStreak ?? 1}</span>
                  <span className="text-xs font-extrabold text-violet-400">Days</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl flex items-center gap-4 bg-surface-raised border border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-text-dim uppercase block tracking-wider">Total XP</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{currentUser.xp ?? 0}</span>
                  <span className="text-xs font-extrabold text-emerald-400">XP</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl flex items-center gap-4 bg-surface-raised border border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-text-dim uppercase block tracking-wider">Global Rank</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">#{currentUserRank}</span>
                  <span className="text-xs font-extrabold text-sky-400">Leaderboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Progress Rings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-surface-raised border border-white/5 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={dailyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#8b5cf6"
                gradientTo="#06b6d4"
                label={`${dailyCompletedCount}/${dailyChallenges.length}`}
                sublabel="Daily Goal"
                icon={<Zap className="w-5 h-5 text-violet-400" />}
              />
              <div>
                <h3 className="font-extrabold text-white text-base">Daily Quests</h3>
                <p className="text-text-dim text-xs mt-1">Complete daily tasks to earn +200 XP daily</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-raised border border-white/5 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={weeklyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#a855f7"
                gradientTo="#ec4899"
                label={`${weeklyCompletedCount}/${weeklyChallenges.length}`}
                sublabel="Weekly Goal"
                icon={<Trophy className="w-5 h-5 text-fuchsia-400" />}
              />
              <div>
                <h3 className="font-extrabold text-white text-base">Weekly Sprint</h3>
                <p className="text-text-dim text-xs mt-1">Complete weekly goals for bonus badges</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-raised border border-white/5 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={monthlyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#f59e0b"
                gradientTo="#ef4444"
                label={`${monthlyPercent}%`}
                sublabel="Monthly Goal"
                icon={<Flame className="w-5 h-5 text-amber-400" />}
              />
              <div>
                <h3 className="font-extrabold text-white text-base">Monthly Mastery</h3>
                <p className="text-text-dim text-xs mt-1">Maintain learning streak all month</p>
              </div>
            </div>

          </div>

          {/* Quick Challenges Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400 fill-violet-400" />
                Active Daily Challenges
              </h2>
              <button onClick={() => setActiveTab('challenges')} className="text-xs font-bold text-lavender-300 hover:text-white transition cursor-pointer">
                View All Quests →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dailyChallenges.map((challenge) => (
                <div key={challenge.id} className="p-5 rounded-2xl bg-surface-raised border border-white/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{challenge.icon}</span>
                      <span className="px-2 py-0.5 bg-violet-600/20 border border-violet-500/30 text-lavender-200 font-bold rounded-full text-[10px]">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm">{challenge.title}</h3>
                    <p className="text-text-dim text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px] font-bold text-text-sub">
                      <span>Progress</span>
                      <span>{challenge.currentProgress} / {challenge.targetProgress}</span>
                    </div>
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'indigo'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-500/10 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reward Claimed!
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, true)}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Complete & Claim +{challenge.rewardXp} XP
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ⚡ XP Transaction History */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                Recent XP Activity History
              </h2>
              <span className="text-xs text-text-dim font-medium">Last 20 transactions</span>
            </div>

            <div className="p-6 rounded-2xl bg-surface-raised border border-white/5">
              {isLoadingTx ? (
                <div className="py-8 text-center text-text-dim text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                  Loading XP history...
                </div>
              ) : xpTransactions.length === 0 ? (
                <EmptyState
                  icon={<Zap className="w-8 h-8 text-violet-400" />}
                  title="No XP Transactions Yet"
                  description="Complete daily logins, skill bookings, and quests to earn XP points!"
                />
              ) : (
                <div className="divide-y divide-white/5">
                  {xpTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 text-lavender-200 flex items-center justify-center font-bold text-sm shrink-0">
                          ⚡
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.reason || 'XP Reward'}</p>
                          <span className="text-[11px] text-text-dim">
                            {new Date(tx.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          +{tx.amount} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      )}

      {/* ⚡ TAB 2: DAILY & WEEKLY CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" />
              Daily Quests (Resets at midnight)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyChallenges.map((challenge) => (
                <div key={challenge.id} className="p-5 rounded-2xl bg-surface-raised border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{challenge.icon}</span>
                      <span className="px-2.5 py-1 bg-violet-600/20 text-lavender-200 font-bold rounded-full text-xs border border-violet-500/30">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base">{challenge.title}</h3>
                    <p className="text-text-dim text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'indigo'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-500/10 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, true)}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        Claim Reward (+{challenge.rewardXp} XP)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-fuchsia-400" />
              Weekly Sprint Challenges
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyChallenges.map((challenge) => (
                <div key={challenge.id} className="p-5 rounded-2xl bg-surface-raised border border-white/5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{challenge.icon}</span>
                      <span className="px-2.5 py-1 bg-fuchsia-600/20 text-fuchsia-200 font-bold rounded-full text-xs border border-fuchsia-500/30">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base">{challenge.title}</h3>
                    <p className="text-text-dim text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'indigo'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-500/10 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, false)}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        Claim Weekly Reward (+{challenge.rewardXp} XP)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 🏆 TAB 3: LEADERBOARD RANKINGS */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Global SkillSwap Leaderboard
              </h2>
              <p className="text-text-dim text-xs">Top swappers ranked by total XP, exchanges, and learning streaks</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> Live Weekly
            </span>
          </div>

          <div className="rounded-2xl bg-surface-raised border border-white/5 overflow-hidden divide-y divide-white/5">
            {leaderboardEntries.map((entry) => {
              const isCurrentUser = entry.user.id === currentUser.id;
              let medalIcon = null;

              if (entry.rank === 1) medalIcon = <span className="text-2xl">🥇</span>;
              else if (entry.rank === 2) medalIcon = <span className="text-2xl">🥈</span>;
              else if (entry.rank === 3) medalIcon = <span className="text-2xl">🥉</span>;

              return (
                <div 
                  key={entry.user.id} 
                  className={`p-4 flex items-center justify-between gap-4 transition ${
                    isCurrentUser ? 'bg-violet-600/15 border-l-4 border-violet-500' : 'hover:bg-surface-interactive'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-extrabold text-text-dim text-sm">
                      {medalIcon || `#${entry.rank}`}
                    </div>

                    <img 
                      src={entry.user.avatar} 
                      alt={entry.user.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{entry.user.name}</h4>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-violet-600 text-white font-bold rounded-full text-[9px]">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-text-dim text-xs mt-0.5">
                        {entry.swaps} successful exchanges • {entry.badgesCount} badges earned
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-orange-400 flex items-center gap-1 justify-end">
                        <Flame className="w-3.5 h-3.5 fill-orange-400" /> {entry.streak} Days
                      </span>
                      <span className="text-[10px] text-text-dim block uppercase font-bold">Streak</span>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="text-base font-black text-white block">{entry.xp} XP</span>
                      <span className="text-[10px] text-text-dim block uppercase font-bold">Points</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🏅 TAB 4: ACHIEVEMENTS & BADGES */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-400" />
              Collectible Achievements & Badges
            </h2>
            <p className="text-text-dim text-xs">Unlock exclusive peer badges by teaching, swapping, and learning</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_BADGES_CATALOG.map((badge) => {
              const isEarned = currentUser.badges?.some(b => b.name === badge.name) || badge.id === 'b-first-swap' || badge.id === 'b-streak-flame';

              return (
                <div 
                  key={badge.id} 
                  className={`p-5 rounded-2xl bg-surface-raised border space-y-3 transition-all duration-300 ${
                    isEarned 
                      ? 'border-violet-500/30 shadow-lg shadow-violet-600/5 hover:border-violet-500/50' 
                      : 'border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md ${
                      isEarned ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white' : 'bg-surface-base text-text-muted'
                    }`}>
                      {badge.icon}
                    </div>

                    {isEarned ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Collectible Unlocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white/5 text-text-dim border border-white/10 rounded-full text-[10px] font-bold">
                        Locked
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base">{badge.name}</h3>
                    <p className="text-text-dim text-xs leading-relaxed mt-1">{badge.description}</p>
                  </div>

                  {isEarned && (
                    <span className="text-[10px] text-lavender-300/70 font-semibold block pt-2 border-t border-white/5">
                      Earned on {badge.dateEarned}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📜 TAB 5: SKILL CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Verified Skill Certificates
              </h2>
              <p className="text-text-dim text-xs">Official certificates issued upon completing peer exchange milestones</p>
            </div>
          </div>

          {userCertificates.length === 0 ? (
            <EmptyState
              preset="certificates"
              title="Unlock Your First Skill Certificate"
              description="Complete skill barter sessions and achieve milestone reviews to earn official verified certificates!"
              actionText="Find Swappers"
              onAction={() => onNavigateToExplore?.()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userCertificates.map((cert) => (
                <div key={cert.id} className="p-6 rounded-2xl bg-surface-raised border border-white/10 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lavender-200">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{cert.title}</h3>
                        <p className="text-lavender-300 font-medium text-xs">{cert.skillName}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-dim pt-3 border-t border-white/5">
                    <span>Issued: <strong className="text-text-sub">{cert.issueDate}</strong></span>
                    <span className="font-mono text-[11px] text-lavender-300">{cert.certificateCode}</span>
                  </div>

                  <button
                    onClick={() => {
                      triggerCelebrationConfetti();
                      setSelectedCert(cert);
                    }}
                    className="w-full py-2.5 bg-surface-interactive hover:bg-white/15 border border-white/10 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                    <span>View & Print Official Certificate</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />

    </div>
  );
}
