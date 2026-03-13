import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const url = new URL(req.url);
    // Extract memorial ID from query param: ?id=xxx
    const memorialId = url.searchParams.get("id");

    if (!memorialId) {
      return new Response("Missing memorial id", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: memorial, error } = await supabase
      .from("memorials")
      .select("first_name, last_name, birth_date, death_date, image_url, bio, type")
      .eq("id", memorialId)
      .eq("visibility", "public")
      .eq("is_draft", false)
      .single();

    if (error || !memorial) {
      return new Response("Memorial not found", { status: 404 });
    }

    const fullName = `${memorial.first_name} ${memorial.last_name}`.trim();
    const lifespan = [memorial.birth_date, memorial.death_date]
      .filter(Boolean)
      .map((d) => d!.substring(0, 4))
      .join(" – ");
    const title = lifespan ? `${fullName} (${lifespan})` : fullName;
    const description = memorial.bio
      ? memorial.bio.substring(0, 160)
      : `Remembering ${fullName}. Visit their memorial on Eternal Memory.`;
    const imageUrl = memorial.image_url || "https://forever-flame-tributes.lovable.app/placeholder.svg";
    const pageUrl = `https://forever-flame-tributes.lovable.app/memorial/${memorialId}`;
    const siteName = "Eternal Memory";

    const userAgent = req.headers.get("user-agent") ?? "";
    const isCrawler = isSocialCrawler(userAgent);

    if (!isCrawler) {
      return Response.redirect(pageUrl, 302);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} – ${siteName}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${escapeHtml(title)} – ${siteName}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:site_name" content="${siteName}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} – ${siteName}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <link rel="canonical" href="${escapeHtml(pageUrl)}">
</head>
<body>
  <p><a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a> – ${siteName}</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("og-memorial error:", err);
    return new Response("Internal error", { status: 500 });
  }
});

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("twitterbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("whatsapp") ||
    ua.includes("telegrambot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("pinterest") ||
    ua.includes("googlebot") ||
    ua.includes("bingbot")
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
