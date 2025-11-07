import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface RoomChatProps {
  roomId: string;
}

export const RoomChat = ({ roomId }: RoomChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("room_messages")
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    const channel = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          const { data } = await supabase
            .from("room_messages")
            .select(`
              *,
              profiles (username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from("room_messages").insert({
        room_id: roomId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message || "Fout bij verzenden bericht");
    }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.user_id === user?.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {msg.profiles?.avatar_url && (
                  <AvatarImage src={msg.profiles.avatar_url} alt={msg.profiles.username} />
                )}
                <AvatarFallback>
                  {msg.profiles?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col gap-1 max-w-[70%] ${msg.user_id === user?.id ? "items-end" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.profiles?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    msg.user_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type een bericht..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
