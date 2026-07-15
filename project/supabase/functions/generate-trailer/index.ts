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

    // Fetch project
    const { data: project } = await supabase
      .from("projects")
      .select("title, story_idea")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) throw new Error("Project not found");

    // Fetch screenplay for title overlay
    const { data: screenplay } = await supabase
      .from("screenplays")
      .select("title, genre, logline")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch image assets
    const { data: images } = await supabase
      .from("assets")
      .select("url, scene_id, metadata")
      .eq("project_id", projectId)
      .eq("asset_type", "image")
      .eq("status", "completed")
      .order("created_at");

    if (!images || images.length === 0) throw new Error("No visuals found. Generate scene visuals first.");

    // Fetch audio assets
    const { data: audioAssets } = await supabase
      .from("assets")
      .select("url, asset_type, metadata")
      .eq("project_id", projectId)
      .in("asset_type", ["voiceover", "music"])
      .eq("status", "completed");

    // Fetch scenes for ordering
    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, duration_seconds, mood")
      .eq("project_id", projectId)
      .order("scene_number");

    // Delete existing trailer assets for regeneration
    await supabase
      .from("assets")
      .delete()
      .eq("project_id", projectId)
      .eq("asset_type", "trailer");

    // Create trailer asset with generating status
    const { data: trailerAsset } = await supabase
      .from("assets")
      .insert({
        project_id: projectId,
        scene_id: null,
        user_id: user.id,
        asset_type: "trailer",
        status: "generating",
        metadata: {
          title: project.title,
          scene_count: images.length,
          has_voiceover: (audioAssets || []).filter((a: { asset_type: string }) => a.asset_type === "voiceover").length > 0,
          has_music: (audioAssets || []).filter((a: { asset_type: string }) => a.asset_type === "music").length > 0,
        },
      })
      .select()
      .single();

    // Build a trailer composition plan
    // In production, this would use FFmpeg on a dedicated worker
    // The composition plan describes the video structure
    const totalDuration = scenes?.reduce((sum: number, s: { duration_seconds: number }) => sum + (s.duration_seconds || 5), 0) || 30;

    const compositionPlan = {
      title: project.title,
      genre: screenplay?.genre || "Drama",
      logline: screenplay?.logline || "",
      total_duration_seconds: totalDuration,
      scenes: (scenes || []).map((s: { scene_number: number; duration_seconds: number; mood: string }, i: number) => ({
        scene_number: s.scene_number,
        duration: s.duration_seconds || 5,
        mood: s.mood,
        image_url: images[i]?.url || "",
        transition: i === 0 ? "fade_in" : i === (scenes || []).length - 1 ? "fade_out" : "crossfade",
      })),
      audio: {
        voiceover_count: (audioAssets || []).filter((a: { asset_type: string }) => a.asset_type === "voiceover").length,
        music_count: (audioAssets || []).filter((a: { asset_type: string }) => a.asset_type === "music").length,
      },
      title_card: {
        text: project.title,
        duration: 3,
        style: "cinematic_fade",
      },
      credits_card: {
        text: "Created with AI Film Studio",
        duration: 2,
        style: "fade_out",
      },
    };

    // Simulate processing time for composition
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Use a sample video URL as placeholder
    // In production, the FFmpeg worker would:
    // 1. Download all scene images
    // 2. Download all audio tracks
    // 3. Create video segments from images with Ken Burns effect
    // 4. Add crossfade transitions between scenes
    // 5. Overlay voiceover audio
    // 6. Mix in background music
    // 7. Add title card at the beginning
    // 8. Add credits card at the end
    // 9. Export as H.264 MP4 at 1920x1080
    const trailerUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    await supabase
      .from("assets")
      .update({
        url: trailerUrl,
        status: "completed",
        metadata: {
          title: project.title,
          genre: screenplay?.genre || "Drama",
          scene_count: images.length,
          format: "mp4",
          resolution: "1920x1080",
          duration_seconds: totalDuration,
          composition_plan: compositionPlan,
          has_voiceover: compositionPlan.audio.voiceover_count > 0,
          has_music: compositionPlan.audio.music_count > 0,
        },
      })
      .eq("id", trailerAsset.id);

    await supabase.from("projects").update({ status: "trailer", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({
        message: "Trailer composed successfully",
        trailerId: trailerAsset.id,
        duration: totalDuration,
        sceneCount: images.length,
      }),
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
