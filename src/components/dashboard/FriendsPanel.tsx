import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
  };
}

export function FriendsPanel({ userId }: { userId?: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadFriends();
      loadRequests();
    }
  }, [userId]);

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

  const loadRequests = async () => {
    const { data } = await supabase
      .from("friendships")
      .select(`
        *,
        profile:profiles!friendships_user_id_fkey(username, avatar_url)
      `)
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (data) setRequests(data as any);
  };

  const sendFriendRequest = async () => {
    if (!searchEmail || !userId) return;
    setLoading(true);

    try {
      // Find user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", searchEmail)
        .single();

      if (!profile) {
        toast.error("Gebruiker niet gevonden");
        return;
      }

      if (profile.id === userId) {
        toast.error("Je kunt jezelf niet toevoegen als vriend");
        return;
      }

      // Check if request already exists
      const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(user_id.eq.${userId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${userId})`)
        .single();

      if (existing) {
        toast.error("Vriendverzoek bestaat al");
        return;
      }

      await supabase.from("friendships").insert({
        user_id: userId,
        friend_id: profile.id,
        status: "pending",
      });

      toast.success("Vriendverzoek verzonden!");
      setSearchEmail("");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Fout bij versturen verzoek");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string, friendId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", requestId);

    // Create reciprocal friendship
    await supabase.from("friendships").insert({
      user_id: userId,
      friend_id: friendId,
      status: "accepted",
    });

    toast.success("Vriendverzoek geaccepteerd!");
    loadFriends();
    loadRequests();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from("friendships").delete().eq("id", requestId);
    toast.success("Vriendverzoek geweigerd");
    loadRequests();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    toast.success("Vriend verwijderd");
    loadFriends();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vrienden</CardTitle>
            <CardDescription>Beheer je vrienden en verzoeken</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vriend toevoegen</DialogTitle>
                <DialogDescription>
                  Zoek een gebruiker op gebruikersnaam om toe te voegen
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input
                  placeholder="Gebruikersnaam"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={sendFriendRequest} disabled={loading}>
                  Versturen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Friend Requests */}
        {requests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Vriendverzoeken</h3>
            <div className="space-y-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {request.profile?.avatar_url && (
                        <AvatarImage src={request.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {request.profile?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {request.profile?.username}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acceptRequest(request.id, request.user_id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => rejectRequest(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Mijn Vrienden ({friends.length})</h3>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Je hebt nog geen vrienden toegevoegd
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {friend.profile?.avatar_url && (
                        <AvatarImage src={friend.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {friend.profile?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {friend.profile?.username}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFriend(friend.id)}
                  >
                    Verwijderen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
