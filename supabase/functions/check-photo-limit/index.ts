import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  premium: 20,
  business: Infinity,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { memorial_id, user_id } = await req.json();
    if (!memorial_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "memorial_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user plan from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user_id)
      .maybeSingle();

    const plan = profile?.plan || "free";
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    // Count gallery images
    const { count: galleryCount } = await supabase
      .from("memorial_images")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorial_id);

    // Check if memorial has a main image
    const { data: memorial } = await supabase
      .from("memorials")
      .select("image_url")
      .eq("id", memorial_id)
      .maybeSingle();

    const mainImageCount = memorial?.image_url ? 1 : 0;
    const current = (galleryCount || 0) + mainImageCount;
    const allowed = limit === Infinity || current < limit;

    return new Response(
      JSON.stringify({ allowed, current, limit: limit === Infinity ? -1 : limit }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
