import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "order_status" | "price_drop";
  email: string;
  data: {
    orderId?: string;
    orderStatus?: string;
    productName?: string;
    oldPrice?: number;
    newPrice?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { type, email, data }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    if (type === "order_status") {
      subject = `Order Update - Your order is now ${data.orderStatus}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Order Status Update</h1>
          <p>Hello,</p>
          <p>Your order <strong>#${data.orderId?.slice(0, 8).toUpperCase()}</strong> has been updated.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">
              Status: <strong style="color: #4CAF50;">${data.orderStatus?.toUpperCase()}</strong>
            </p>
          </div>
          <p>Thank you for shopping with TrendyCart!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated email from TrendyCart.</p>
        </div>
      `;
    } else if (type === "price_drop") {
      const savings = ((data.oldPrice || 0) - (data.newPrice || 0)).toFixed(2);
      subject = `Price Drop Alert - ${data.productName} is now on sale!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Price Drop Alert!</h1>
          <p>Great news! An item on your wishlist just got cheaper!</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">${data.productName}</h2>
            <p style="margin: 0;">
              <span style="text-decoration: line-through; color: #999;">$${data.oldPrice}</span>
              <span style="color: #e53935; font-size: 24px; font-weight: bold; margin-left: 10px;">$${data.newPrice}</span>
            </p>
            <p style="color: #4CAF50; margin: 10px 0 0 0;">You save: $${savings}!</p>
          </div>
          <p>Don't miss out - grab it before it's gone!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">You received this email because this item is on your TrendyCart wishlist.</p>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TrendyCart <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);