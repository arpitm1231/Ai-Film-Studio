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

    // Fetch scenes for mood analysis
    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, mood, duration_seconds")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("scene_number");

    if (!scenes || scenes.length === 0) throw new Error("No scenes found. Generate a screenplay first.");

    // Delete existing music assets for regeneration
    await supabase
      .from("assets")
      .delete()
      .eq("project_id", projectId)
      .eq("asset_type", "music");

    // Get unique moods and calculate total duration
    const moods = [...new Set(scenes.map((s: { mood: string }) => s.mood).filter(Boolean))];
    const totalDuration = scenes.reduce((sum: number, s: { duration_seconds: number }) => sum + (s.duration_seconds || 5), 0);

    let generated = 0;

    // Generate a music track for each unique mood
    for (const mood of moods) {
      const scenesWithMood = scenes.filter((s: { mood: string }) => s.mood === mood);
      const moodDuration = scenesWithMood.reduce((sum: number, s: { duration_seconds: number }) => sum + (s.duration_seconds || 5), 0);

      const { data: asset } = await supabase
        .from("assets")
        .insert({
          project_id: projectId,
          scene_id: null,
          user_id: user.id,
          asset_type: "music",
          status: "generating",
          metadata: {
            mood,
            description: `Background score - ${mood} mood`,
            duration_seconds: moodDuration,
            scene_count: scenesWithMood.length,
          },
        })
        .select()
        .single();

      // In production, this would call Suno API or MusicLM
      // For now, create a placeholder with metadata
      const audioUrl = `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=`;

      await supabase
        .from("assets")
        .update({
          url: audioUrl,
          status: "completed",
          metadata: {
            mood,
            description: `AI-generated ${mood} background score`,
            duration_seconds: moodDuration,
            scene_count: scenesWithMood.length,
            scenes: scenesWithMood.map((s: { scene_number: number }) => s.scene_number),
          },
        })
        .eq("id", asset.id);

      generated++;
    }

    // Create an overall theme track
    const { data: themeAsset } = await supabase
      .from("assets")
      .insert({
        project_id: projectId,
        scene_id: null,
        user_id: user.id,
        asset_type: "music",
        status: "completed",
        url: `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=`,
        metadata: {
          mood: "theme",
          description: "Main theme - cinematic orchestral",
          duration_seconds: totalDuration,
          scene_count: scenes.length,
        },
      })
      .select()
      .single();

    generated++;

    await supabase.from("projects").update({ status: "audio", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({ message: "Music tracks generated", generated, totalDuration }),
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
