import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Send to all three email addresses
    const recipients = [
      "trendycart96@gmail.com",
      "ezeonyekasinachifranklin@gmail.com",
      "ezeonyekasinachi@gmail.com",
    ];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TrendyCart Contact <onboarding@resend.dev>",
        to: recipients,
        subject: `[TrendyCart Contact] ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">New Contact Form Submission</h1>
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">You have received a new message from your website</p>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Contact Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Name:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                        <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subject:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${subject}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 20px;">
                  <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Message</h2>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                  <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Reply to ${name}</a>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">This email was sent from the TrendyCart contact form</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Contact email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
