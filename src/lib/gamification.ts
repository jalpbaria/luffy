import confetti from 'canvas-confetti';
import { UserProfile, Challenge, Certificate, LeaderboardEntry, Badge } from '../types';

// Fire Confetti Animation
export function triggerCelebrationConfetti() {
  // Center burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
  });

  // Secondary side cannons
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366f1', '#a855f7', '#3b82f6']
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10b981', '#f59e0b', '#ec4899']
    });
  }, 200);
}

// XP & Level calculations
export function calculateUserXP(user: UserProfile): number {
  const base = 500;
  const swapXP = (user.successfulExchanges || 0) * 350;
  const badgeXP = (user.badges?.length || 0) * 200;
  return base + swapXP + badgeXP;
}

export function calculateUserLevel(xp: number): { level: number; title: string; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  const level = Math.max(1, Math.floor(xp / 350) + 1);
  const currentLevelXp = (level - 1) * 350;
  const nextLevelXp = level * 350;
  const xpInLevel = xp - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((xpInLevel / 350) * 100));

  const titles = [
    'Novice Swapper',
    'Skill Explorer',
    'Knowledge Builder',
    'Active Mentor',
    'Master Instructor',
    'Legendary Scholar',
    'Grand Sage'
  ];

  const title = titles[Math.min(titles.length - 1, level - 1)];

  return {
    level,
    title,
    currentLevelXp: xpInLevel,
    nextLevelXp: 350,
    progressPercent
  };
}

// Pre-defined Daily Challenges
export const initialDailyChallenges: Challenge[] = [
  {
    id: 'dc-1',
    title: 'Daily Check-in & Review',
    description: 'Log into SkillSwap and inspect your active study hub notes',
    rewardXp: 50,
    currentProgress: 1,
    targetProgress: 1,
    isCompleted: true,
    type: 'daily',
    category: 'Daily Streak',
    icon: '⚡'
  },
  {
    id: 'dc-2',
    title: 'Explore New Swapper',
    description: 'Browse swappers in Explore view and filter by your wanted skill',
    rewardXp: 75,
    currentProgress: 1,
    targetProgress: 1,
    isCompleted: false,
    type: 'daily',
    category: 'Discovery',
    icon: '🔍'
  },
  {
    id: 'dc-3',
    title: 'Skill Quiz Practice',
    description: 'Complete 1 interactive AI Quiz session in Study Hub',
    rewardXp: 100,
    currentProgress: 0,
    targetProgress: 1,
    isCompleted: false,
    type: 'daily',
    category: 'Mastery',
    icon: '🧠'
  }
];

// Pre-defined Weekly Challenges
export const initialWeeklyChallenges: Challenge[] = [
  {
    id: 'wc-1',
    title: 'Barter Champion',
    description: 'Complete 2 peer skill exchange sessions this week',
    rewardXp: 250,
    currentProgress: 1,
    targetProgress: 2,
    isCompleted: false,
    type: 'weekly',
    category: 'Exchanges',
    icon: '🤝'
  },
  {
    id: 'wc-2',
    title: 'Knowledge Donor',
    description: 'Teach a skill or leave detailed 5-star teaching feedback',
    rewardXp: 200,
    currentProgress: 1,
    targetProgress: 1,
    isCompleted: true,
    type: 'weekly',
    category: 'Mentorship',
    icon: '⭐'
  },
  {
    id: 'wc-3',
    title: 'Roadmap Milestone',
    description: 'Progress 25% further in your AI Skill Roadmap',
    rewardXp: 300,
    currentProgress: 15,
    targetProgress: 25,
    isCompleted: false,
    type: 'weekly',
    category: 'Roadmap',
    icon: '🚀'
  }
];

// Initial Certificates
export function getSampleCertificates(user: UserProfile): Certificate[] {
  return [
    {
      id: 'cert-1',
      title: 'Verified Peer Instructor Certificate',
      recipientName: user.name,
      skillName: user.skillsOffered?.[0]?.name || 'Web Development & System Design',
      issueDate: '2026-02-15',
      certificateCode: 'SKILLSWAP-2026-PRO-9821',
      issuer: 'SkillSwap Global Peer Academy'
    },
    {
      id: 'cert-2',
      title: 'Conversational Fluency Mastery',
      recipientName: user.name,
      skillName: user.skillsWanted?.[0]?.name || 'Conversational Spanish',
      issueDate: '2026-01-20',
      certificateCode: 'SKILLSWAP-2026-LANG-4412',
      issuer: 'SkillSwap Language Exchange Circle'
    }
  ];
}

// Build Global Leaderboard Ranking
export function buildGlobalLeaderboard(allUsers: UserProfile[]): LeaderboardEntry[] {
  const ranked = allUsers.map((u) => {
    const xp = calculateUserXP(u);
    const swaps = u.successfulExchanges || 0;
    const streak = Math.max(3, (swaps * 2) + 1);
    const badgesCount = u.badges?.length || 0;

    return {
      user: u,
      xp,
      streak,
      swaps,
      badgesCount
    };
  });

  ranked.sort((a, b) => b.xp - a.xp);

  return ranked.map((entry, idx) => ({
    ...entry,
    rank: idx + 1
  }));
}

// Available Badges Universe for unlocking
export const ALL_BADGES_CATALOG: Badge[] = [
  {
    id: 'b-first-swap',
    name: 'First Swap Pioneer',
    icon: '🤝',
    description: 'Successfully completed your very first peer skill exchange!',
    dateEarned: '2026-01-10'
  },
  {
    id: 'b-5star-teacher',
    name: '5-Star Master Mentor',
    icon: '⭐',
    description: 'Received top 5-star teaching rating from a satisfied swapper',
    dateEarned: '2026-01-18'
  },
  {
    id: 'b-streak-flame',
    name: '7-Day Streak Master',
    icon: '🔥',
    description: 'Maintained an active learning streak for 7 consecutive days',
    dateEarned: '2026-02-01'
  },
  {
    id: 'b-quiz-champ',
    name: 'Interactive Quiz Champ',
    icon: '🏆',
    description: 'Scored 100% on 3 interactive study hub skill quizzes',
    dateEarned: '2026-02-12'
  },
  {
    id: 'b-ai-pathfinder',
    name: 'AI Roadmap Explorer',
    icon: '✨',
    description: 'Generated and completed a full AI personalized skill roadmap',
    dateEarned: '2026-02-20'
  }
];
