import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert AI learning path agent.
Your goal is to build or refine a personalized skill learning path.

CRITICAL INSTRUCTIONS:
1. You MUST ALWAYS use the web_search tool at least once before returning your final answer to search and ground real, current, working resources, courses, documentation, and videos for the requested skill.
2. Your final response MUST be ONLY a raw valid JSON object matching the exact format specified below. Do NOT wrap it in markdown code fences (\`\`\`json or \`\`\`), and do NOT include any introductory or concluding text or commentary outside the JSON object.

EXACT JSON OUTPUT SHAPE:
{
  "skill": "skill name string",
  "steps": [
    {
      "title": "step title string",
      "description": "detailed step description string",
      "estimatedTime": "estimated duration string, e.g. 2 weeks",
      "resources": {
        "free": [
          { "name": "resource name", "url": "valid http/https URL", "type": "course|video|docs|article" }
        ],
        "paid": [
          { "name": "resource name", "url": "valid http/https URL", "price": "e.g. $19.99 or $49/mo", "type": "course|certification" }
        ]
      }
    }
  ]
}`;

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current learning resources, courses, and roadmaps for a skill.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to look up learning resources, roadmaps, documentation, or courses."
          }
        },
        required: ["query"]
      }
    }
  }
];

async function tavilySearch(query: string): Promise<string> {
  const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
  if (!tavilyApiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not configured.");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query,
      max_results: 5
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const results = data.results || [];

  return results
    .map((r: { title?: string; url?: string; content?: string }) => `${r.title || "Resource"}: ${r.url || ""} — ${r.content || ""}`)
    .join("\n");
}

async function callGroq(messages: any[]) {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

async function runAgentLoop(messages: any[]): Promise<string> {
  const currentMessages = [...messages];

  for (let attempt = 0; attempt < 4; attempt++) {
    const groqResponse = await callGroq(currentMessages);
    const choice = groqResponse.choices?.[0];
    if (!choice) {
      throw new Error("No response choices returned from Groq.");
    }

    const assistantMessage = choice.message;
    const toolCalls = assistantMessage.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      currentMessages.push(assistantMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.function?.name === "web_search") {
          let searchQuery = "";
          try {
            const args = typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
            searchQuery = args.query || "";
          } catch (e) {
            searchQuery = toolCall.function.arguments || "";
          }

          const searchResult = await tavilySearch(searchQuery);

          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: searchResult
          });
        }
      }
    } else {
      return assistantMessage.content || "";
    }
  }

  throw new Error("Agent loop failed to converge within 4 turns.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    if (action === "generate") {
      const { skill, currentLevel, targetLevel, userId } = body;

      const userPrompt = `Generate a comprehensive learning path for learning "${skill}" from current level "${currentLevel || 'beginner'}" to target level "${targetLevel || 'expert'}".`;
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ];

      const resultContent = await runAgentLoop(messages);
      const cleanedText = resultContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanedText);

      const { data: pathRow, error: pathErr } = await supabase
        .from("learning_paths")
        .insert({
          user_id: userId,
          skill,
          current_level: currentLevel,
          target_level: targetLevel,
          path_json: parsed
        })
        .select()
        .single();

      if (pathErr) throw pathErr;

      const { error: msgErr } = await supabase
        .from("learning_path_messages")
        .insert([
          {
            learning_path_id: pathRow.id,
            role: "user",
            content: userPrompt
          },
          {
            learning_path_id: pathRow.id,
            role: "assistant",
            content: resultContent
          }
        ]);

      if (msgErr) throw msgErr;

      return new Response(
        JSON.stringify({ id: pathRow.id, ...parsed }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else if (action === "refine") {
      const { learningPathId, instruction } = body;

      const { data: existingPath, error: fetchPathErr } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("id", learningPathId)
        .single();

      if (fetchPathErr) throw fetchPathErr;

      const { data: historyMsgs, error: fetchMsgsErr } = await supabase
        .from("learning_path_messages")
        .select("role, content")
        .eq("learning_path_id", learningPathId)
        .order("created_at", { ascending: true });

      if (fetchMsgsErr) throw fetchMsgsErr;

      const refineUserPrompt = `Refinement instruction: ${instruction}\n\nPlease apply this refinement instruction to the learning path and return the FULL updated JSON matching the required schema (do not return a diff).`;

      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(historyMsgs || []).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content
        })),
        { role: "user", content: refineUserPrompt }
      ];

      const resultContent = await runAgentLoop(messages);
      const cleanedText = resultContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanedText);

      const { error: updateErr } = await supabase
        .from("learning_paths")
        .update({ path_json: parsed })
        .eq("id", learningPathId);

      if (updateErr) throw updateErr;

      const { error: newMsgErr } = await supabase
        .from("learning_path_messages")
        .insert([
          {
            learning_path_id: learningPathId,
            role: "user",
            content: instruction
          },
          {
            learning_path_id: learningPathId,
            role: "assistant",
            content: resultContent
          }
        ]);

      if (newMsgErr) throw newMsgErr;

      return new Response(
        JSON.stringify({ id: learningPathId, ...parsed }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "unknown action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (err: any) {
    console.error("Error in learning-path-agent function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
