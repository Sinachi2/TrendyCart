import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ShoppingBag, Package, Palette, Code, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/ai-hero-bg.jpg";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
}

const SUGGESTED_PROMPTS = [
  { label: "Browse Products", icon: ShoppingBag, message: "Show me your best products" },
  { label: "Track Order", icon: Package, message: "How do I track my order?" },
  { label: "Payment Help", icon: Palette, message: "What payment methods do you accept?" },
  { label: "Get Support", icon: Code, message: "I need help with my account" },
];

const HeroChatInterface = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Welcome to TrendyCart! 👋 I'm your AI shopping assistant. Ask me anything about products, orders, or payments.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), content: content.trim(), sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trendybot-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.sender === "bot" ? "assistant" : "user", content: m.content })).concat([{ role: "user", content: content.trim() }]),
          userMessage: content.trim(),
        }),
      });

      const data = response.ok ? await response.json() : null;
      const botText = data?.message || "I'm here to help! Try browsing our shop or ask me about orders.";

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), content: botText, sender: "bot" }]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), content: "Let me help you! Check out our shop or ask about orders & payments.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background image */}
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

      {/* Floating glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/20 blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-20 right-[15%] w-60 h-60 rounded-full bg-accent/20 blur-[100px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">AI-Powered Shopping Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight animate-fade-in">
            Shop Smarter with
            <span className="block gradient-text">TrendyBot AI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in">
            Ask anything about products, track orders, get payment help — your AI assistant is always ready.
          </p>

          {/* Chat Interface - Glassmorphism */}
          <div className="mt-8 glass rounded-3xl shadow-elegant overflow-hidden border border-border/30 animate-slide-in-up max-w-2xl mx-auto">
            {/* Chat messages */}
            <div ref={scrollRef} className="h-[280px] overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.sender === "user" && "flex-row-reverse")}>
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", msg.sender === "bot" ? "bg-gradient-to-br from-primary to-accent" : "bg-primary")}>
                    {msg.sender === "bot" ? <Bot className="h-4 w-4 text-primary-foreground" /> : <User className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.sender === "bot" ? "bg-muted/80 text-foreground rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm")}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => sendMessage(prompt.message)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                  >
                    <prompt.icon className="h-3 w-3 text-primary" />
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 px-4 py-3 border-t border-border/30 bg-background/40"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask TrendyBot anything..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* CTA buttons below chat */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 animate-fade-in">
            <Button size="lg" className="px-8 shadow-elegant btn-glow" onClick={() => navigate("/shop")}>
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop Now
            </Button>
            <Button size="lg" variant="outline" className="px-8 glass border-border/50" onClick={() => navigate("/shop")}>
              Explore Collection
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroChatInterface;
