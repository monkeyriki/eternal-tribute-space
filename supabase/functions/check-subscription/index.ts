import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripe: any = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-04-30.basil" });

// Map Stripe product IDs to plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U71fHmvktOBUbq": "premium",
  "prod_U71guBVwU3pjGw": "premium",
  "prod_U71i7jaxAId6re": "business",
  "prod_U71rbrWJHacqKi": "business",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");

    const user = userData.user;

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const productId = sub.items.data[0].price.product as string;
      const plan = PRODUCT_TO_PLAN[productId] || "premium";
      const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

      return new Response(JSON.stringify({
        subscribed: true,
        plan,
        subscription_end: subscriptionEnd,
        subscription_id: sub.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for lifetime (one-time) payments
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 20,
    });

    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        // Check line items for lifetime product
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        for (const item of lineItems.data) {
          const productId = item.price?.product as string;
          if (productId && PRODUCT_TO_PLAN[productId]) {
            return new Response(JSON.stringify({
              subscribed: true,
              plan: PRODUCT_TO_PLAN[productId],
              lifetime: true,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: false,
      plan: "free",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("check-subscription error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
