import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    customerName?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data }: NotificationRequest = await req.json();
    console.log("Received notification request:", { type, email, data });

    let subject = "";
    let html = "";

    if (type === "order_status") {
      const statusEmoji = {
        pending: "⏳",
        processing: "🔄",
        shipped: "📦",
        delivered: "✅",
        completed: "🎉",
        cancelled: "❌",
      }[data.orderStatus || "pending"] || "📋";

      subject = `${statusEmoji} Order Update - Your order is now ${data.orderStatus}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">TrendyCart</h1>
            <p style="color: #666; margin: 5px 0;">Your Order Status Update</p>
          </div>
          
          <p style="color: #333;">Hello${data.customerName ? ` ${data.customerName}` : ''},</p>
          <p style="color: #333;">Your order <strong>#${data.orderId?.slice(0, 8).toUpperCase()}</strong> has been updated.</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">Current Status</p>
            <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: white;">
              ${statusEmoji} ${data.orderStatus?.toUpperCase()}
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">What's next?</h3>
            ${data.orderStatus === 'shipped' ? '<p style="color: #666; margin: 0;">Your package is on its way! You\'ll receive tracking information soon.</p>' : ''}
            ${data.orderStatus === 'delivered' ? '<p style="color: #666; margin: 0;">Your package has been delivered. Enjoy your purchase!</p>' : ''}
            ${data.orderStatus === 'processing' ? '<p style="color: #666; margin: 0;">We\'re preparing your order for shipment.</p>' : ''}
            ${data.orderStatus === 'completed' ? '<p style="color: #666; margin: 0;">Thank you for shopping with us! We hope you love your purchase.</p>' : ''}
            ${data.orderStatus === 'cancelled' ? '<p style="color: #666; margin: 0;">Your order has been cancelled. If you have questions, please contact support.</p>' : ''}
            ${data.orderStatus === 'pending' ? '<p style="color: #666; margin: 0;">Your order is being reviewed and will be processed shortly.</p>' : ''}
          </div>
          
          <p style="color: #333;">Thank you for shopping with TrendyCart!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from TrendyCart. Please do not reply to this email.
          </p>
        </div>
      `;
    } else if (type === "price_drop") {
      const savings = ((data.oldPrice || 0) - (data.newPrice || 0)).toFixed(2);
      subject = `🎉 Price Drop Alert - ${data.productName} is now on sale!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">TrendyCart</h1>
            <p style="color: #666; margin: 5px 0;">Price Drop Alert!</p>
          </div>
          
          <h1 style="color: #333; text-align: center;">🎉 Great news!</h1>
          <p style="color: #333; text-align: center;">An item on your wishlist just got cheaper!</p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <h2 style="margin: 0 0 15px 0; color: #333;">${data.productName}</h2>
            <p style="margin: 0;">
              <span style="text-decoration: line-through; color: #999; font-size: 18px;">$${data.oldPrice}</span>
              <span style="color: #e53935; font-size: 32px; font-weight: bold; margin-left: 15px;">$${data.newPrice}</span>
            </p>
            <p style="color: #4CAF50; margin: 15px 0 0 0; font-size: 18px; font-weight: bold;">You save: $${savings}!</p>
          </div>
          
          <p style="color: #333; text-align: center;">Don't miss out - grab it before it's gone!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            You received this email because this item is on your TrendyCart wishlist.
          </p>
        </div>
      `;
    }

    console.log("Sending email to:", email);
    const emailResponse = await resend.emails.send({
      from: "TrendyCart <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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