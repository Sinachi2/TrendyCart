import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Headphones, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const LiveChatWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (isOpen && user) {
      loadOrCreateChat();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!chatId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const loadOrCreateChat = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check for existing open chat
      const { data: existingChat, error: chatError } = await supabase
        .from("support_chats")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingChat) {
        setChatId(existingChat.id);
        // Load messages
        const { data: chatMessages } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("chat_id", existingChat.id)
          .order("created_at", { ascending: true });

        setMessages(chatMessages || []);
      } else if (chatError?.code === "PGRST116") {
        // No chat found, create new one
        const { data: newChat, error: createError } = await supabase
          .from("support_chats")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setChatId(newChat.id);

        // Send welcome message from system
        await supabase.from("chat_messages").insert({
          chat_id: newChat.id,
          sender_id: user.id,
          sender_type: "system",
          message: "Welcome to TrendyCart Support! 👋 A support agent will be with you shortly. Feel free to describe your issue.",
        });
      }
    } catch (error: any) {
      console.error("Error loading chat:", error);
      toast({
        title: "Error",
        description: "Failed to load chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !chatId || !user) return;

    const messageText = inputValue.trim();
    setInputValue("");

    try {
      const { error } = await supabase.from("chat_messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        sender_type: "customer",
        message: messageText,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setInputValue(messageText);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  if (!user) {
    return (
      <>
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

        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
            isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          )}
        >
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <Headphones className="h-12 w-12 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Live Support</h3>
            <p className="text-sm text-primary-foreground/80 mt-2">
              Please sign in to chat with our support team
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => window.location.href = "/auth"}
            >
              Sign In
            </Button>
          </div>
        </div>
      </>
    );
  }

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
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Live Support</h3>
              <p className="text-xs text-primary-foreground/80">
                {loading ? "Connecting..." : "Chat with our team"}
              </p>
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
                  message.sender_type === "customer" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.sender_type === "customer" ? "bg-muted" : "bg-primary/10"
                  )}
                >
                  {message.sender_type === "customer" ? (
                    <User className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Headphones className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    message.sender_type === "customer"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none"
                  )}
                >
                  {message.message}
                </div>
              </div>
            ))}
            {messages.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                <Headphones className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Start a conversation with our support team</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 pt-2 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LiveChatWidget;