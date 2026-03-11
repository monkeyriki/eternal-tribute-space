import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sender_email, sender_name, memorial_name, item_type, tier, price, message } =
      await req.json();

    if (!sender_email) {
      return new Response(
        JSON.stringify({ success: true, message: "No email provided, skipping receipt" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[send-receipt] RESEND_API_KEY not set");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceText = price > 0 ? `€${Number(price).toFixed(2)}` : "Gratuito";
    const now = new Date();
    const dateStr = now.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Source Sans 3', Arial, sans-serif; background: #f8f6f3; padding: 40px 20px;">
        <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e8e3db; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">🕊️</span>
            <h1 style="font-family: Georgia, serif; font-size: 22px; color: #2c2c2c; margin: 8px 0;">
              Ricevuta del tuo tributo
            </h1>
            <p style="color: #999; font-size: 12px; margin: 0;">Memoria Eterna</p>
          </div>

          <p style="color: #2c2c2c; font-size: 15px; margin-bottom: 20px;">
            Ciao <strong>${sender_name}</strong>, grazie per il tuo tributo in memoria di <strong>${memorial_name}</strong>.
          </p>

          <div style="background: #f8f6f3; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 14px; color: #2c2c2c;" cellpadding="4">
              <tr>
                <td style="color: #888;">Tipo tributo:</td>
                <td style="text-align: right; font-weight: 600;">${item_type} (${tier})</td>
              </tr>
              <tr>
                <td style="color: #888;">Importo:</td>
                <td style="text-align: right; font-weight: 600;">${priceText}</td>
              </tr>
              <tr>
                <td style="color: #888;">Data:</td>
                <td style="text-align: right;">${dateStr}</td>
              </tr>
              ${message ? `
              <tr>
                <td style="color: #888; vertical-align: top;">Messaggio:</td>
                <td style="text-align: right; font-style: italic;">"${message}"</td>
              </tr>` : ""}
            </table>
          </div>

          <p style="color: #666; font-size: 13px; line-height: 1.5;">
            Il tuo gesto contribuisce a mantenere vivo il ricordo. 
            ${price > 0 ? "Questa email serve come ricevuta del tuo acquisto." : ""}
          </p>

          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #e8e3db; padding-top: 16px;">
            Memoria Eterna — Un ricordo che dura per sempre<br/>
            <span style="font-size: 10px;">Questa è un'email automatica, non rispondere.</span>
          </p>
        </div>
      </body>
      </html>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Memoria Eterna <onboarding@resend.dev>",
        to: [sender_email],
        subject: `Ricevuta tributo — ${memorial_name}`,
        html: emailHtml,
      }),
    });

    if (resendRes.ok) {
      console.log(`[send-receipt] Receipt sent to ${sender_email}`);
      return new Response(
        JSON.stringify({ success: true, email_sent: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const err = await resendRes.text();
      console.error(`[send-receipt] Resend error: ${err}`);
      return new Response(
        JSON.stringify({ success: false, error: err }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[send-receipt] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
