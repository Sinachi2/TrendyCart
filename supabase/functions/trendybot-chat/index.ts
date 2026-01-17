import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYMENT_INFO = `
**Payment Methods Available:**

1. **Bank Transfer** 🏦
   - Bank Name: Fidelity Bank
   - Account Name: SINACHI FRANKLIN EZEONYEKA
   - Account Number: 6152779644

2. **Cryptocurrency** 💰
   - Network: USDT (TRC20)
   - Wallet Address: 0x689dc021f5b7ed12883a401addc45fff7f279c19

After payment, please confirm by clicking "I've Made Payment" or contact support if you need help.
`;

const SYSTEM_PROMPT = `You are TrendyBot, a friendly and helpful shopping assistant for TrendyCart - an online fashion and electronics store. 

Your personality:
- Warm, professional, and conversational
- Never use generic auto-replies
- Keep responses short (2-4 sentences max) unless detailed info is needed
- Use emojis sparingly but appropriately
- Be direct and helpful

Key information about TrendyCart:
- We sell fashion, electronics, and lifestyle products
- Free shipping on orders over $50
- 30-day return policy on unused items
- Contact: trendycart96@gmail.com

Payment Methods Available:
1. Bank Transfer:
   - Bank Name: Fidelity Bank
   - Account Name: SINACHI FRANKLIN EZEONYEKA
   - Account Number: 6152779644

2. Cryptocurrency:
   - Network: USDT (TRC20)
   - Wallet Address: 0x689dc021f5b7ed12883a401addc45fff7f279c19

When users ask about payment:
- Always show both payment methods clearly
- Mention they should confirm after making payment
- Offer to help if they have issues

For order tracking: Direct users to their Dashboard > Orders section.
For returns: Explain our 30-day policy and that they can initiate returns from their order history.
For product inquiries: Suggest browsing the Shop page or describe what we offer.

IMPORTANT: Keep responses concise and actionable. Don't repeat information unnecessarily.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check if this is a payment-related query
    const lowerMessage = userMessage?.toLowerCase() || "";
    const isPaymentQuery = lowerMessage.includes("pay") || 
                           lowerMessage.includes("payment") ||
                           lowerMessage.includes("how to buy") ||
                           lowerMessage.includes("checkout");

    const conversationMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // For payment queries, add extra context
    if (isPaymentQuery) {
      conversationMessages.push({
        role: "system", 
        content: "The user is asking about payment. Make sure to provide the complete payment details clearly formatted."
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: conversationMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm receiving too many requests right now. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. How can I help you?";

    // Determine if we should show payment actions
    const showPaymentActions = isPaymentQuery || aiMessage.toLowerCase().includes("payment") || aiMessage.toLowerCase().includes("bank");

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        showPaymentActions,
        isPaymentQuery
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("TrendyBot error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        message: "I'm having trouble right now. Please try again or contact our support team at trendycart96@gmail.com"
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});