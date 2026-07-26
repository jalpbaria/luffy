// Supabase Edge Function: gemini-proxy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES_LIST = [
  'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'recommendations') {
      const { currentSkills, careerGoals } = body;
      const prompt = `Based on the user's current skills: "${JSON.stringify(currentSkills || [])}"
and their career/learning goals: "${careerGoals || ''}",
suggest exactly 3 highly relevant skills they should learn on our skill exchange website "ExchangeYourSkill".

The output MUST be a JSON array, with exactly 3 recommendations, mapping to one of these platform categories:
${JSON.stringify(CATEGORIES_LIST)}.

Ensure the advice is professional, highly relevant, and shows exact reasoning.`;

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
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: `Gemini API returned status ${response.status}: ${errorText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return new Response(
        JSON.stringify({ text: candidateText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'tutor') {
      const { skillName, category, question, history } = body;
      const systemInstruction = `You are an expert AI Coach and Virtual Tutor for the skill "${skillName}" (Category: "${category}"). 
Your goal is to help the user learn this skill in a friendly, encouraging, and highly practical manner.
Provide clear step-by-step instructions, code snippets or structured exercises, common gotchas, and recommend real-world sites like W3Schools (especially for tech/marketing), MDN Web Docs, or official documentation where they can do interactive practicing.
Always keep formatting clean, using bold text, list bullet points, and markdown code blocks for readability.`;

      const formattedContents = [];
      if (Array.isArray(history)) {
        history.forEach((h: any) => {
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
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: `Gemini API returned status ${response.status}: ${errorText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await response.json();
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return new Response(
        JSON.stringify({ text: candidateText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
