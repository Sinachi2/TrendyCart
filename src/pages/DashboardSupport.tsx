import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Headphones, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Chat {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  last_message?: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const DashboardSupport = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (user && isAdmin) {
      loadChats();
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedChat) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`admin-chat-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat?.id]);

  const loadChats = async () => {
    try {
      const { data: chatData, error } = await supabase
        .from("support_chats")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get user profiles for each chat
      const userIds = [...new Set((chatData || []).map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enrichedChats = (chatData || []).map((chat) => ({
        ...chat,
        user_email: profileMap.get(chat.user_id)?.email,
        user_name: profileMap.get(chat.user_id)?.full_name,
      }));

      setChats(enrichedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const selectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    
    const { data: chatMessages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(chatMessages || []);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedChat || !user) return;

    const messageText = inputValue.trim();
    setInputValue("");

    try {
      const { error } = await supabase.from("chat_messages").insert({
        chat_id: selectedChat.id,
        sender_id: user.id,
        sender_type: "agent",
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

  const closeChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from("support_chats")
        .update({ status: "closed" })
        .eq("id", chatId);

      if (error) throw error;
      
      toast({ title: "Chat closed" });
      loadChats();
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Customer Support</h1>
          </header>

          <main className="flex-1 p-6">
            <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
              {/* Chat List */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-14rem)]">
                    {chats.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No active chats
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer transition-colors",
                              selectedChat?.id === chat.id
                                ? "bg-primary/10"
                                : "hover:bg-muted"
                            )}
                            onClick={() => selectChat(chat)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {chat.user_name || chat.user_email || "Customer"}
                              </span>
                              <Badge
                                variant={chat.status === "open" ? "default" : "secondary"}
                              >
                                {chat.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(chat.created_at), "MMM d, h:mm a")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Window */}
              <Card className="md:col-span-2 flex flex-col">
                {selectedChat ? (
                  <>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {selectedChat.user_name || selectedChat.user_email || "Customer"}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {selectedChat.user_email}
                            </p>
                          </div>
                        </div>
                        {selectedChat.status === "open" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => closeChat(selectedChat.id)}
                          >
                            Close Chat
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col">
                      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-2",
                                message.sender_type === "agent" && "flex-row-reverse"
                              )}
                            >
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                  message.sender_type === "agent"
                                    ? "bg-primary/10"
                                    : "bg-muted"
                                )}
                              >
                                {message.sender_type === "agent" ? (
                                  <Headphones className="h-4 w-4 text-primary" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                  message.sender_type === "agent"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted text-foreground rounded-tl-none"
                                )}
                              >
                                {message.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {selectedChat.status === "open" && (
                        <form
                          onSubmit={handleSubmit}
                          className="p-4 border-t border-border"
                        >
                          <div className="flex gap-2">
                            <Input
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!inputValue.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No chat selected</p>
                      <p className="text-sm">Select a conversation to start responding</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardSupport;