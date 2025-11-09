import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, MessageSquare, Star, Calendar, TrendingUp } from "lucide-react";
import { FriendsPanel } from "@/components/dashboard/FriendsPanel";
import { DirectMessagesPanel } from "@/components/dashboard/DirectMessagesPanel";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { AchievementsPanel } from "@/components/dashboard/AchievementsPanel";
import { RoomHistoryPanel } from "@/components/dashboard/RoomHistoryPanel";
import { FavoriteRoomsPanel } from "@/components/dashboard/FavoriteRoomsPanel";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      // Create initial stats
      await supabase.from("user_stats").insert({
        user_id: user.id,
        total_votes: 0,
        rooms_visited: 0,
        messages_sent: 0,
        current_streak: 0,
        longest_streak: 0,
      });
      loadStats();
    } else {
      setStats(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welkom terug! Hier is je overzicht.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totale Votes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_votes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rooms Bezocht</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rooms_visited || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Huidige Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.current_streak || 0} dagen</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Berichten</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.messages_sent || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="friends">Vrienden</TabsTrigger>
          <TabsTrigger value="messages">Berichten</TabsTrigger>
          <TabsTrigger value="achievements">Badges</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="history">Geschiedenis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatsPanel userId={user?.id} />
            <AchievementsPanel userId={user?.id} />
          </div>
          <FavoriteRoomsPanel userId={user?.id} />
        </TabsContent>

        <TabsContent value="friends">
          <FriendsPanel userId={user?.id} />
        </TabsContent>

        <TabsContent value="messages">
          <DirectMessagesPanel userId={user?.id} />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsPanel userId={user?.id} detailed />
        </TabsContent>

        <TabsContent value="rooms">
          <FavoriteRoomsPanel userId={user?.id} detailed />
        </TabsContent>

        <TabsContent value="history">
          <RoomHistoryPanel userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
