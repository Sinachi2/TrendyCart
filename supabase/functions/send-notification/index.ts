import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "order_status" | "price_drop" | "low_stock" | "payment_verified" | "payment_submitted";
  email?: string;
  threshold?: number;
  data?: {
    orderId?: string;
    orderStatus?: string;
    productName?: string;
    oldPrice?: number;
    newPrice?: number;
    customerName?: string;
    status?: string;
    paymentMethod?: string;
    amount?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data, threshold = 10 }: NotificationRequest = await req.json();
    console.log("Received notification request:", { type, email, data });

    // Handle low stock alerts
    if (type === "low_stock") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get low stock products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock_quantity, category")
        .lte("stock_quantity", threshold)
        .order("stock_quantity", { ascending: true });

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No low stock products found" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get admin emails
      const { data: adminRoles, error: adminError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminError) throw adminError;

      const adminIds = adminRoles?.map((r) => r.user_id) || [];

      if (adminIds.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "No admin users found" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get admin profiles with emails
      const { data: adminProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .in("id", adminIds);

      if (profileError) throw profileError;

      const adminEmails = adminProfiles?.map((p) => p.email).filter(Boolean) || [];

      if (adminEmails.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "No admin emails found" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Build email HTML
      const productRows = products
        .map(
          (p) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px;">${p.name}</td>
            <td style="padding: 12px;">${p.category}</td>
            <td style="padding: 12px; text-align: center; color: ${p.stock_quantity === 0 ? '#ef4444' : p.stock_quantity <= 3 ? '#f97316' : '#eab308'}; font-weight: bold;">
              ${p.stock_quantity}
            </td>
          </tr>
        `
        )
        .join("");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ec4899, #f97316); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">⚠️ Low Stock Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">TrendyCart Inventory Update</p>
          </div>
          <div style="padding: 30px; background: #fff; border: 1px solid #eee; border-top: none;">
            <p style="color: #374151; font-size: 16px;">
              The following ${products.length} product(s) are running low on stock (threshold: ${threshold} units):
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left;">Product</th>
                  <th style="padding: 12px; text-align: left;">Category</th>
                  <th style="padding: 12px; text-align: center;">Stock</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://trendycart.lovable.app/dashboard/products" 
                 style="background: linear-gradient(135deg, #ec4899, #f97316); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Manage Inventory
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated alert from TrendyCart.</p>
          </div>
        </div>
      `;

      // Send email to all admins
      for (const adminEmail of adminEmails) {
        await resend.emails.send({
          from: "TrendyCart <onboarding@resend.dev>",
          to: [adminEmail],
          subject: `⚠️ Low Stock Alert: ${products.length} product(s) need attention`,
          html: emailHtml,
        });
      }

      console.log(`Low stock alert sent to ${adminEmails.length} admin(s) for ${products.length} product(s)`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Alert sent to ${adminEmails.length} admin(s)`,
          productCount: products.length 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle other notification types
    let subject = "";
    let html = "";

    if (type === "payment_verified" && email) {
      subject = `✅ Payment Verified - Your order is being processed!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">TrendyCart</h1>
            <p style="color: #666; margin: 5px 0;">Payment Confirmation</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 48px;">✅</p>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: white;">Payment Verified!</p>
          </div>
          
          <p style="color: #333;">Hello${data?.customerName ? ` ${data.customerName}` : ''},</p>
          <p style="color: #333;">Great news! Your payment for order <strong>#${data?.orderId?.slice(0, 8).toUpperCase()}</strong> has been verified.</p>
          <p style="color: #333;">We're now processing your order and will notify you when it ships.</p>
          
          <p style="color: #333;">Thank you for shopping with TrendyCart!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from TrendyCart.
          </p>
        </div>
      `;
    } else if (type === "payment_submitted" && email) {
      subject = `📝 Payment Proof Received - We're reviewing your payment`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">TrendyCart</h1>
            <p style="color: #666; margin: 5px 0;">Payment Confirmation</p>
          </div>
          
          <p style="color: #333;">Hello${data?.customerName ? ` ${data.customerName}` : ''},</p>
          <p style="color: #333;">We've received your payment proof for order <strong>#${data?.orderId?.slice(0, 8).toUpperCase()}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Payment Method:</strong> ${data?.paymentMethod || 'N/A'}</p>
            <p style="margin: 10px 0 0 0; color: #333;"><strong>Amount:</strong> $${data?.amount?.toFixed(2) || 'N/A'}</p>
          </div>
          
          <p style="color: #333;">Our team is reviewing your payment and you'll receive a confirmation email once verified (usually within 24 hours).</p>
          
          <p style="color: #333;">Thank you for shopping with TrendyCart!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from TrendyCart.
          </p>
        </div>
      `;
    } else if (type === "order_status" && email) {
      const statusEmoji = {
        pending: "⏳",
        processing: "🔄",
        shipped: "📦",
        delivered: "✅",
        completed: "🎉",
        cancelled: "❌",
      }[data?.orderStatus || "pending"] || "📋";

      subject = `${statusEmoji} Order Update - Your order is now ${data?.orderStatus}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">TrendyCart</h1>
            <p style="color: #666; margin: 5px 0;">Your Order Status Update</p>
          </div>
          
          <p style="color: #333;">Hello${data?.customerName ? ` ${data.customerName}` : ''},</p>
          <p style="color: #333;">Your order <strong>#${data?.orderId?.slice(0, 8).toUpperCase()}</strong> has been updated.</p>
          
          <div style="background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">Current Status</p>
            <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: white;">
              ${statusEmoji} ${data?.orderStatus?.toUpperCase()}
            </p>
          </div>
          
          <p style="color: #333;">Thank you for shopping with TrendyCart!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from TrendyCart.
          </p>
        </div>
      `;
    } else if (type === "price_drop" && email) {
      const savings = ((data?.oldPrice || 0) - (data?.newPrice || 0)).toFixed(2);
      subject = `🎉 Price Drop Alert - ${data?.productName} is now on sale!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">🎉 Great news!</h1>
          <p style="color: #333; text-align: center;">An item on your wishlist just got cheaper!</p>
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <h2 style="margin: 0 0 15px 0; color: #333;">${data?.productName}</h2>
            <p style="margin: 0;">
              <span style="text-decoration: line-through; color: #999;">$${data?.oldPrice}</span>
              <span style="color: #e53935; font-size: 32px; font-weight: bold; margin-left: 15px;">$${data?.newPrice}</span>
            </p>
            <p style="color: #4CAF50; margin: 15px 0 0 0; font-weight: bold;">You save: $${savings}!</p>
          </div>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type or missing email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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