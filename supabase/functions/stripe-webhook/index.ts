import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const stripe: any = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-04-30.basil" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: any;

  if (!endpointSecret || !signature) {
    console.error("CRITICAL: Webhook secret or signature missing");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
  }

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const tributeId = session.metadata?.tribute_id;
    const memorialId = session.metadata?.memorial_id;
    const userId = session.metadata?.supabase_user_id;

    if (tributeId) {
      // === TRIBUTE PAYMENT ===
      const { data: tributeRow } = await supabase
        .from("tributes")
        .select("id, memorial_id, sender_name, sender_email, tier, item_type, message")
        .eq("id", tributeId)
        .single();

      const isPremiumTribute = tributeRow?.tier === "premium";
      const expiresAt = isPremiumTribute
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from("tributes")
        .update({
          is_paid: true,
          status: "approved",
          stripe_session_id: session.id,
          ...(expiresAt ? { expires_at: expiresAt } : {}),
        })
        .eq("id", tributeId);

      if (updateError) console.error("Failed to update tribute:", updateError);

      const amount = (session.amount_total || 0) / 100;
      await supabase.from("transactions").insert({
        type: "tribute",
        amount,
        tribute_id: tributeId,
        memorial_id: memorialId || null,
      });

      console.log(`Tribute ${tributeId} marked as paid ($${amount})`);

      // === Notify memorial owner after paid tribute ===
      try {
        const effectiveMemorialId = tributeRow?.memorial_id || memorialId;
        if (RESEND_API_KEY && effectiveMemorialId && tributeRow) {
          const { data: memorial, error: memorialError } = await supabase
            .from("memorials")
            .select("first_name, last_name, user_id")
            .eq("id", effectiveMemorialId)
            .single();

          if (memorialError) {
            console.error("Failed to fetch memorial for owner notification:", memorialError);
          } else if (memorial) {
            let ownerEmail: string | null = null;
            try {
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
                (memorial as any).user_id
              );
              if (authError) {
                console.error("Failed to fetch owner for tribute email:", authError);
              } else {
                ownerEmail = authUser?.user?.email ?? null;
              }
            } catch (ownerErr) {
              console.error("Failed to fetch owner for tribute email:", ownerErr);
            }

            const memorialName = `${(memorial as any).first_name} ${(memorial as any).last_name || ""}`.trim();

            if (ownerEmail) {
              const payerName = tributeRow.sender_name || "Anonimo";
              const tierLabel =
                tributeRow.tier === "premium"
                  ? "Tributo Premium"
                  : tributeRow.tier === "standard"
                  ? "Tributo Standard"
                  : "Tributo";

              const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Nuovo tributo ricevuto ❤️</h2>
          <p style="color: #555; line-height: 1.6;">
            Hai ricevuto un nuovo tributo sul memoriale di <strong>${memorialName}</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px 0; color: #888;">Da</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Tipo</td>
              <td style="padding: 8px 0; text-align: right;">${tierLabel}${
                tributeRow.item_type ? ` — ${tributeRow.item_type}` : ""
              }</td>
            </tr>
            ${
              tributeRow.message
                ? `<tr>
              <td style="padding: 8px 0; color: #888; vertical-align: top;">Messaggio</td>
              <td style="padding: 8px 0; text-align: right; font-style: italic;">"${tributeRow.message}"</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 8px 0; color: #888;">Importo</td>
              <td style="padding: 8px 0; font-weight: 600; text-align: right;">€${amount.toFixed(2)}</td>
            </tr>
          </table>
          <p style="color: #555; font-size: 14px;">
            Puoi gestire i tributi e il libro degli ospiti accedendo al tuo memoriale su Eternal Memory.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Eternal Memory — Ricordi che durano per sempre</p>
        </div>
        `;

              try {
                const resendRes = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "Eternal Memory <onboarding@resend.dev>",
                    to: [ownerEmail],
                    subject: `Nuovo tributo ricevuto — ${memorialName}`,
                    html: emailHtml,
                  }),
                });

                if (!resendRes.ok) {
                  const errText = await resendRes.text();
                  console.error("[stripe-webhook] Failed to send owner tribute email:", errText);
                } else {
                  console.log(`[stripe-webhook] Owner tribute email sent to ${ownerEmail}`);
                }
              } catch (emailErr) {
                console.error("[stripe-webhook] Error sending owner tribute email:", emailErr);
              }
            }

            // === Send receipt to tribute purchaser after paid tribute ===
            if (tributeRow.sender_email) {
              const memorialNameForReceipt = memorialName || "Memoriale";
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const functionUrl = `${supabaseUrl}/functions/v1/send-receipt`;

                const receiptRes = await fetch(functionUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
                  },
                  body: JSON.stringify({
                    sender_email: tributeRow.sender_email,
                    sender_name: tributeRow.sender_name || "Anonimo",
                    memorial_name: memorialNameForReceipt,
                    item_type: tributeRow.item_type || "Tributo",
                    tier: tributeRow.tier,
                    price: amount,
                    message: tributeRow.message || "",
                  }),
                });

                if (!receiptRes.ok) {
                  const errText = await receiptRes.text();
                  console.error("[stripe-webhook] Failed to call send-receipt function:", errText);
                } else {
                  console.log(`[stripe-webhook] Receipt requested for ${tributeRow.sender_email}`);
                }
              } catch (receiptErr) {
                console.error("[stripe-webhook] Error invoking send-receipt function:", receiptErr);
              }
            }
          }
        }
      } catch (notifyErr) {
        console.error("[stripe-webhook] Error in tribute notification/receipt flow:", notifyErr);
      }
    } else if (userId) {
      // === PLAN UPGRADE ===
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      let planName = "premium";

      for (const item of lineItems.data) {
        const productId = item.price?.product as string;
        if (productId && PRODUCT_TO_PLAN[productId]) {
          planName = PRODUCT_TO_PLAN[productId];
        }
      }

      const { error: memError } = await supabase
        .from("memorials")
        .update({ plan: planName })
        .eq("user_id", userId);

      if (memError) console.error("Failed to update memorials plan:", memError);

      const amount = (session.amount_total || 0) / 100;
      await supabase.from("transactions").insert({
        type: "plan_upgrade",
        amount,
        user_id: userId,
      });

      console.log(`User ${userId} upgraded to ${planName} ($${amount})`);
    }
  }

  // === B2B RENEWAL CONFIRMATION EMAIL ===
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as any;
    if (invoice.billing_reason === "subscription_cycle" && invoice.customer_email) {
      const amount = (invoice.amount_paid || 0) / 100;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const nextDate = periodEnd
        ? new Date(periodEnd * 1000).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
        : "N/A";

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Rinnovo abbonamento confermato ✅</h2>
          <p style="color: #555; line-height: 1.6;">
            Il tuo abbonamento B2B su <strong>Eternal Memory</strong> è stato rinnovato con successo.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr><td style="padding: 8px 0; color: #888;">Importo</td><td style="padding: 8px 0; font-weight: 600;">€${amount.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Prossimo rinnovo</td><td style="padding: 8px 0; font-weight: 600;">${nextDate}</td></tr>
          </table>
          <p style="color: #555; font-size: 14px;">
            Puoi gestire il tuo abbonamento dalla <a href="https://forever-flame-tributes.lovable.app/b2b" style="color: #6366f1;">dashboard B2B</a>.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Eternal Memory — Ricordi che durano per sempre</p>
        </div>
      `;

      if (RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Eternal Memory <onboarding@resend.dev>",
              to: [invoice.customer_email],
              subject: "Rinnovo abbonamento confermato — Eternal Memory",
              html: emailHtml,
            }),
          });
          console.log(`Renewal confirmation email sent to ${invoice.customer_email}`);
        } catch (emailErr) {
          console.error("Failed to send renewal email:", emailErr);
        }
      }
    }
  }

  // === SUBSCRIPTION EXPIRING SOON (upcoming invoice) ===
  if (event.type === "invoice.upcoming") {
    const invoice = event.data.object as any;
    if (invoice.customer_email) {
      const amount = (invoice.amount_due || 0) / 100;
      const dueDate = invoice.due_date
        ? new Date(invoice.due_date * 1000).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
        : "tra pochi giorni";

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Promemoria: rinnovo imminente 🔔</h2>
          <p style="color: #555; line-height: 1.6;">
            Il tuo abbonamento B2B su <strong>Eternal Memory</strong> si rinnoverà automaticamente a breve.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr><td style="padding: 8px 0; color: #888;">Importo</td><td style="padding: 8px 0; font-weight: 600;">€${amount.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Data rinnovo</td><td style="padding: 8px 0; font-weight: 600;">${dueDate}</td></tr>
          </table>
          <p style="color: #555; font-size: 14px;">
            Se non desideri rinnovare, puoi annullare dalla <a href="https://forever-flame-tributes.lovable.app/b2b" style="color: #6366f1;">dashboard B2B</a> prima della data di rinnovo.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Eternal Memory — Ricordi che durano per sempre</p>
        </div>
      `;

      if (RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Eternal Memory <onboarding@resend.dev>",
              to: [invoice.customer_email],
              subject: "Promemoria rinnovo abbonamento — Eternal Memory",
              html: emailHtml,
            }),
          });
          console.log(`Renewal reminder email sent to ${invoice.customer_email}`);
        } catch (emailErr) {
          console.error("Failed to send renewal reminder:", emailErr);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
