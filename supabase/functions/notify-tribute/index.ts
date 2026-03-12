import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { tribute_id, memorial_id, sender_name, message, tier, is_flagged, is_pending_approval } =
      await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get memorial info and owner email
    const { data: memorial, error: memError } = await supabase
      .from("memorials")
      .select("first_name, last_name, user_id")
      .eq("id", memorial_id)
      .single();

    if (memError || !memorial) {
      return new Response(JSON.stringify({ error: "Memorial not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner's email from auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(
      memorial.user_id
    );
    const ownerEmail = userData?.user?.email;

    if (!ownerEmail) {
      return new Response(
        JSON.stringify({ success: true, message: "No owner email found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const memorialName = `${memorial.first_name} ${memorial.last_name}`.trim();
    const statusText = is_flagged
      ? "⚠️ Un tributo è stato segnalato e richiede la tua approvazione"
      : "❤️ Un nuovo tributo è stato pubblicato";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Source Sans 3', Arial, sans-serif; background: #f8f6f3; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e8e3db; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px;">🕊️</span>
            <h1 style="font-family: Georgia, serif; font-size: 24px; color: #2c2c2c; margin: 8px 0;">
              Memoria Eterna
            </h1>
          </div>
          
          <p style="color: #2c2c2c; font-size: 16px; margin-bottom: 16px;">
            ${statusText} sul memoriale di <strong>${memorialName}</strong>.
          </p>
          
          <div style="background: #f8f6f3; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
              <strong>Da:</strong> ${sender_name}
            </p>
            ${message ? `<p style="margin: 0; color: #2c2c2c; font-size: 14px;">"${message}"</p>` : ""}
            <p style="margin: 8px 0 0; color: #999; font-size: 12px;">
              Tipo: ${tier}
            </p>
          </div>
          
          ${is_flagged
            ? `<p style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 12px; color: #856404; font-size: 13px;">
                Questo tributo è stato segnalato dal filtro automatico. Accedi al pannello admin per approvarlo o eliminarlo.
              </p>`
            : ""
          }
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #e8e3db; padding-top: 16px;">
            Memoria Eterna — Un ricordo che dura per sempre
          </p>
        </div>
      </body>
      </html>
    `;

    const subject = `${statusText} – ${memorialName}`;
    let emailSent = false;

    if (RESEND_API_KEY) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Memoria Eterna <onboarding@resend.dev>",
          to: [ownerEmail],
          subject,
          html: emailHtml,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
        console.log(`[notify-tribute] Email sent to ${ownerEmail}`);
      } else {
        const err = await resendRes.text();
        console.error(`[notify-tribute] Resend error: ${err}`);
      }
    } else {
      console.log(`[notify-tribute] RESEND_API_KEY not set, skipping email`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        owner_email: ownerEmail,
        email_sent: emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[notify-tribute] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
