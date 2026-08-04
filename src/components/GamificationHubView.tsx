import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Challenge, Certificate, LeaderboardEntry, Badge, Booking } from '../types';
import { 
  Trophy, Zap, Flame, Award, CheckCircle2, ShieldCheck, Star, Clock, Target, 
  Sparkles, Medal, ChevronRight, Download, Share2, Compass, Play, RefreshCw, Check
} from 'lucide-react';
import { ProgressRing } from './ui/ProgressRing';
import { Button, Card, Badge as UiBadge, Avatar, ProgressBar, MotionCard, EmptyState } from './ui';
import { 
  calculateUserXP, calculateUserLevel, initialDailyChallenges, initialWeeklyChallenges, 
  getSampleCertificates, buildGlobalLeaderboard, ALL_BADGES_CATALOG, triggerCelebrationConfetti 
} from '../lib/gamification';
import { CertificateModal } from './CertificateModal';

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
  const userXp = useMemo(() => calculateUserXP(currentUser), [currentUser]);
  const userLevelInfo = useMemo(() => calculateUserLevel(userXp), [userXp]);

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
      
      {/* 🚀 Header Hero Banner */}
      <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white p-6 sm:p-10 border border-purple-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-black text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300" />
              <span>SkillSwap Gamified Learning Academy</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                Gamification & Rewards Center
              </h1>
              <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                Earn XP, level up your peer profile, maintain learning streaks, complete daily challenges, and earn official skill certificates!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-200">Global Rank: <strong className="text-amber-300 font-extrabold">#{currentUserRank}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xs text-slate-200">Active Streak: <strong className="text-white font-extrabold">7 Days 🔥</strong></span>
              </div>
            </div>
          </div>

          {/* XP & Level Summary Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-300 uppercase block tracking-wider">Level {userLevelInfo.level}</span>
                  <span className="text-lg font-black text-white">{userLevelInfo.title}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-300">{userXp}</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase block">Total XP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>XP Progress to Level {userLevelInfo.level + 1}</span>
                <span>{userLevelInfo.currentLevelXp} / {userLevelInfo.nextLevelXp} XP</span>
              </div>
              <ProgressBar value={userLevelInfo.progressPercent} color="amber" showPercentage={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Dashboard & Goals', icon: <Target className="w-4 h-4" /> },
          { id: 'challenges', label: 'Daily & Weekly Quests', icon: <Zap className="w-4 h-4" /> },
          { id: 'leaderboard', label: 'Leaderboard Rankings', icon: <Trophy className="w-4 h-4" /> },
          { id: 'badges', label: 'Achievements & Badges', icon: <Award className="w-4 h-4" /> },
          { id: 'certificates', label: 'Skill Certificates', icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          
          {/* Goal Progress Rings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card className="p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={dailyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#3b82f6"
                gradientTo="#06b6d4"
                label={`${dailyCompletedCount}/${dailyChallenges.length}`}
                sublabel="Daily Goal"
                icon={<Zap className="w-5 h-5 text-cyan-500" />}
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Daily Quests</h3>
                <p className="text-slate-500 text-xs mt-1">Complete daily tasks to earn +200 XP daily</p>
              </div>
            </Card>

            <Card className="p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={weeklyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#6366f1"
                gradientTo="#a855f7"
                label={`${weeklyCompletedCount}/${weeklyChallenges.length}`}
                sublabel="Weekly Goal"
                icon={<Trophy className="w-5 h-5 text-purple-500" />}
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Weekly Sprint</h3>
                <p className="text-slate-500 text-xs mt-1">Complete weekly goals for bonus badges</p>
              </div>
            </Card>

            <Card className="p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <ProgressRing
                progress={monthlyPercent}
                size={140}
                strokeWidth={12}
                gradientFrom="#f59e0b"
                gradientTo="#ec4899"
                label={`${monthlyPercent}%`}
                sublabel="Monthly Goal"
                icon={<Flame className="w-5 h-5 text-amber-500" />}
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Monthly Mastery</h3>
                <p className="text-slate-500 text-xs mt-1">Maintain learning streak all month</p>
              </div>
            </Card>

          </div>

          {/* Quick Challenges Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                Active Daily Challenges
              </h2>
              <button onClick={() => setActiveTab('challenges')} className="text-xs font-bold text-indigo-600 hover:underline">
                View All Quests
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dailyChallenges.map((challenge) => (
                <MotionCard key={challenge.id} className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{challenge.icon}</span>
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-full text-[10px]">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{challenge.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Progress</span>
                      <span>{challenge.currentProgress} / {challenge.targetProgress}</span>
                    </div>
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'indigo'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reward Claimed!
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, true)}
                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition hover:opacity-95 cursor-pointer"
                      >
                        Complete & Claim +{challenge.rewardXp} XP
                      </button>
                    )}
                  </div>
                </MotionCard>
              ))}
            </div>
          </section>

        </div>
      )}

      {/* ⚡ TAB 2: DAILY & WEEKLY CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Daily Quests (Resets in 11h 20m)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyChallenges.map((challenge) => (
                <MotionCard key={challenge.id} className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{challenge.icon}</span>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black rounded-full text-xs">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{challenge.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'amber'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, true)}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:opacity-95 transition cursor-pointer"
                      >
                        Claim Reward (+{challenge.rewardXp} XP)
                      </button>
                    )}
                  </div>
                </MotionCard>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Weekly Sprint Challenges
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyChallenges.map((challenge) => (
                <MotionCard key={challenge.id} className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{challenge.icon}</span>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-black rounded-full text-xs">
                        +{challenge.rewardXp} XP
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{challenge.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{challenge.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <ProgressBar 
                      value={(challenge.currentProgress / challenge.targetProgress) * 100} 
                      color={challenge.isCompleted ? 'emerald' : 'indigo'} 
                      showPercentage={false} 
                    />

                    {challenge.isCompleted ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimChallenge(challenge.id, false)}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs rounded-xl shadow-md hover:opacity-95 transition cursor-pointer"
                      >
                        Claim Weekly Reward (+{challenge.rewardXp} XP)
                      </button>
                    )}
                  </div>
                </MotionCard>
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
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Global SkillSwap Leaderboard
              </h2>
              <p className="text-slate-500 text-xs">Top swappers ranked by total XP, exchanges, and learning streaks</p>
            </div>
            <UiBadge variant="warning" icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}>
              Live Weekly Reset
            </UiBadge>
          </div>

          <Card className="p-0 overflow-hidden border border-slate-200 divide-y divide-slate-100">
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
                    isCurrentUser ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-extrabold text-slate-500 text-sm">
                      {medalIcon || `#${entry.rank}`}
                    </div>

                    <Avatar src={entry.user.avatar} name={entry.user.name} size="md" />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{entry.user.name}</h4>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white font-extrabold rounded-full text-[9px]">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {entry.swaps} successful exchanges • {entry.badgesCount} badges earned
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1 justify-end">
                        <Flame className="w-3.5 h-3.5 fill-orange-500" /> {entry.streak} Days
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Streak</span>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="text-base font-black text-indigo-900 block">{entry.xp} XP</span>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Points</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* 🏅 TAB 4: ACHIEVEMENTS & BADGES */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Achievements & Badges Showcase
            </h2>
            <p className="text-slate-500 text-xs">Unlock exclusive peer badges by teaching, swapping, and learning</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_BADGES_CATALOG.map((badge) => {
              const isEarned = currentUser.badges?.some(b => b.name === badge.name) || badge.id === 'b-first-swap' || badge.id === 'b-streak-flame';

              return (
                <MotionCard key={badge.id} className={`space-y-3 ${!isEarned ? 'opacity-60 bg-slate-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md ${
                      isEarned ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {badge.icon}
                    </div>

                    {isEarned ? (
                      <UiBadge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Earned
                      </UiBadge>
                    ) : (
                      <UiBadge variant="secondary">Locked</UiBadge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{badge.name}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1">{badge.description}</p>
                  </div>

                  {isEarned && (
                    <span className="text-[10px] text-slate-400 font-bold block pt-2 border-t border-slate-100">
                      Earned on {badge.dateEarned}
                    </span>
                  )}
                </MotionCard>
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
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Verified Skill Certificates
              </h2>
              <p className="text-slate-500 text-xs">Official certificates issued upon completing peer exchange milestones</p>
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
                <Card key={cert.id} className="p-6 space-y-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{cert.title}</h3>
                        <p className="text-indigo-600 font-bold text-xs">{cert.skillName}</p>
                      </div>
                    </div>
                    <UiBadge variant="success">Verified</UiBadge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-amber-200/80">
                    <span>Issued: <strong>{cert.issueDate}</strong></span>
                    <span className="font-mono text-[11px] text-slate-600">{cert.certificateCode}</span>
                  </div>

                  <button
                    onClick={() => {
                      triggerCelebrationConfetti();
                      setSelectedCert(cert);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>View & Print Official Certificate</span>
                  </button>
                </Card>
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
