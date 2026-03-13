import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-04-30.basil" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { memorial_id, sender_name, sender_email, message, item_type, tier, return_url } = await req.json();

    if (!memorial_id || !tier) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up canonical price from store_items (server-side validation)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: storeItem, error: storeError } = await supabaseAdmin
      .from("store_items")
      .select("price, name")
      .eq("tier", tier)
      .eq("name", item_type || "Candle")
      .eq("is_active", true)
      .single();

    if (storeError || !storeItem || storeItem.price <= 0) {
      return new Response(JSON.stringify({ error: "Invalid item or tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = storeItem.price;

    // Create a pending tribute in Supabase

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

    // Create Stripe Checkout session
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

    // Save stripe session id on tribute
    await supabaseAdmin
      .from("tributes")
      .update({ stripe_session_id: session.id })
      .eq("id", tribute.id);

    return new Response(JSON.stringify({ url: session.url, tribute_id: tribute.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
