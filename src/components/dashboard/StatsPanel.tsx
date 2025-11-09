import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Calendar, Target } from "lucide-react";

interface Stats {
  total_votes: number;
  rooms_visited: number;
  messages_sent: number;
  current_streak: number;
  longest_streak: number;
}

export function StatsPanel({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) setStats(data);
  };

  if (!stats) return null;

  const nextVoteMilestone = Math.ceil((stats.total_votes + 1) / 10) * 10;
  const voteProgress = (stats.total_votes / nextVoteMilestone) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Jouw Statistieken
        </CardTitle>
        <CardDescription>Je activiteit en prestaties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Votes naar {nextVoteMilestone}</span>
            <span className="font-medium">{stats.total_votes} / {nextVoteMilestone}</span>
          </div>
          <Progress value={voteProgress} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Huidige Streak</span>
            </div>
            <p className="text-2xl font-bold">{stats.current_streak} dagen</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-sm">Langste Streak</span>
            </div>
            <p className="text-2xl font-bold">{stats.longest_streak} dagen</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Rooms Bezocht</span>
            </div>
            <p className="text-2xl font-bold">{stats.rooms_visited}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Berichten</span>
            </div>
            <p className="text-2xl font-bold">{stats.messages_sent}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
