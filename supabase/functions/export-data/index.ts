import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await anonClient.auth.getUser(
      token,
    );
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const { data: memorials } = await serviceClient
      .from("memorials")
      .select("*")
      .eq("user_id", userId);

    const memorialIds = (memorials || []).map((m: any) => m.id);

    let tributes: any[] = [];
    if (memorialIds.length > 0) {
      const { data: tributeRows } = await serviceClient
        .from("tributes")
        .select("*")
        .in("memorial_id", memorialIds);
      tributes = tributeRows || [];
    }

    const exportPayload = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile || null,
      memorials: memorials || [],
      tributes,
    };

    const body = JSON.stringify(exportPayload, null, 2);

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="my-data.json"',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

