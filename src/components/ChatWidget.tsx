import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Package,
  CreditCard,
  HelpCircle,
  ShoppingBag,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  actions?: QuickAction[];
  showPaymentDetails?: boolean;
}

interface QuickAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

const RECENTLY_ASKED = [
  "How do I pay?",
  "Track my order",
  "Return policy",
  "Shipping info",
  "Browse deals",
];

const PAYMENT_DETAILS = {
  bank: {
    name: "Fidelity Bank",
    accountName: "SINACHI FRANKLIN EZEONYEKA",
    accountNumber: "6152779644",
  },
  crypto: {
    network: "USDT (TRC20)",
    walletAddress: "0x689dc021f5b7ed12883a401addc45fff7f279c19",
  },
};

const BOT_IMAGE = "/trendybot.png";

const ChatWidget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied!", description: `${field} copied` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
      setIsOpen(false);
    },
    [navigate]
  );

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "1",
          content:
            "Hey 👋 I’m TrendyBot AI — your smart shopping assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
          actions: [
            { label: "Browse Shop", action: () => goTo("/shop"), icon: <ShoppingBag className="h-3 w-3" /> },
            { label: "My Orders", action: () => goTo("/user-dashboard"), icon: <Package className="h-3 w-3" /> },
          ],
        },
      ]);
    }
  }, [isOpen, messages.length, goTo]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setMessages((p) => [
      ...p,
      { id: Date.now().toString(), content, sender: "user", timestamp: new Date() },
    ]);

    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          content:
            "I’ve got you! 😊 Ask me about products, payments, orders, or delivery.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl"
        size="icon"
      >
        {isOpen ? <X /> : <MessageCircle />}
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[95vw] bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden shadow-[0_0_12px_rgba(0,255,255,0.8)]">
            <img src={BOT_IMAGE} alt="TrendyBot AI" className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold">TrendyBot AI</h3>
            <p className="text-xs opacity-80">Smart Shopping Assistant</p>
          </div>
          <span className="ml-auto text-xs flex items-center gap-1">
            <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" /> Online
          </span>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.sender === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "h-8 w-8 rounded-full overflow-hidden shrink-0",
                    m.sender === "bot"
                      ? "shadow-[0_0_10px_rgba(0,200,255,0.7)]"
                      : "bg-primary flex items-center justify-center"
                  )}
                >
                  {m.sender === "bot" ? (
                    <img src={BOT_IMAGE} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm",
                    m.sender === "bot"
                      ? "bg-muted rounded-tl-sm"
                      : "bg-primary text-white rounded-tr-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden shadow-[0_0_10px_rgba(0,200,255,0.7)]">
                  <img src={BOT_IMAGE} className="h-full w-full object-cover" />
                </div>
                <div className="bg-muted px-4 py-2 rounded-2xl flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">TrendyBot is thinking…</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputValue);
          }}
          className="p-3 border-t flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask TrendyBot…"
            className="rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send />
          </Button>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;
