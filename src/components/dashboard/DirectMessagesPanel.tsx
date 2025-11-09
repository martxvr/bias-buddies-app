import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  receiver?: {
    username: string;
    avatar_url?: string;
  };
}

interface Friend {
  id: string;
  friend_id: string;
  profile?: {
    username: string;
    avatar_url?: string;
  };
}

export function DirectMessagesPanel({ userId }: { userId?: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFriends();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && selectedFriend) {
      loadMessages();
      const channel = subscribeToMessages();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, selectedFriend]);

  const loadFriends = async () => {
    const { data } = await supabase
      .from("friendships")
      .select(`
        *,
        profile:profiles!friendships_friend_id_fkey(username, avatar_url)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (data) setFriends(data as any);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!direct_messages_receiver_id_fkey(username, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedFriend}),and(sender_id.eq.${selectedFriend},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as any);
      // Mark messages as read
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", selectedFriend)
        .eq("read", false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === selectedFriend && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === selectedFriend)
          ) {
            loadMessages();
          }
        }
      )
      .subscribe();

    return channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !userId) return;
    setLoading(true);

    try {
      await supabase.from("direct_messages").insert({
        sender_id: userId,
        receiver_id: selectedFriend,
        message: newMessage.trim(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Fout bij versturen bericht");
    } finally {
      setLoading(false);
    }
  };

  const selectedFriendProfile = friends.find((f) => f.friend_id === selectedFriend)?.profile;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Direct Berichten</CardTitle>
        <CardDescription>Chat met je vrienden</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex gap-4 min-h-0">
        {/* Friends List */}
        <div className="w-1/3 border-r pr-4">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen vrienden om mee te chatten</p>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend.friend_id)}
                    className={`w-full flex items-center gap-3 p-2 rounded hover:bg-accent ${
                      selectedFriend === friend.friend_id ? "bg-accent" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {friend.profile?.avatar_url && (
                        <AvatarImage src={friend.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {friend.profile?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{friend.profile?.username}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedFriend ? (
            <>
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar className="h-8 w-8">
                  {selectedFriendProfile?.avatar_url && (
                    <AvatarImage src={selectedFriendProfile.avatar_url} />
                  )}
                  <AvatarFallback>
                    {selectedFriendProfile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedFriendProfile?.username}</span>
              </div>

              <ScrollArea className="flex-1 py-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isSender = message.sender_id === userId;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isSender ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8">
                          {(isSender ? message.sender?.avatar_url : message.receiver?.avatar_url) && (
                            <AvatarImage
                              src={
                                isSender
                                  ? message.sender?.avatar_url
                                  : message.receiver?.avatar_url
                              }
                            />
                          )}
                          <AvatarFallback>
                            {(isSender
                              ? message.sender?.username
                              : message.receiver?.username
                            )?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex-1 max-w-[70%] ${isSender ? "text-right" : ""}`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg ${
                              isSender
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: nl,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="Type een bericht..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Selecteer een vriend om te chatten
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
