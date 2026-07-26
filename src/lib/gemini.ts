import { supabase } from './supabase';

export interface RecommendedSkill {
  skillName: string;
  category: string;
  reasoning: string;
  marketDemand: string;
}

export interface TutorMessage {
  role: 'user' | 'model';
  text: string;
}

// Robust fallback answers for key skills if Gemini Edge Function is offline
const FALLBACK_RECS: RecommendedSkill[] = [
  {
    skillName: 'Public Speaking Essentials',
    category: 'Public Speaking',
    reasoning: 'To complement your technical skills and help you confidently pitch projects or ideas to key stakeholders.',
    marketDemand: 'Essential Leadership Skill'
  },
  {
    skillName: 'Figma UI/UX Design',
    category: 'Graphic Design',
    reasoning: 'Allows you to design beautiful wireframes and interactive prototypes, adding massive value to your software workflow.',
    marketDemand: 'Highly Demanded'
  },
  {
    skillName: 'SEO & Copywriting',
    category: 'Digital Marketing',
    reasoning: 'Gives you the copywriting power to market your products online and optimize organic search rankings.',
    marketDemand: 'High Growth Potential'
  }
];

export async function getAIRecommendations(
  currentSkills: any[],
  careerGoals: string
): Promise<RecommendedSkill[]> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        action: 'recommendations',
        currentSkills,
        careerGoals
      }
    });

    if (error) {
      console.warn('Gemini Edge Function returned error:', error);
      return FALLBACK_RECS;
    }

    if (data && data.text) {
      const parsed = JSON.parse(data.text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error calling Gemini proxy function:', err);
  }

  return FALLBACK_RECS;
}

export async function getAISkillTutorReply(
  skillName: string,
  category: string,
  question: string,
  history: TutorMessage[]
): Promise<string> {
  const fallbackReply = `Here is a helpful summary for learning **${skillName}**:\n\n` +
    `1. **Study Core Concepts**: Dedicate 20-30 minutes daily to understanding basic properties and standard rules.\n` +
    `2. **Hands-on Practice**: Build small pet projects or complete exercises on interactive websites.\n` +
    `3. **Reference Official Guides**: Use official documentation and standard tutorial platforms to lookup complex properties.\n\n` +
    `*(Note: Offline mode fallback response, configure GEMINI_API_KEY for dynamic tutoring)*`;

  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        action: 'tutor',
        skillName,
        category,
        question,
        history
      }
    });

    if (error) {
      console.warn('Gemini Edge Function returned error:', error);
      return fallbackReply;
    }

    if (data && data.text) {
      return data.text;
    }
  } catch (err) {
    console.error('Error calling Gemini proxy function:', err);
  }

  return fallbackReply;
}

