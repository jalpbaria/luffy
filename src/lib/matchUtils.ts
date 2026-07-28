import { UserProfile, Skill } from '../types';

export interface MatchDirection {
  userSkill: Skill;
  otherSkill: Skill;
  matchType: 'exact_name' | 'category';
}

export interface UserMatchResult {
  user: UserProfile;
  /** Skills currentUser teaches that otherUser wants to learn */
  userTeachesTheyWant: MatchDirection[];
  /** Skills otherUser teaches that currentUser wants to learn */
  theyTeachUserWants: MatchDirection[];
  /** True if BOTH directions have at least 1 match */
  isPerfectMatch: boolean;
  /** True if exactly 1 direction has matches */
  isPartialMatch: boolean;
  /** Numerical score for sorting: perfect matches first, then by match count */
  score: number;
}

/**
 * Calculate skill barter overlap between currentUser and another user profile
 */
export function calculateMatch(currentUser: UserProfile, otherUser: UserProfile): UserMatchResult {
  const userTeachesTheyWant: MatchDirection[] = [];
  const theyTeachUserWants: MatchDirection[] = [];

  const currentUserOffered = currentUser?.skillsOffered || [];
  const currentUserWanted = currentUser?.skillsWanted || [];
  const otherUserOffered = otherUser?.skillsOffered || [];
  const otherUserWanted = otherUser?.skillsWanted || [];

  // Direction 1: currentUser teaches -> otherUser wants to learn
  for (const userSkill of currentUserOffered) {
    for (const otherSkill of otherUserWanted) {
      const uName = (userSkill.name || '').toLowerCase().trim();
      const oName = (otherSkill.name || '').toLowerCase().trim();
      const uCat = (userSkill.category || '').toLowerCase().trim();
      const oCat = (otherSkill.category || '').toLowerCase().trim();

      if (uName && oName && uName === oName) {
        if (!userTeachesTheyWant.some(m => m.userSkill.name === userSkill.name && m.otherSkill.name === otherSkill.name)) {
          userTeachesTheyWant.push({ userSkill, otherSkill, matchType: 'exact_name' });
        }
      } else if (uCat && oCat && uCat !== 'all' && uCat === oCat) {
        if (!userTeachesTheyWant.some(m => m.userSkill.name === userSkill.name && m.otherSkill.name === otherSkill.name)) {
          userTeachesTheyWant.push({ userSkill, otherSkill, matchType: 'category' });
        }
      }
    }
  }

  // Direction 2: otherUser teaches -> currentUser wants to learn
  for (const otherSkill of otherUserOffered) {
    for (const userSkill of currentUserWanted) {
      const uName = (userSkill.name || '').toLowerCase().trim();
      const oName = (otherSkill.name || '').toLowerCase().trim();
      const uCat = (userSkill.category || '').toLowerCase().trim();
      const oCat = (otherSkill.category || '').toLowerCase().trim();

      if (uName && oName && uName === oName) {
        if (!theyTeachUserWants.some(m => m.userSkill.name === userSkill.name && m.otherSkill.name === otherSkill.name)) {
          theyTeachUserWants.push({ userSkill, otherSkill, matchType: 'exact_name' });
        }
      } else if (uCat && oCat && uCat !== 'all' && uCat === oCat) {
        if (!theyTeachUserWants.some(m => m.userSkill.name === userSkill.name && m.otherSkill.name === otherSkill.name)) {
          theyTeachUserWants.push({ userSkill, otherSkill, matchType: 'category' });
        }
      }
    }
  }

  const isPerfectMatch = userTeachesTheyWant.length > 0 && theyTeachUserWants.length > 0;
  const isPartialMatch = !isPerfectMatch && (userTeachesTheyWant.length > 0 || theyTeachUserWants.length > 0);

  // Score calculation: Perfect matches get 1000 base + count. Partial matches get 100 base + count.
  const totalMatchesCount = userTeachesTheyWant.length + theyTeachUserWants.length;
  const score = isPerfectMatch ? 1000 + totalMatchesCount : isPartialMatch ? 100 + totalMatchesCount : 0;

  return {
    user: otherUser,
    userTeachesTheyWant,
    theyTeachUserWants,
    isPerfectMatch,
    isPartialMatch,
    score
  };
}

/**
 * Calculate matches for all users against currentUser
 */
export function computeAllUserMatches(currentUser: UserProfile, users: UserProfile[]): UserMatchResult[] {
  if (!currentUser) return [];

  return users
    .filter(u => u.id !== currentUser.id)
    .map(otherUser => calculateMatch(currentUser, otherUser))
    .sort((a, b) => b.score - a.score);
}
