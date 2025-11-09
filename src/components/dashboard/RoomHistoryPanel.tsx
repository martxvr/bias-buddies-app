import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface Session {
  id: string;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  short_term_bias: string | null;
  medium_term_bias: string | null;
  long_term_bias: string | null;
  participants_count: number;
  room: {
    name: string;
  };
}

export function RoomHistoryPanel({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const loadSessions = async () => {
    // Get all rooms user is member of or owns
    const { data: userRooms } = await supabase
      .from("rooms")
      .select("id")
      .or(`owner_id.eq.${userId},id.in.(select room_id from room_members where user_id=${userId})`);

    if (!userRooms) return;

    const roomIds = userRooms.map((r) => r.id);

    const { data } = await supabase
      .from("room_sessions")
      .select(`
        *,
        room:rooms(name)
      `)
      .in("room_id", roomIds)
      .order("started_at", { ascending: false })
      .limit(10);

    if (data) setSessions(data as any);
  };

  const getBiasIcon = (bias: string | null) => {
    if (!bias) return <Minus className="h-4 w-4" />;
    if (bias === "bullish") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (bias === "bearish") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getBiasLabel = (bias: string | null) => {
    if (!bias) return "Geen";
    if (bias === "bullish") return "Bullish";
    if (bias === "bearish") return "Bearish";
    return "Neutraal";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Room Geschiedenis
        </CardTitle>
        <CardDescription>Recente voting sessies</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen sessies</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{session.room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.started_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.participants_count}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Kort</p>
                    <div className="flex items-center gap-1">
                      {getBiasIcon(session.short_term_bias)}
                      <span className="text-sm font-medium">
                        {getBiasLabel(session.short_term_bias)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Middel</p>
                    <div className="flex items-center gap-1">
                      {getBiasIcon(session.medium_term_bias)}
                      <span className="text-sm font-medium">
                        {getBiasLabel(session.medium_term_bias)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Lang</p>
                    <div className="flex items-center gap-1">
                      {getBiasIcon(session.long_term_bias)}
                      <span className="text-sm font-medium">
                        {getBiasLabel(session.long_term_bias)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
