import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BiasButton from "@/components/BiasButton";
import MuteToggle from "@/components/MuteToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type BiasState = "neutral" | "bullish" | "bearish";
type BiasRecord = Record<string, BiasState>;

const timeframes = ["1h", "4h", "Daily", "Weekly", "Monthly"];

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [biasByTimeframe, setBiasByTimeframe] = useState<BiasRecord>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    loadRoom();
    loadBias();
    subscribeToChanges();
  }, [roomId, user, authLoading]);

  const loadRoom = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;
      setRoom(data);
      setIsOwner(data.owner_id === user?.id);
    } catch (error: any) {
      toast.error("Room not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadBias = async () => {
    try {
      const { data, error } = await supabase
        .from("room_bias")
        .select("*")
        .eq("room_id", roomId);

      if (error) throw error;

      const biasMap: BiasRecord = {};
      timeframes.forEach((tf) => {
        biasMap[tf] = "neutral";
      });

      data?.forEach((item) => {
        biasMap[item.timeframe] = item.bias_state as BiasState;
      });

      setBiasByTimeframe(biasMap);
    } catch (error: any) {
      console.error("Error loading bias:", error);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_bias",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadBias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleBiasChange = async (timeframe: string, newBias: BiasState) => {
    if (!isOwner) {
      toast.error("Only the room owner can change bias");
      return;
    }

    try {
      const { error } = await supabase
        .from("room_bias")
        .upsert({
          room_id: roomId,
          timeframe,
          bias_state: newBias,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setBiasByTimeframe((prev) => ({
        ...prev,
        [timeframe]: newBias,
      }));
    } catch (error: any) {
      toast.error("Failed to update bias");
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(room.invite_code);
    toast.success("Invite code copied!");
  };

  const counts = useMemo(() => {
    const bullish = Object.values(biasByTimeframe).filter((b) => b === "bullish").length;
    const bearish = Object.values(biasByTimeframe).filter((b) => b === "bearish").length;
    const neutral = Object.values(biasByTimeframe).filter((b) => b === "neutral").length;
    return { bullish, bearish, neutral };
  }, [biasByTimeframe]);

  const overall = useMemo(() => {
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) return "bullish";
    if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) return "bearish";
    return "neutral";
  }, [counts]);

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <MuteToggle />
        </div>

        <div className="text-center space-y-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{room?.name}</h1>
            <p className="text-muted-foreground">{isOwner ? "Your Room" : "Viewing Room"}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-lg">
              <Users className="h-4 w-4" />
              <code className="font-mono">{room?.invite_code}</code>
            </div>
            <Button variant="ghost" size="icon" onClick={copyInviteCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {timeframes.map((tf) => (
            <BiasButton
              key={tf}
              timeframe={tf}
              value={biasByTimeframe[tf] || "neutral"}
              onChange={(newState) => handleBiasChange(tf, newState)}
              disabled={!isOwner}
            />
          ))}
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/50">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Overall Bias</h2>
            <div
              className={`inline-block px-8 py-4 rounded-lg text-3xl font-bold ${
                overall === "bullish"
                  ? "bg-bullish/20 text-bullish"
                  : overall === "bearish"
                  ? "bg-bearish/20 text-bearish"
                  : "bg-neutral/20 text-neutral"
              }`}
            >
              {overall.toUpperCase()}
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-bullish font-semibold">{counts.bullish}</span>
                <span className="text-muted-foreground"> Bullish</span>
              </div>
              <div>
                <span className="text-bearish font-semibold">{counts.bearish}</span>
                <span className="text-muted-foreground"> Bearish</span>
              </div>
              <div>
                <span className="text-neutral font-semibold">{counts.neutral}</span>
                <span className="text-muted-foreground"> Neutral</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
