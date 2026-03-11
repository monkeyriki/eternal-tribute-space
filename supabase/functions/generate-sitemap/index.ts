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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all public, non-draft memorials
    const { data: memorials, error } = await supabase
      .from("memorials")
      .select("id, updated_at")
      .eq("visibility", "public")
      .eq("is_draft", false)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Use the project URL or a custom domain
    const siteUrl = Deno.env.get("SITE_URL") || "https://memoriaeterna.it";

    const urls = (memorials || []).map((m: any) => {
      const lastmod = new Date(m.updated_at).toISOString().split("T")[0];
      return `  <url>
    <loc>${siteUrl}/memorial/${m.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add static pages
    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "weekly" },
      { path: "/directory/human", priority: "0.9", changefreq: "daily" },
      { path: "/directory/pet", priority: "0.9", changefreq: "daily" },
      { path: "/privacy", priority: "0.3", changefreq: "yearly" },
      { path: "/cookie-policy", priority: "0.3", changefreq: "yearly" },
    ];

    const staticUrls = staticPages.map(
      (p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});
