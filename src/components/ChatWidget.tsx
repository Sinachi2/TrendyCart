import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const quickReplies = [
  "Track my order",
  "Return policy",
  "Shipping info",
  "Payment options",
];

// Intent-based response system
interface Intent {
  keywords: string[];
  response: string;
}

const intents: Intent[] = [
  {
    keywords: ["hi", "hello", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening", "howdy"],
    response: "Hi 👋 Welcome to TrendyBot! How can I assist you today? You can ask about products, orders, or payments.",
  },
  {
    keywords: ["how can i pay", "payment", "pay for", "payment method", "payment options", "how to pay", "paying", "credit card", "debit card"],
    response: "You can pay for a product using debit/credit card, bank transfer, or wallet payment. Go to Checkout, choose your preferred payment method, and complete your order securely. 💳",
  },
  {
    keywords: ["track", "order status", "where is my order", "shipping status", "delivery status", "order tracking"],
    response: "To track your order, please go to your Dashboard → Orders, or provide your order ID and I'll look it up for you! 📦",
  },
  {
    keywords: ["return", "refund", "exchange", "return policy", "money back"],
    response: "We offer a 30-day return policy for all unused items in original packaging. Simply go to your Orders page and select 'Request Return' on the item you'd like to return. 🔄",
  },
  {
    keywords: ["shipping", "delivery", "delivery time", "shipping cost", "free shipping", "how long"],
    response: "We offer free shipping on orders over $50! Standard shipping takes 3-5 business days, and express shipping (2-day) is available for $9.99. 🚚",
  },
  {
    keywords: ["contact", "support", "help", "customer service", "speak to agent", "human", "real person"],
    response: "You can reach our support team via email at trendycart96@gmail.com or call us at 1-800-TRENDY. Our hours are Mon-Fri 9AM-6PM EST. Would you like to connect with a live agent? 📞",
  },
  {
    keywords: ["product", "item", "buy", "purchase", "shop", "browse", "looking for"],
    response: "Great! You can browse our shop by clicking on 'Shop' in the navigation menu. We have a wide variety of products across electronics, fashion, home & garden, and more! 🛍️",
  },
  {
    keywords: ["discount", "coupon", "promo", "deal", "offer", "sale", "code"],
    response: "We have great deals! Check out our Deals section on the homepage. You can also apply coupon codes at checkout. Try 'WELCOME10' for 10% off your first order! 🎉",
  },
  {
    keywords: ["account", "login", "sign up", "register", "password", "profile"],
    response: "You can manage your account by clicking on the user icon in the top right corner. From there, you can view your profile, orders, and wishlist. Need to create an account? Click 'Sign In' and select 'Sign Up'! 👤",
  },
  {
    keywords: ["wishlist", "save", "favorite", "saved items"],
    response: "You can add items to your wishlist by clicking the heart icon on any product. View all your saved items from your Dashboard or the Wishlist page. You can even share your wishlist with friends! ❤️",
  },
  {
    keywords: ["thank", "thanks", "awesome", "great", "perfect"],
    response: "You're welcome! 😊 Is there anything else I can help you with today?",
  },
  {
    keywords: ["bye", "goodbye", "see you", "later"],
    response: "Goodbye! Thanks for shopping with TrendyCart. Have a great day! 👋",
  },
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi 👋 Welcome to TrendyBot! How can I assist you today? You can ask about products, orders, or payments.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Check each intent for matching keywords
    for (const intent of intents) {
      for (const keyword of intent.keywords) {
        if (lowerMessage.includes(keyword) || lowerMessage === keyword) {
          return intent.response;
        }
      }
    }
    
    // Fallback response if no intent matches
    return "I'm not quite sure about that. 🤔 Would you like me to help with tracking orders, payment options, shipping info, or returns? You can also type 'contact support' to speak with our team!";
  };

  const sendMessage = (content: string) => {
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

    // Simulate bot typing and response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

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
          "fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
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
              <h3 className="font-semibold">TrendyBot</h3>
              <p className="text-xs text-white/80">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.sender === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.sender === "bot" ? "bg-gradient-to-r from-pink-500/20 to-orange-500/20" : "bg-muted"
                  )}
                >
                  {message.sender === "bot" ? (
                    <Bot className="h-4 w-4 text-pink-500" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    message.sender === "bot"
                      ? "bg-muted text-foreground rounded-tl-none"
                      : "bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-tr-none"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-pink-500" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                className="whitespace-nowrap text-xs hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-950"
                onClick={() => sendMessage(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 pt-2 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim()} className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;
