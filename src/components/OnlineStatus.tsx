import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OnlineUser {
  user_id: string;
  username: string;
  avatar_url?: string;
  online_at: string;
}

interface OnlineStatusProps {
  roomId: string;
}

export const OnlineStatus = ({ roomId }: OnlineStatusProps) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || !roomId) return;

    const roomChannel = supabase.channel(`room:${roomId}:presence`);

    roomChannel
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          presences.forEach((presence: any) => {
            users.push({
              user_id: presence.user_id,
              username: presence.username,
              avatar_url: presence.avatar_url,
              online_at: presence.online_at,
            });
          });
        });

        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Get user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", user.id)
            .single();

          // Track presence
          await roomChannel.track({
            user_id: user.id,
            username: profile?.username || user.email,
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(roomChannel);

    return () => {
      if (roomChannel) {
        roomChannel.untrack();
        supabase.removeChannel(roomChannel);
      }
    };
  }, [user, roomId]);

  const otherUsers = onlineUsers.filter((u) => u.user_id !== user?.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <Badge variant="secondary" className="rounded-full">
            {onlineUsers.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Online Members ({onlineUsers.length})</h4>
          <div className="space-y-2">
            {onlineUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Niemand online</p>
            ) : (
              onlineUsers.map((onlineUser) => (
                <div
                  key={onlineUser.user_id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      {onlineUser.avatar_url && (
                        <AvatarImage src={onlineUser.avatar_url} alt={onlineUser.username} />
                      )}
                      <AvatarFallback>
                        {onlineUser.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {onlineUser.username}
                      {onlineUser.user_id === user?.id && " (jij)"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
