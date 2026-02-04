import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface OrderEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerName, customerEmail, items, totalAmount, paymentMethod }: OrderEmailRequest = await req.json();

    if (!orderId || !customerEmail || !items || !totalAmount) {
      throw new Error("Missing required fields");
    }

    const recipients = [
      "trendycart96@gmail.com",
      "ezeonyekasinachifranklin@gmail.com",
      "ezeonyekasinachi@gmail.com",
    ];

    const paymentMethodLabel = paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cryptocurrency (USDT)";

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.product_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TrendyCart Orders <onboarding@resend.dev>",
        to: recipients,
        subject: `[New Order] #${orderId.slice(0, 8).toUpperCase()} - $${totalAmount.toFixed(2)}`,
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
                  <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 24px;">🛒 New Order Received</h1>
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Order #${orderId.slice(0, 8).toUpperCase()}</p>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Customer Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${customerName || "Not provided"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px;">
                        <a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method:</td>
                      <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${paymentMethodLabel}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Order Items</h2>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="background: #f9fafb;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr style="background: #f9fafb;">
                        <td colspan="3" style="padding: 12px; font-weight: 600; text-align: right;">Total:</td>
                        <td style="padding: 12px; font-weight: 600; text-align: right; color: #2563eb;">$${totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 20px;">
                  <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">⚠️ Payment Confirmation Required</h3>
                  <p style="color: #92400e; margin: 0 0 15px 0; font-size: 14px;">Have you received the payment for this order?</p>
                  <div style="display: flex; gap: 10px;">
                    <a href="mailto:${customerEmail}?subject=Payment Confirmed - Order ${orderId.slice(0, 8).toUpperCase()}&body=Hi ${customerName},%0A%0AYour payment has been confirmed. We are now processing your order.%0A%0AThank you for shopping with TrendyCart!" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">✓ Yes, Confirm Payment</a>
                    <a href="mailto:${customerEmail}?subject=Payment Issue - Order ${orderId.slice(0, 8).toUpperCase()}&body=Hi ${customerName},%0A%0AWe have not yet received your payment for Order ${orderId.slice(0, 8).toUpperCase()}.%0A%0APlease complete your payment or contact us if you have any questions.%0A%0AThank you." style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">✗ No, Follow Up</a>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">TrendyCart Order Notification System</p>
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
    console.log("Order notification email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Order notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
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
