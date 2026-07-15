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

    // Fetch scenes
    const { data: scenes, error: scenesError } = await supabase
      .from("scenes")
      .select("id, scene_number, visual_description, mood, location, time_of_day")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("scene_number");

    if (scenesError) throw scenesError;
    if (!scenes || scenes.length === 0) throw new Error("No scenes found. Generate a screenplay first.");

    // Delete existing image assets for regeneration
    await supabase
      .from("assets")
      .delete()
      .eq("project_id", projectId)
      .eq("asset_type", "image");

    const stabilityKey = Deno.env.get("STABILITY_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let generated = 0;
    const total = scenes.length;

    for (const scene of scenes) {
      // Create generating asset
      const { data: asset } = await supabase
        .from("assets")
        .insert({
          project_id: projectId,
          scene_id: scene.id,
          user_id: user.id,
          asset_type: "image",
          status: "generating",
          metadata: {
            prompt: scene.visual_description,
            mood: scene.mood,
            scene_number: scene.scene_number,
            progress: `${generated + 1}/${total}`,
          },
        })
        .select()
        .single();

      let imageUrl = "";

      // Try Stability AI first
      if (stabilityKey) {
        try {
          const enhancedPrompt = `${scene.visual_description}, cinematic film still, 16:9 aspect ratio, high quality, dramatic lighting, professional cinematography, ${scene.mood} mood, ${scene.time_of_day} lighting`;

          const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${stabilityKey}`,
              Accept: "application/json",
            },
            body: JSON.stringify({
              text_prompts: [
                { text: enhancedPrompt, weight: 1 },
                { text: "blurry, low quality, distorted, watermark, text overlay", weight: -1 },
              ],
              cfg_scale: 7.5,
              height: 576,
              width: 1024,
              samples: 1,
              steps: 35,
              style_preset: "cinematic",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.artifacts && result.artifacts.length > 0) {
              const base64 = result.artifacts[0].base64;
              const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

              const filePath = `${user.id}/${projectId}/scene_${scene.scene_number}.png`;
              const { error: uploadError } = await supabase.storage
                .from("film-assets")
                .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });

              if (!uploadError) {
                const { data: urlData } = supabase.storage.from("film-assets").getPublicUrl(filePath);
                imageUrl = urlData.publicUrl;
              }
            }
          }
        } catch {
          // Fall through to DALL-E or placeholder
        }
      }

      // Try DALL-E as fallback if Stability didn't work
      if (!imageUrl && openaiKey) {
        try {
          const dallePrompt = `Cinematic film still: ${scene.visual_description}. ${scene.mood} mood, ${scene.time_of_day} lighting, 16:9 widescreen, professional cinematography, high detail`;

          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: dallePrompt,
              n: 1,
              size: "1792x1024",
              quality: "hd",
              style: "vivid",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.length > 0) {
              imageUrl = result.data[0].url;
            }
          }
        } catch {
          // Fall through to placeholder
        }
      }

      // Use cinematic stock photos as final fallback
      if (!imageUrl) {
        const pexelsImages = [
          "https://images.pexels.com/photos/2872278/pexels-photo-2872278.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/3137446/pexels-photo-3137446.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/1116905/pexels-photo-1116905.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/3310695/pexels-photo-3310695.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/1485894/pexels-photo-1485894.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/1117364/pexels-photo-1117364.jpeg?auto=compress&cs=tinysrgb&w=1280",
          "https://images.pexels.com/photos/2611818/pexels-photo-2611818.jpeg?auto=compress&cs=tinysrgb&w=1280",
        ];
        imageUrl = pexelsImages[(scene.scene_number - 1) % pexelsImages.length];
      }

      // Update asset with URL
      await supabase
        .from("assets")
        .update({
          url: imageUrl,
          status: "completed",
          metadata: {
            prompt: scene.visual_description,
            mood: scene.mood,
            scene_number: scene.scene_number,
            location: scene.location,
            time_of_day: scene.time_of_day,
          },
        })
        .eq("id", asset.id);

      generated++;
    }

    // Update project status
    await supabase.from("projects").update({ status: "visuals", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({ message: "Visuals generated", generated, total }),
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
