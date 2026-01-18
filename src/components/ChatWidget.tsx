import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Package, CreditCard, HelpCircle, ShoppingBag, Copy, Check, Loader2 } from "lucide-react";
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

const ChatWidget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  // Quick action handlers
  const goToOrders = useCallback(() => {
    navigate("/user-dashboard");
    setIsOpen(false);
  }, [navigate]);

  const goToShop = useCallback(() => {
    navigate("/shop");
    setIsOpen(false);
  }, [navigate]);

  const goToCart = useCallback(() => {
    navigate("/cart");
    setIsOpen(false);
  }, [navigate]);

  const goToContact = useCallback(() => {
    navigate("/contact");
    setIsOpen(false);
  }, [navigate]);

  const goToCheckout = useCallback(() => {
    navigate("/checkout");
    setIsOpen(false);
  }, [navigate]);

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "1",
        content: "Hey! 👋 I'm TrendyBot, your AI shopping assistant. Ask me anything about products, orders, payments, or shopping!",
        sender: "bot",
        timestamp: new Date(),
        actions: [
          { label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
          { label: "My Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> },
        ],
      }]);
    }
  }, [isOpen, messages.length, goToShop, goToOrders]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getAIResponse = async (userMessage: string): Promise<{ text: string; showPaymentDetails: boolean; actions?: QuickAction[] }> => {
    try {
      const newHistory = [...conversationHistory, { role: "user", content: userMessage }];
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trendybot-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newHistory,
          userMessage: userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429 || response.status === 402) {
          return { 
            text: errorData.message || "I'm a bit busy right now. Please try again in a moment!", 
            showPaymentDetails: false 
          };
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      
      // Update conversation history
      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: data.message }
      ]);

      // Determine actions based on response
      let actions: QuickAction[] = [];
      const lowerMessage = userMessage.toLowerCase();
      const lowerResponse = data.message.toLowerCase();

      if (data.showPaymentActions || lowerMessage.includes("pay") || lowerResponse.includes("payment")) {
        actions = [
          { label: "I've Made Payment", action: () => sendMessage("I've made payment"), icon: <Check className="h-3 w-3" /> },
          { label: "Need Help", action: goToContact, icon: <HelpCircle className="h-3 w-3" /> },
        ];
      } else if (lowerMessage.includes("order") || lowerResponse.includes("order")) {
        actions = [{ label: "View Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> }];
      } else if (lowerMessage.includes("shop") || lowerMessage.includes("product") || lowerMessage.includes("browse")) {
        actions = [{ label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> }];
      } else if (lowerMessage.includes("cart") || lowerMessage.includes("checkout")) {
        actions = [{ label: "Go to Cart", action: goToCart, icon: <ShoppingBag className="h-3 w-3" /> }];
      }

      return {
        text: data.message,
        showPaymentDetails: data.showPaymentActions || lowerMessage.includes("pay") || lowerMessage.includes("how to buy"),
        actions: actions.length > 0 ? actions : undefined,
      };
    } catch (error) {
      console.error("TrendyBot error:", error);
      return {
        text: "I'm having a small hiccup! 😅 Let me know what you need help with - orders, payments, products, or returns?",
        showPaymentDetails: false,
        actions: [
          { label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
          { label: "Contact Support", action: goToContact, icon: <HelpCircle className="h-3 w-3" /> },
        ],
      };
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await getAIResponse(content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: "bot",
        timestamp: new Date(),
        actions: response.actions,
        showPaymentDetails: response.showPaymentDetails,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting. Please try again!",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const PaymentDetailsCard = () => (
    <div className="mt-3 space-y-3 bg-gradient-to-br from-primary/5 to-accent/5 p-4 rounded-xl border border-border/50">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        Payment Methods
      </h4>
      
      {/* Bank Transfer */}
      <div className="bg-background/80 p-3 rounded-lg space-y-2">
        <p className="text-xs font-medium text-primary">🏦 Bank Transfer</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Bank:</span>
            <span className="font-medium">{PAYMENT_DETAILS.bank.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Account Name:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-[11px]">{PAYMENT_DETAILS.bank.accountName}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => copyToClipboard(PAYMENT_DETAILS.bank.accountName, "Account Name")}
              >
                {copiedField === "Account Name" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Account No:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-medium">{PAYMENT_DETAILS.bank.accountNumber}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => copyToClipboard(PAYMENT_DETAILS.bank.accountNumber, "Account Number")}
              >
                {copiedField === "Account Number" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto */}
      <div className="bg-background/80 p-3 rounded-lg space-y-2">
        <p className="text-xs font-medium text-primary">💰 Cryptocurrency</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-medium">{PAYMENT_DETAILS.crypto.network}</span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Wallet Address:</span>
            <div className="flex items-center gap-1 bg-muted/50 p-2 rounded">
              <span className="font-mono text-[10px] break-all flex-1">{PAYMENT_DETAILS.crypto.walletAddress}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => copyToClipboard(PAYMENT_DETAILS.crypto.walletAddress, "Wallet Address")}
              >
                {copiedField === "Wallet Address" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen && "rotate-90 bg-destructive hover:bg-destructive/90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">TrendyBot AI</h3>
              <p className="text-xs text-white/80">Powered by AI • Always here to help</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/80">Online</span>
            </div>
          </div>
        </div>

        {/* Recently Asked Questions */}
        {messages.length <= 1 && (
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">🔥 Popular Questions</p>
            <div className="flex flex-wrap gap-1.5">
              {RECENTLY_ASKED.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-full"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "flex gap-2",
                    message.sender === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                      message.sender === "bot"
                        ? "bg-gradient-to-r from-pink-500 to-orange-500"
                        : "bg-primary"
                    )}
                  >
                    {message.sender === "bot" ? (
                      <Bot className="h-4 w-4 text-white" />
                    ) : (
                      <User className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5",
                      message.sender === "bot"
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Payment Details */}
                    {message.showPaymentDetails && message.sender === "bot" && (
                      <PaymentDetailsCard />
                    )}
                    
                    {/* Quick Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actions.map((action, i) => (
                          <Button
                            key={i}
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs rounded-full"
                            onClick={action.action}
                          >
                            {action.icon}
                            <span className="ml-1">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    "text-[10px] text-muted-foreground mt-1",
                    message.sender === "user" ? "text-right mr-9" : "ml-9"
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">TrendyBot is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-border bg-background/95 backdrop-blur"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;