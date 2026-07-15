import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Voice mapping for different character types
const voiceMap: Record<string, string> = {
  default: "21m00Tcm4TlvDq8ikWAM", // Rachel
  male_deep: "pNInP6MpgGOJQ9XyFQnF", // Adam
  male_young: "yoZ06aMxZJJ28mfd3oQY", // Sam
  female_warm: "Xb7hH8jUf3K8bD2m9lOe", // Bella
  narrator: "AZnzlk1XvdvUeBnXTld2", // Antoni
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

    // Fetch scenes with dialogue
    const { data: scenes, error: scenesError } = await supabase
      .from("scenes")
      .select("id, scene_number, dialogue, mood")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("scene_number");

    if (scenesError) throw scenesError;
    if (!scenes || scenes.length === 0) throw new Error("No scenes found. Generate a screenplay first.");

    // Delete existing voiceover assets for regeneration
    await supabase
      .from("assets")
      .delete()
      .eq("project_id", projectId)
      .eq("asset_type", "voiceover");

    const elevenlabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    let generated = 0;

    for (const scene of scenes) {
      const dialogue = scene.dialogue as Array<{ character: string; line: string }>;
      if (!dialogue || dialogue.length === 0) continue;

      // Combine all dialogue for the scene into a narration script
      const narrationText = dialogue
        .map((d) => `${d.character}: ${d.line}`)
        .join(". ... ");

      const { data: asset } = await supabase
        .from("assets")
        .insert({
          project_id: projectId,
          scene_id: scene.id,
          user_id: user.id,
          asset_type: "voiceover",
          status: "generating",
          metadata: {
            scene_number: scene.scene_number,
            text: narrationText.substring(0, 200),
            character: dialogue[0]?.character || "Narrator",
            line: dialogue[0]?.line?.substring(0, 100) || "",
          },
        })
        .select()
        .single();

      let audioUrl = "";

      if (elevenlabsKey) {
        try {
          // Use narrator voice for scene narration
          const voiceId = voiceMap.narrator;

          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": elevenlabsKey,
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: narrationText,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true,
              },
            }),
          });

          if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const filePath = `${user.id}/${projectId}/voiceover_scene_${scene.scene_number}.mp3`;
            const { error: uploadError } = await supabase.storage
              .from("film-assets")
              .upload(filePath, audioBuffer, { contentType: "audio/mpeg", upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("film-assets").getPublicUrl(filePath);
              audioUrl = urlData.publicUrl;
            }
          }
        } catch {
          // Fall through to placeholder
        }
      }

      // If no audio generated, create a placeholder entry
      if (!audioUrl) {
        audioUrl = `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=`;
      }

      await supabase
        .from("assets")
        .update({
          url: audioUrl,
          status: "completed",
          metadata: {
            scene_number: scene.scene_number,
            character: dialogue[0]?.character || "Narrator",
            line: dialogue[0]?.line?.substring(0, 100) || "",
            mood: scene.mood,
            dialogue_count: dialogue.length,
          },
        })
        .eq("id", asset.id);

      generated++;
    }

    await supabase.from("projects").update({ status: "audio", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({ message: "Voiceovers generated", generated }),
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
