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

    // Fetch project and screenplay data
    const { data: project } = await supabase
      .from("projects")
      .select("title, story_idea")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) throw new Error("Project not found");

    const { data: screenplay } = await supabase
      .from("screenplays")
      .select("genre, logline, characters")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: scenes } = await supabase
      .from("scenes")
      .select("mood, location, duration_seconds")
      .eq("project_id", projectId);

    const { data: assets } = await supabase
      .from("assets")
      .select("asset_type, status")
      .eq("project_id", projectId);

    const genre = screenplay?.genre || "Drama";
    const sceneCount = scenes?.length || 0;
    const totalDuration = scenes?.reduce((sum: number, s: { duration_seconds: number }) => sum + (s.duration_seconds || 5), 0) || 0;
    const completedAssets = (assets || []).filter((a: { status: string }) => a.status === "completed").length;

    // Delete existing production data for regeneration
    await supabase
      .from("productions")
      .delete()
      .eq("project_id", projectId);

    // Generate analytics using OpenAI if available
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let analyticsData;

    if (openaiKey) {
      const prompt = `You are a film production analyst and market researcher. Based on this film project, generate comprehensive production analytics.

Title: "${project.title}"
Genre: ${genre}
Logline: ${screenplay?.logline || "N/A"}
Characters: ${(screenplay?.characters || []).map((c: { name: string }) => c.name).join(", ")}
Scenes: ${sceneCount}
Estimated Duration: ${totalDuration} seconds
Completed Assets: ${completedAssets}

Return a JSON object with this EXACT structure:
{
  "budget_estimate": {
    "total": 2500000,
    "categories": [
      {"name": "Cast & Talent", "amount": 800000},
      {"name": "Crew & Production", "amount": 600000},
      {"name": "Locations & Permits", "amount": 350000},
      {"name": "Visual Effects", "amount": 400000},
      {"name": "Post-Production", "amount": 200000},
      {"name": "Marketing & Distribution", "amount": 150000}
    ]
  },
  "schedule": {
    "days": [
      {"day": 1, "activity": "Pre-production meeting and script breakdown", "location": "Studio Office"},
      {"day": 2, "activity": "Location scouting and permits", "location": "Various Locations"}
    ]
  },
  "locations": [
    {"name": "Downtown District", "type": "Urban", "country": "USA"}
  ],
  "success_prediction": {
    "audience_score": 75,
    "market_fit": "Detailed analysis of market positioning and audience appeal...",
    "demographics": ["18-24", "25-34"],
    "comparable_films": ["Film Title 1", "Film Title 2", "Film Title 3"]
  },
  "sentiment_score": 72,
  "market_reach": "Wide domestic release with international potential"
}

RULES:
- Budget should be realistic for the genre and scope (in USD)
- Schedule should have 15-30 days with specific activities
- Locations should match the screenplay settings
- Success prediction should be data-driven and realistic
- Comparable films should be real, well-known movies in the same genre
- Sentiment score should be 0-100 based on story strength
- Return ONLY valid JSON`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a film industry analyst with expertise in production budgeting, scheduling, and market analysis. Always respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        analyticsData = JSON.parse(result.choices[0].message.content);
      }
    }

    // Fallback analytics with realistic data
    if (!analyticsData) {
      const budgetBase = Math.max(sceneCount * 350000, 1500000);
      const uniqueLocations = [...new Set(scenes?.map((s: { location: string }) => s.location) || [])];

      analyticsData = {
        budget_estimate: {
          total: budgetBase,
          categories: [
            { name: "Cast & Talent", amount: Math.round(budgetBase * 0.32) },
            { name: "Crew & Production", amount: Math.round(budgetBase * 0.24) },
            { name: "Locations & Permits", amount: Math.round(budgetBase * 0.14) },
            { name: "Visual Effects", amount: Math.round(budgetBase * 0.14) },
            { name: "Post-Production", amount: Math.round(budgetBase * 0.1) },
            { name: "Marketing & Distribution", amount: Math.round(budgetBase * 0.06) },
          ],
        },
        schedule: {
          days: Array.from({ length: Math.min(sceneCount * 3, 30) }, (_, i) => ({
            day: i + 1,
            activity: i < 3
              ? ["Pre-production meeting", "Script breakdown & storyboards", "Location scouting"][i]
              : i >= sceneCount * 3 - 3
                ? ["Sound design & mixing", "Color grading", "Final cut & delivery"][i - (sceneCount * 3 - 3)]
                : `Filming - Scene ${Math.ceil((i - 2) / 3)}: ${scenes?.[Math.min(Math.ceil((i - 2) / 3) - 1, sceneCount - 1)]?.location || "TBD"}`,
            location: i < 3 ? "Studio Office" : uniqueLocations[Math.min(Math.ceil((i - 2) / 3) - 1, uniqueLocations.length - 1)] || "Location TBD",
          })),
        },
        locations: uniqueLocations.slice(0, 6).map((loc) => ({
          name: loc,
          type: loc.toLowerCase().includes("indoor") || loc.toLowerCase().includes("office") || loc.toLowerCase().includes("studio") ? "Interior" : "Exterior",
          country: "USA",
        })),
        success_prediction: {
          audience_score: 68 + Math.round(Math.random() * 20),
          market_fit: `Strong appeal within the ${genre.toLowerCase()} genre, targeting audiences who appreciate character-driven narratives with visual storytelling. The ${sceneCount}-scene structure provides a tight, focused narrative that should resonate with the 18-35 demographic.`,
          demographics: ["18-24", "25-34", "35-44"],
          comparable_films: genre === "Sci-Fi" ? ["Arrival", "Blade Runner 2049", "Ex Machina"]
            : genre === "Horror" ? ["Get Out", "A Quiet Place", "Hereditary"]
            : genre === "Comedy" ? ["The Grand Budapest Hotel", "Knives Out", "Parasite"]
            : genre === "Action" ? ["Mad Max: Fury Road", "John Wick", "Mission Impossible"]
            : ["Arrival", "Blade Runner 2049", "Interstellar"],
        },
        sentiment_score: 65 + Math.round(Math.random() * 25),
        market_reach: "Wide domestic release with international festival circuit potential",
      };
    }

    // Save to productions table
    const { error: insertError } = await supabase
      .from("productions")
      .insert({
        project_id: projectId,
        user_id: user.id,
        budget_estimate: analyticsData.budget_estimate,
        schedule: analyticsData.schedule,
        locations: analyticsData.locations,
        success_prediction: analyticsData.success_prediction,
        sentiment_score: analyticsData.sentiment_score,
        market_reach: analyticsData.market_reach,
      });

    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "analytics", updated_at: new Date().toISOString() }).eq("id", projectId);

    return new Response(
      JSON.stringify({ message: "Analytics generated successfully" }),
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
