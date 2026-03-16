import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback prices (USD) when store_items has no matching row
const FALLBACK_PRICES: Record<string, Record<string, number>> = {
  standard: { Candle: 2, Flowers: 2, candle: 2, flowers: 2 },
  premium: { "Eternal Candle": 5, "eternal candle": 5 },
};

function getFallbackPrice(tier: string, itemType: string): number | null {
  const normalized = (itemType || "Candle").trim();
  const byTier = FALLBACK_PRICES[tier];
  if (!byTier) return null;
  return byTier[normalized] ?? byTier[normalized.toLowerCase()] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    console.error("STRIPE_SECRET_KEY is not set in Edge Function secrets");
    return new Response(
      JSON.stringify({ error: "Payment is not configured. Please set STRIPE_SECRET_KEY in Supabase." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const stripe: any = new Stripe(stripeSecretKey, { apiVersion: "2025-04-30.basil" });

  try {
    const { memorial_id, sender_name, sender_email, message, item_type, tier, return_url } = await req.json();

    if (!memorial_id || !tier) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tier === "base") {
      return new Response(JSON.stringify({ error: "Free tributes do not use checkout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let price: number | null = null;
    const { data: storeItem, error: storeError } = await supabaseAdmin
      .from("store_items")
      .select("price, name")
      .eq("category", "tribute")
      .eq("tier", tier)
      .eq("is_active", true)
      .limit(10);

    if (!storeError && storeItem?.length) {
      const nameMatch = (item_type || "Candle").trim();
      const found = storeItem.find(
        (row: any) => row.name === nameMatch || row.name?.toLowerCase() === nameMatch.toLowerCase(),
      );
      if (found && Number(found.price) > 0) price = Number(found.price);
    }
    if (price == null) {
      const fallback = getFallbackPrice(tier, item_type || "Candle");
      if (fallback != null) price = fallback;
    }
    if (price == null || price <= 0) {
      return new Response(JSON.stringify({ error: "Invalid item or tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tribute, error: tributeError } = await supabaseAdmin
      .from("tributes")
      .insert({
        memorial_id,
        sender_name: sender_name || "Anonymous",
        sender_email: sender_email || null,
        message: message || "",
        item_type: item_type || "candle",
        tier,
        is_paid: false,
        status: "pending_payment",
      })
      .select("id")
      .single();

    if (tributeError) {
      console.error("Tribute insert error:", tributeError);
      return new Response(JSON.stringify({ error: "Failed to create tribute" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${item_type || "Tribute"} – ${tier}`,
              description: `Virtual tribute for memorial`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        tribute_id: tribute.id,
        memorial_id,
      },
      customer_email: sender_email || undefined,
      success_url: `${return_url}?payment=success&tribute_id=${tribute.id}`,
      cancel_url: `${return_url}?payment=cancelled`,
    });

    await supabaseAdmin
      .from("tributes")
      .update({ stripe_session_id: session.id })
      .eq("id", tribute.id);

    return new Response(JSON.stringify({ url: session.url, tribute_id: tribute.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
