import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Package, CreditCard, HelpCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  actions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

// Context tracking for smarter responses
interface ConversationContext {
  lastTopic: string | null;
  mentionedProducts: string[];
  askedAboutOrders: boolean;
  askedAboutPayments: boolean;
  greetingGiven: boolean;
  messageCount: number;
}

// Enhanced intent system with scoring and context
interface Intent {
  id: string;
  patterns: RegExp[];
  keywords: string[];
  priority: number;
  getResponse: (context: ConversationContext, userMessage: string) => { text: string; actions?: QuickAction[]; updateContext?: Partial<ConversationContext> };
}

const ChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    lastTopic: null,
    mentionedProducts: [],
    askedAboutOrders: false,
    askedAboutPayments: false,
    greetingGiven: false,
    messageCount: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const goToProfile = useCallback(() => {
    navigate("/user-dashboard");
    setIsOpen(false);
  }, [navigate]);

  const goToContact = useCallback(() => {
    navigate("/contact");
    setIsOpen(false);
  }, [navigate]);

  // Enhanced intents with smarter responses
  const intents: Intent[] = [
    {
      id: "greeting",
      patterns: [/^(hi|hello|hey|hola|howdy|yo|sup|what'?s up|good (morning|afternoon|evening))[\s!?.]*$/i],
      keywords: ["hi", "hello", "hey", "hola", "greetings"],
      priority: 10,
      getResponse: (ctx) => {
        const greetings = [
          "Hey there! 👋 What can I help you with today?",
          "Hi! 😊 I'm here to help. What are you looking for?",
          "Hello! Great to see you! How can I assist?",
        ];
        const followUp = ctx.greetingGiven 
          ? "Back again! What else can I help with?" 
          : greetings[Math.floor(Math.random() * greetings.length)];
        
        return {
          text: followUp,
          actions: [
            { label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
            { label: "My Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> },
          ],
          updateContext: { greetingGiven: true, lastTopic: "greeting" }
        };
      }
    },
    {
      id: "payment",
      patterns: [/how (can|do) (i|we) pay/i, /payment (method|option|way)/i, /pay (for|with)/i],
      keywords: ["payment", "pay", "credit card", "debit", "checkout", "billing"],
      priority: 9,
      getResponse: (ctx) => {
        const isFollowUp = ctx.lastTopic === "payment";
        const base = isFollowUp 
          ? "Sure, here's more on payments:"
          : "Great question! Here are your payment options:";
        
        return {
          text: `${base}\n\n💳 **Credit/Debit Cards** - Visa, Mastercard, Amex\n🏦 **Bank Transfer** - Direct from your bank\n📱 **Digital Wallets** - Apple Pay, Google Pay\n\nAll transactions are secured with SSL encryption.`,
          actions: [
            { label: "Go to Cart", action: goToCart, icon: <CreditCard className="h-3 w-3" /> },
          ],
          updateContext: { askedAboutPayments: true, lastTopic: "payment" }
        };
      }
    },
    {
      id: "order_tracking",
      patterns: [/track(ing)? (my )?order/i, /where('?s| is) my (order|package|delivery)/i, /order status/i],
      keywords: ["track", "order", "delivery", "shipping", "package", "status"],
      priority: 9,
      getResponse: (ctx) => {
        return {
          text: "I can help you track your order! 📦\n\nGo to your Dashboard → Orders to see real-time tracking info, including carrier details and estimated delivery dates.",
          actions: [
            { label: "View My Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> },
          ],
          updateContext: { askedAboutOrders: true, lastTopic: "orders" }
        };
      }
    },
    {
      id: "return_policy",
      patterns: [/return (policy|item|product)/i, /refund/i, /exchange/i, /money back/i],
      keywords: ["return", "refund", "exchange", "policy"],
      priority: 8,
      getResponse: () => ({
        text: "Our return policy is customer-friendly! 🔄\n\n✅ **30-day returns** on unused items\n✅ **Free return shipping** on defective items\n✅ **Full refund** to original payment method\n\nJust go to Orders and click 'Request Return' on any item.",
        actions: [
          { label: "View Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "returns" }
      })
    },
    {
      id: "shipping",
      patterns: [/shipping (cost|time|info)/i, /how long (to|for) (ship|deliver)/i, /delivery time/i, /free shipping/i],
      keywords: ["shipping", "delivery", "ship", "arrive"],
      priority: 8,
      getResponse: () => ({
        text: "Here's our shipping info! 🚚\n\n🆓 **Free Shipping** - Orders over $50\n⏱️ **Standard** - 3-5 business days\n⚡ **Express** - 1-2 days ($9.99)\n\nYou'll get tracking info as soon as your order ships!",
        updateContext: { lastTopic: "shipping" }
      })
    },
    {
      id: "products",
      patterns: [/looking for/i, /find (a|some)/i, /do you (have|sell)/i, /shop(ping)?/i, /browse/i],
      keywords: ["product", "buy", "shop", "browse", "find", "looking"],
      priority: 7,
      getResponse: () => ({
        text: "Let me help you find what you need! 🛍️\n\nWe have great products in Electronics, Fashion, Home & Garden, and more. Check out our Deals section for the best offers!",
        actions: [
          { label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "products" }
      })
    },
    {
      id: "discounts",
      patterns: [/discount/i, /coupon/i, /promo(tion)?/i, /sale/i, /deal/i, /offer/i],
      keywords: ["discount", "coupon", "promo", "sale", "deal", "offer", "code"],
      priority: 8,
      getResponse: () => ({
        text: "Love a good deal? Here's what we have! 🎉\n\n💰 Use code **WELCOME10** for 10% off your first order\n🔥 Check our Deals section for flash sales\n📦 Free shipping on orders over $50\n\nDeals update regularly, so check back often!",
        actions: [
          { label: "View Deals", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "discounts" }
      })
    },
    {
      id: "account",
      patterns: [/my account/i, /sign (in|up)/i, /log(in|out)/i, /profile/i, /password/i],
      keywords: ["account", "login", "signup", "profile", "password", "register"],
      priority: 7,
      getResponse: () => ({
        text: "Need help with your account? 👤\n\nFrom your profile, you can:\n• Update your details\n• View order history\n• Manage addresses & payment methods\n• Check your wishlist",
        actions: [
          { label: "Go to Profile", action: goToProfile, icon: <User className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "account" }
      })
    },
    {
      id: "wishlist",
      patterns: [/wishlist/i, /save(d)? (for later|items)/i, /favorites?/i],
      keywords: ["wishlist", "saved", "favorite", "save"],
      priority: 6,
      getResponse: () => ({
        text: "Your wishlist is a great way to save items! ❤️\n\nClick the heart icon on any product to add it. You can even share your wishlist with friends and family!",
        actions: [
          { label: "View Wishlist", action: goToProfile, icon: <ShoppingBag className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "wishlist" }
      })
    },
    {
      id: "support",
      patterns: [/contact/i, /support/i, /help me/i, /speak to/i, /talk to/i, /customer service/i, /human/i, /real person/i],
      keywords: ["contact", "support", "help", "customer service", "agent", "human"],
      priority: 9,
      getResponse: () => ({
        text: "I'm here to help, but if you need our team:\n\n📧 **Email**: trendycart96@gmail.com\n📞 **Phone**: 1-800-TRENDY\n🕐 **Hours**: Sun-Sat, 9AM - 6PM\n\nOr visit our Contact page for more options!",
        actions: [
          { label: "Contact Us", action: goToContact, icon: <HelpCircle className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "support" }
      })
    },
    {
      id: "thanks",
      patterns: [/thank(s| you)/i, /appreciate/i, /awesome/i, /great/i, /perfect/i, /helpful/i],
      keywords: ["thanks", "thank", "appreciate", "awesome", "great", "perfect"],
      priority: 5,
      getResponse: (ctx) => {
        const responses = [
          "You're welcome! 😊 Anything else I can help with?",
          "Happy to help! Let me know if you need anything else.",
          "Glad I could assist! I'm here if you have more questions.",
        ];
        return {
          text: responses[Math.floor(Math.random() * responses.length)],
          updateContext: { lastTopic: null }
        };
      }
    },
    {
      id: "goodbye",
      patterns: [/bye/i, /goodbye/i, /see you/i, /later/i, /take care/i],
      keywords: ["bye", "goodbye", "later", "see you"],
      priority: 5,
      getResponse: () => ({
        text: "Take care! 👋 Thanks for chatting with TrendyBot. Come back anytime you need help!",
        updateContext: { lastTopic: null, greetingGiven: false }
      })
    },
    {
      id: "cart",
      patterns: [/my cart/i, /shopping cart/i, /checkout/i, /items in cart/i],
      keywords: ["cart", "checkout", "basket"],
      priority: 7,
      getResponse: () => ({
        text: "Ready to checkout? 🛒 Head to your cart to review items and complete your purchase!",
        actions: [
          { label: "View Cart", action: goToCart, icon: <ShoppingBag className="h-3 w-3" /> },
        ],
        updateContext: { lastTopic: "cart" }
      })
    },
  ];

  // Smart response matching with scoring
  const getBotResponse = useCallback((userMessage: string): { text: string; actions?: QuickAction[]; updateContext?: Partial<ConversationContext> } => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Score each intent
    const scores: { intent: Intent; score: number }[] = intents.map(intent => {
      let score = 0;
      
      // Check patterns (highest priority)
      for (const pattern of intent.patterns) {
        if (pattern.test(lowerMessage)) {
          score += 100;
          break;
        }
      }
      
      // Check keywords
      for (const keyword of intent.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      // Boost if matches current context
      if (context.lastTopic && intent.id.includes(context.lastTopic)) {
        score += 5;
      }
      
      return { intent, score: score * intent.priority };
    });
    
    // Get best match
    const bestMatch = scores.reduce((a, b) => a.score > b.score ? a : b);
    
    if (bestMatch.score > 0) {
      return bestMatch.intent.getResponse(context, userMessage);
    }
    
    // Smart fallback based on context
    const contextualFallbacks: Record<string, string> = {
      payment: "Is there something specific about payments you'd like to know? I can explain any payment method in detail.",
      orders: "Need more help with your order? I can help with tracking, returns, or order issues.",
      products: "Looking for something specific? Try searching in our Shop or let me know what category interests you!",
    };
    
    if (context.lastTopic && contextualFallbacks[context.lastTopic]) {
      return {
        text: contextualFallbacks[context.lastTopic],
      };
    }
    
    return {
      text: "I'm not sure I understood that. 🤔 I can help with:\n\n• Order tracking & status\n• Payment options\n• Shipping & returns\n• Finding products\n\nWhat would you like to know?",
      actions: [
        { label: "Browse Shop", action: goToShop, icon: <ShoppingBag className="h-3 w-3" /> },
        { label: "My Orders", action: goToOrders, icon: <Package className="h-3 w-3" /> },
        { label: "Contact Support", action: goToContact, icon: <HelpCircle className="h-3 w-3" /> },
      ],
    };
  }, [context, goToShop, goToOrders, goToContact]);

  // Initialize with welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "1",
        content: "Hey! 👋 I'm TrendyBot, your shopping assistant. How can I help you today?",
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

    // Get response with variable delay for natural feel
    const typingDelay = 600 + Math.random() * 600;
    
    setTimeout(() => {
      const response = getBotResponse(content);
      
      // Update context
      if (response.updateContext) {
        setContext(prev => ({
          ...prev,
          ...response.updateContext,
          messageCount: prev.messageCount + 1,
        }));
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        sender: "bot",
        timestamp: new Date(),
        actions: response.actions,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, typingDelay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const quickReplies = [
    "Track my order",
    "How do I pay?",
    "Shipping info",
    "Return policy",
  ];

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
              <h3 className="font-semibold">TrendyBot</h3>
              <p className="text-xs text-white/80">Your shopping assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/80">Online</span>
            </div>
          </div>
        </div>

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
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                      message.sender === "bot"
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-tr-none"
                    )}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                </div>
                
                {/* Action buttons for bot messages */}
                {message.sender === "bot" && message.actions && message.actions.length > 0 && (
                  <div className="flex gap-2 mt-2 ml-10 flex-wrap">
                    {message.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 dark:hover:bg-pink-950"
                        onClick={action.action}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
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
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                className="whitespace-nowrap text-xs hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600 dark:hover:bg-pink-950"
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
              placeholder="Ask me anything..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputValue.trim()} 
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
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
