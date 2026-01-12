import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickChatMessage {
  id: string;
  message: string;
  category: string;
  icon: string | null;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  icon: string | null;
  created_at: string;
  isOpponent?: boolean;
}

interface QuickChatProps {
  matchId: string;
  userId: string;
  opponentId: string;
}

export const QuickChat = ({ matchId, userId, opponentId }: QuickChatProps) => {
  const [quickChats, setQuickChats] = useState<QuickChatMessage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    loadQuickChats();
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`match-chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          const newMessage = payload.new as any;
          
          // Find the quick chat to get the message text
          const quickChat = quickChats.find(q => q.id === newMessage.quick_chat_id);
          
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              user_id: newMessage.user_id,
              message: quickChat?.message || newMessage.custom_message || "...",
              icon: quickChat?.icon || null,
              created_at: newMessage.created_at,
              isOpponent: newMessage.user_id !== userId,
            },
          ]);

          if (newMessage.user_id !== userId) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, userId]);

  const loadQuickChats = async () => {
    const { data } = await supabase
      .from("quick_chats")
      .select("*")
      .order("sort_order");

    setQuickChats(data || []);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("match_messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (data) {
      const messagesWithChats = await Promise.all(
        data.map(async (msg: any) => {
          if (msg.quick_chat_id) {
            const quickChat = quickChats.find(q => q.id === msg.quick_chat_id);
            return {
              id: msg.id,
              user_id: msg.user_id,
              message: quickChat?.message || "...",
              icon: quickChat?.icon || null,
              created_at: msg.created_at,
              isOpponent: msg.user_id !== userId,
            };
          }
          return {
            id: msg.id,
            user_id: msg.user_id,
            message: msg.custom_message || "...",
            icon: null,
            created_at: msg.created_at,
            isOpponent: msg.user_id !== userId,
          };
        })
      );
      setMessages(messagesWithChats);
    }
  };

  const sendMessage = async (quickChat: QuickChatMessage) => {
    await supabase.from("match_messages").insert({
      match_id: matchId,
      user_id: userId,
      quick_chat_id: quickChat.id,
    });

    // Optimistically add the message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user_id: userId,
        message: quickChat.message,
        icon: quickChat.icon,
        created_at: new Date().toISOString(),
        isOpponent: false,
      },
    ]);
  };

  const categories = [...new Set(quickChats.map(q => q.category))];

  return (
    <>
      {/* Floating notification */}
      {showNotification && messages.length > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
          <div className="bg-card border rounded-lg shadow-lg p-3 flex items-center gap-2">
            <span className="text-lg">{messages[messages.length - 1]?.icon}</span>
            <span className="font-medium">{messages[messages.length - 1]?.message}</span>
          </div>
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative"
          >
            <MessageCircle className="w-5 h-5" />
            {showNotification && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Quick Chat
            </h4>
          </div>

          {/* Messages */}
          <ScrollArea className="h-32 p-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">
                No messages yet
              </p>
            ) : (
              <div className="space-y-2">
                {messages.slice(-10).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOpponent ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] ${
                        msg.isOpponent
                          ? "bg-secondary"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.icon && <span className="mr-1">{msg.icon}</span>}
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Quick chat buttons */}
          <div className="border-t p-3 space-y-3">
            {categories.map((category) => (
              <div key={category}>
                <p className="text-xs text-muted-foreground mb-2 capitalize">{category}</p>
                <div className="flex flex-wrap gap-1">
                  {quickChats
                    .filter((q) => q.category === category)
                    .map((chat) => (
                      <Button
                        key={chat.id}
                        variant="secondary"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => sendMessage(chat)}
                      >
                        {chat.icon && <span className="mr-1">{chat.icon}</span>}
                        {chat.message}
                      </Button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default QuickChat;
