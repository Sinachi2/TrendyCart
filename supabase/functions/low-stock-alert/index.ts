import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get low stock products (threshold: 10)
    const { data: lowStockProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, category")
      .lte("stock_quantity", 10)
      .order("stock_quantity", { ascending: true });

    if (productsError) throw productsError;

    if (!lowStockProducts || lowStockProducts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No low stock products found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) throw rolesError;

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admin users found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get admin emails from profiles
    const adminIds = adminRoles.map((r) => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", adminIds);

    if (profilesError) throw profilesError;

    // Build email content
    const productRows = lowStockProducts
      .map(
        (p) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.category}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; color: ${p.stock_quantity <= 5 ? '#e53935' : '#ff9800'};">
            ${p.stock_quantity}
          </td>
        </tr>
      `
      )
      .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">TrendyCart</h1>
          <p style="color: #666; margin: 5px 0;">Low Stock Alert</p>
        </div>
        
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0; color: #e65100; font-weight: bold;">⚠️ Attention Required</p>
          <p style="margin: 5px 0 0 0; color: #333;">${lowStockProducts.length} product(s) are running low on stock and may need restocking soon.</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product Name</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Stock</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        
        <p style="color: #666; font-size: 14px;">Please restock these items to avoid potential stockouts.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated alert from TrendyCart Admin System.
        </p>
      </div>
    `;

    // Send email to all admins
    const emailPromises = (adminProfiles || []).map((admin) =>
      resend.emails.send({
        from: "TrendyCart <onboarding@resend.dev>",
        to: [admin.email],
        subject: `⚠️ Low Stock Alert - ${lowStockProducts.length} products need attention`,
        html,
      })
    );

    const emailResults = await Promise.all(emailPromises);
    console.log("Low stock alerts sent:", emailResults);

    return new Response(
      JSON.stringify({
        success: true,
        lowStockCount: lowStockProducts.length,
        emailsSent: emailResults.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in low-stock-alert function:", error);
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