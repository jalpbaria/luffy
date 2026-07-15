// Client-side Gemini API Integration

const getApiKey = (): string => {
  return (
    (import.meta as any).env.VITE_GEMINI_API_KEY ||
    (process as any).env?.GEMINI_API_KEY ||
    ''
  );
};

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

// Categories available on the platform
const CATEGORIES_LIST = [
  'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

// Robust fallback answers for key skills if Gemini is offline
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
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Gemini API key is missing. Using pre-configured fallback recommendations.');
    return FALLBACK_RECS;
  }

  const prompt = `Based on the user's current skills: "${JSON.stringify(currentSkills)}"
and their career/learning goals: "${careerGoals}",
suggest exactly 3 highly relevant skills they should learn on our skill exchange website "ExchangeYourSkill".

The output MUST be a JSON array, with exactly 3 recommendations, mapping to one of these platform categories:
${JSON.stringify(CATEGORIES_LIST)}.

Ensure the advice is professional, highly relevant, and shows exact reasoning.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: "You are a career development expert and professional skill coach for ExchangeYourSkill, a mutual skill exchange platform." }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                skillName: {
                  type: "STRING",
                  description: "Name of the recommended skill"
                },
                category: {
                  type: "STRING",
                  description: "Strictly one of the platform categories"
                },
                reasoning: {
                  type: "STRING",
                  description: "Actionable reasoning explaining how learning this skill helps achieve their career goals"
                },
                marketDemand: {
                  type: "STRING",
                  description: "High-level demand or trend context (e.g., high growth, trending globally)"
                }
              },
              required: ["skillName", "category", "reasoning", "marketDemand"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return JSON.parse(candidateText.trim());
    }
  } catch (err) {
    console.error('Error fetching from Gemini API:', err);
  }

  return FALLBACK_RECS;
}

export async function getAISkillTutorReply(
  skillName: string,
  category: string,
  question: string,
  history: TutorMessage[]
): Promise<string> {
  const apiKey = getApiKey();
  const fallbackReply = `Here is a helpful summary for learning **${skillName}**:\n\n` +
    `1. **Study Core Concepts**: Dedicate 20-30 minutes daily to understanding basic properties and standard rules.\n` +
    `2. **Hands-on Practice**: Build small pet projects or complete exercises on interactive websites.\n` +
    `3. **Reference Official Guides**: Use official documentation and standard tutorial platforms to lookup complex properties.\n\n` +
    `*(Note: Offline mode fallback response, configure GEMINI_API_KEY for dynamic tutoring)*`;

  if (!apiKey) {
    console.warn('Gemini API key is missing. Using local fallback reply.');
    return fallbackReply;
  }

  const systemInstruction = `You are an expert AI Coach and Virtual Tutor for the skill "${skillName}" (Category: "${category}"). 
Your goal is to help the user learn this skill in a friendly, encouraging, and highly practical manner.
Provide clear step-by-step instructions, code snippets or structured exercises, common gotchas, and recommend real-world sites like W3Schools (especially for tech/marketing), MDN Web Docs, or official documentation where they can do interactive practicing.
Always keep formatting clean, using bold text, list bullet points, and markdown code blocks for readability.`;

  try {
    const formattedContents = [];
    if (Array.isArray(history)) {
      history.forEach(h => {
        formattedContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return candidateText;
    }
  } catch (err) {
    console.error('Error fetching tutor reply from Gemini:', err);
  }

  return fallbackReply;
}
