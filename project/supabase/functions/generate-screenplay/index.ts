import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { projectId } = await req.json();
    if (!projectId) throw new Error("Project ID required");

    // Fetch project story
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("title, story_idea")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) throw new Error("Project not found");
    if (!project.story_idea || project.story_idea.trim().length < 10) {
      throw new Error("Please add a story idea with at least 10 characters before generating a screenplay");
    }

    // Delete any existing screenplay for this project to allow regeneration
    const { data: existingScreenplay } = await supabase
      .from("screenplays")
      .select("id")
      .eq("project_id", projectId)
      .limit(1)
      .maybeSingle();

    if (existingScreenplay) {
      // Delete existing scenes first (cascade should handle this, but be explicit)
      await supabase.from("scenes").delete().eq("screenplay_id", existingScreenplay.id);
      await supabase.from("screenplays").delete().eq("id", existingScreenplay.id);
    }

    // Generate screenplay using OpenAI
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let screenplayData;

    if (openaiKey) {
      const prompt = `You are an award-winning screenwriter with expertise in cinematic storytelling. Based on the following story idea, generate a professional, structured screenplay in JSON format.

Story Idea: "${project.story_idea}"
Project Title: "${project.title}"

Return a JSON object with this EXACT structure:
{
  "title": "string - the screenplay title",
  "genre": "string - primary genre",
  "logline": "string - a compelling one-sentence summary that captures the essence",
  "characters": [{"name": "string", "description": "string - brief character description with personality traits"}],
  "scenes": [
    {
      "scene_number": 1,
      "location": "string - specific filming location",
      "time_of_day": "string - e.g. Dawn, Morning, Afternoon, Dusk, Night",
      "description": "string - what happens in this scene, the action and events",
      "visual_description": "string - DETAILED visual description for AI image generation. Must include: camera angle, lighting, color palette, mood, specific visual elements. Think cinematic 16:9 framing.",
      "dialogue": [{"character": "string - must match a character name", "line": "string - the dialogue line"}],
      "mood": "string - emotional tone e.g. contemplative, tense, hopeful, climactic",
      "duration_seconds": 5
    }
  ]
}

CRITICAL RULES:
- Generate exactly 8 scenes for a complete narrative arc
- Each visual_description must be at least 50 words, highly detailed for image generation
- Include setup, rising action, climax, and resolution scenes
- Dialogue should feel natural and character-driven
- Characters must have distinct voices
- Return ONLY valid JSON, no markdown or extra text`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a professional screenwriter. Always respond with valid JSON only. No markdown formatting." },
            { role: "user", content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errBody.substring(0, 200)}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      screenplayData = JSON.parse(content);

      // Validate structure
      if (!screenplayData.scenes || !Array.isArray(screenplayData.scenes) || screenplayData.scenes.length === 0) {
        throw new Error("AI generated invalid screenplay structure. Please try again.");
      }
    } else {
      // Fallback demo screenplay
      screenplayData = {
        title: project.title,
        genre: "Drama",
        logline: `A compelling story about ${project.story_idea.substring(0, 80)}...`,
        characters: [
          { name: "Alex", description: "The determined protagonist seeking truth" },
          { name: "Jordan", description: "A mysterious ally with a hidden past" },
          { name: "Morgan", description: "The formidable antagonist driven by ambition" },
          { name: "Sam", description: "A loyal friend caught in the crossfire" },
        ],
        scenes: [
          {
            scene_number: 1,
            location: "City Skyline Rooftop",
            time_of_day: "Dawn",
            description: "The city awakens as Alex stands on a rooftop, contemplating the journey ahead. The weight of the decision is visible in every line of their body.",
            visual_description: "Wide aerial shot of a modern city skyline at dawn, golden light breaking through clouds, a lone figure silhouetted on a rooftop edge, cinematic 16:9 framing, warm amber and cool blue tones, lens flare from rising sun, shallow depth of field on foreground railing",
            dialogue: [{ character: "Alex", line: "Today everything changes." }],
            mood: "contemplative",
            duration_seconds: 6,
          },
          {
            scene_number: 2,
            location: "Underground Station",
            time_of_day: "Morning",
            description: "Alex descends into the underground, meeting Jordan for the first time. The air is thick with tension and unspoken questions.",
            visual_description: "Dimly lit underground station with flickering neon signs, steam rising from vents, two figures meeting in shadows, noir lighting with cyan and amber accents, wet platform reflecting light, cinematic composition with leading lines, anamorphic lens flare",
            dialogue: [
              { character: "Jordan", line: "You're the one they sent?" },
              { character: "Alex", line: "I heard you could help me find the truth." },
              { character: "Jordan", line: "The truth has a cost. Are you willing to pay it?" },
            ],
            mood: "mysterious",
            duration_seconds: 8,
          },
          {
            scene_number: 3,
            location: "Abandoned Warehouse",
            time_of_day: "Afternoon",
            description: "Alex and Jordan discover Morgan's hidden operation. The scale of the conspiracy becomes terrifyingly clear.",
            visual_description: "Vast abandoned warehouse interior, shafts of dusty light streaming through broken skylights, industrial equipment covered in tarps, dramatic chiaroscuro lighting, desaturated tones with red accent from warning lights, wide shot emphasizing scale, deep shadows",
            dialogue: [
              { character: "Alex", line: "This is bigger than we thought." },
              { character: "Jordan", line: "We need to move before they find us here." },
              { character: "Sam", line: "Guys... I think they already know." },
            ],
            mood: "tense",
            duration_seconds: 7,
          },
          {
            scene_number: 4,
            location: "Rooftop Garden",
            time_of_day: "Sunset",
            description: "A moment of peace as Alex and Jordan plan their next move. Sam shares a personal story that changes everything.",
            visual_description: "Rooftop garden oasis above the city, sunset painting the sky in deep oranges and purples, lush greenery contrasting with urban backdrop, warm golden hour lighting, intimate close-up framing, bokeh city lights in background, soft lens diffusion",
            dialogue: [
              { character: "Sam", line: "I never told you why I'm here." },
              { character: "Alex", line: "I figured you'd say when you were ready." },
              { character: "Sam", line: "Morgan is my family. And I chose you instead." },
            ],
            mood: "emotional",
            duration_seconds: 8,
          },
          {
            scene_number: 5,
            location: "Corporate Tower Penthouse",
            time_of_day: "Night",
            description: "Alex confronts Morgan in a dramatic face-off. The truth about the conspiracy is finally revealed.",
            visual_description: "Sleek corporate penthouse office, floor-to-ceiling windows revealing night city lights, two figures facing each other across a glass desk, cold blue lighting with sharp shadows, high contrast cinematic shot, reflections in glass surfaces, rain on windows",
            dialogue: [
              { character: "Morgan", line: "You have no idea what you're interfering with." },
              { character: "Alex", line: "I know enough. I know what you took from people." },
              { character: "Morgan", line: "Then you know you can't win. The system is mine." },
              { character: "Alex", line: "Systems break." },
            ],
            mood: "confrontational",
            duration_seconds: 10,
          },
          {
            scene_number: 6,
            location: "City Bridge",
            time_of_day: "Night",
            description: "The chase reaches its climax on the bridge. Sam makes the ultimate sacrifice to protect Alex.",
            visual_description: "Dramatic night scene on a suspension bridge, rain falling heavily, city lights blurred in background, lightning illuminating the scene, wet surfaces reflecting neon lights, epic wide shot with motion blur, volumetric rain, car headlights streaking",
            dialogue: [
              { character: "Sam", line: "Go! I'll hold them off." },
              { character: "Alex", line: "I'm not leaving you!" },
              { character: "Sam", line: "You have to. The world needs to know." },
            ],
            mood: "climactic",
            duration_seconds: 9,
          },
          {
            scene_number: 7,
            location: "Broadcast Studio",
            time_of_day: "Night",
            description: "Alex broadcasts the evidence to the world. The truth is finally free.",
            visual_description: "High-tech broadcast studio interior, multiple screens showing data and evidence, Alex at a control console, dramatic lighting from screens casting blue and white light, camera flashes, urgent atmosphere, tight medium shot, shallow depth of field",
            dialogue: [
              { character: "Alex", line: "Everything I'm about to show you is real. And it changes everything." },
            ],
            mood: "decisive",
            duration_seconds: 7,
          },
          {
            scene_number: 8,
            location: "Park Bench",
            time_of_day: "Morning",
            description: "Dawn of a new day. Alex sits on a park bench, the weight of the journey lifting. Jordan appears with news.",
            visual_description: "Serene city park at morning, soft dappled light through trees, Alex on a wooden bench, pigeons in foreground, Jordan approaching from distance, warm golden tones, gentle lens flare, wide establishing shot transitioning to medium, peaceful atmosphere, morning mist",
            dialogue: [
              { character: "Jordan", line: "It's over. They're investigating." },
              { character: "Alex", line: "It's never really over. But today... today is enough." },
            ],
            mood: "hopeful",
            duration_seconds: 8,
          },
        ],
      };
    }

    // Save screenplay to database
    const { data: screenplay, error: insertError } = await supabase
      .from("screenplays")
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: screenplayData.title || project.title,
        genre: screenplayData.genre || "Drama",
        logline: screenplayData.logline || "",
        characters: screenplayData.characters || [],
        raw_json: screenplayData,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Save scenes
    const scenes = screenplayData.scenes.map((s: Record<string, unknown>) => ({
      screenplay_id: screenplay.id,
      project_id: projectId,
      user_id: user.id,
      scene_number: s.scene_number as number,
      location: (s.location as string) || "",
      time_of_day: (s.time_of_day as string) || "",
      description: (s.description as string) || "",
      visual_description: (s.visual_description as string) || "",
      dialogue: Array.isArray(s.dialogue) ? s.dialogue : [],
      mood: (s.mood as string) || "",
      duration_seconds: (s.duration_seconds as number) || 5,
    }));

    const { error: scenesError } = await supabase.from("scenes").insert(scenes);
    if (scenesError) throw scenesError;

    // Update project status
    await supabase.from("projects").update({ status: "script", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({ screenplay, message: "Screenplay generated successfully", sceneCount: scenes.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
