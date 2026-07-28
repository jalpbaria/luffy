import { Review } from '../types';

export interface VerifiedSkillStatus {
  isVerified: boolean;
  qualifyingCount: number; // Count of 4 or 5 star reviews
  totalSkillReviews: number;
  averageRating: number;
}

/**
 * Checks if a specific skill taught by a teacher is "Verified".
 * Rule: A skill becomes Verified once the teacher has received 3 or more 
 * reviews with a rating of 4 or 5 stars for bookings involving that specific skill_name.
 */
export function isSkillVerified(
  teacherId: string,
  skillName: string,
  allReviews: Review[]
): VerifiedSkillStatus {
  if (!teacherId || !skillName || !Array.isArray(allReviews)) {
    return { isVerified: false, qualifyingCount: 0, totalSkillReviews: 0, averageRating: 0 };
  }

  const normalizedSkill = skillName.trim().toLowerCase();

  // Filter reviews for this teacher and matching skillName
  const skillReviews = allReviews.filter(r => {
    if (r.teacherId !== teacherId) return false;
    const rSkill = (r.skillName || '').trim().toLowerCase();
    return rSkill === normalizedSkill;
  });

  // Count reviews with rating >= 4 (4 or 5 stars)
  const qualifying = skillReviews.filter(r => r.rating >= 4);
  const qualifyingCount = qualifying.length;

  const totalRating = skillReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = skillReviews.length > 0 ? Number((totalRating / skillReviews.length).toFixed(1)) : 0;

  return {
    isVerified: qualifyingCount >= 3,
    qualifyingCount,
    totalSkillReviews: skillReviews.length,
    averageRating
  };
}
