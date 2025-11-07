import BiasButton from "@/components/BiasButton";
import { useMemo, useState, useEffect } from "react";
import MuteToggle from "@/components/MuteToggle";
import ChecklistDrawer from "@/components/ChecklistDrawer";
import { ClipboardCheck, Copy, Check, MessageSquare } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BiasVoting } from "@/components/BiasVoting";
import { OnlineStatus } from "@/components/OnlineStatus";
import { RoomChat } from "@/components/RoomChat";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const timeframes = ["1D", "4H", "1H", "15M", "5M"];

  type BiasState = "neutral" | "bullish" | "bearish";
  const [biasByTimeframe, setBiasByTimeframe] = useState<Record<string, BiasState>>(
    () => Object.fromEntries(timeframes.map((tf) => [tf, "neutral"]))
  );

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    if (!user) {
      return;
    }

    const loadRoom = async () => {
      const { data: room, error } = await supabase
        .from("rooms")
        .select("*, room_bias(*)")
        .eq("id", roomId)
        .single();

      if (error) {
        toast.error("Failed to load room");
        navigate("/");
        return;
      }

      setRoomName(room.name);
      setInviteCode(room.invite_code);
      setIsOwner(room.owner_id === user.id);

      const biasData: Record<string, BiasState> = Object.fromEntries(
        timeframes.map((tf) => [tf, "neutral"])
      );
      
      room.room_bias?.forEach((bias: any) => {
        biasData[bias.timeframe] = bias.bias_state;
      });

      setBiasByTimeframe(biasData);
    };

    loadRoom();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_bias",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setBiasByTimeframe((prev) => ({
              ...prev,
              [payload.new.timeframe]: payload.new.bias_state,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, navigate]);

  const { counts, overall }: { counts: Record<BiasState, number>; overall: BiasState } = useMemo(() => {
    const counts: Record<BiasState, number> = { bullish: 0, bearish: 0, neutral: 0 };
    Object.values(biasByTimeframe).forEach((b) => {
      counts[b] += 1;
    });
    const entries = Object.entries(counts) as [BiasState, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const [topBias, topCount] = entries[0];
    const secondCount = entries[1][1];
    const overall: BiasState = topCount === secondCount ? "neutral" : topBias;
    return { counts, overall };
  }, [biasByTimeframe]);

  const handleBiasChange = async (timeframe: string, newBias: BiasState) => {
    if (!isOwner) {
      toast.error("Only the room owner can update bias");
      return;
    }

    try {
      const { error } = await supabase.from("room_bias").upsert(
        {
          room_id: roomId,
          timeframe,
          bias_state: newBias,
          updated_by: user?.id,
        },
        {
          onConflict: "room_id,timeframe",
        }
      );

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to update bias");
    }
  };

  const handleReset = async () => {
    if (!isOwner) {
      toast.error("Alleen de room eigenaar kan de bias resetten");
      return;
    }

    try {
      for (const timeframe of timeframes) {
        await supabase.from("room_bias").upsert({
          room_id: roomId,
          timeframe,
          bias_state: "neutral",
          updated_by: user?.id,
        });
      }
      toast.success("Gereset naar neutraal");
    } catch (error: any) {
      toast.error(error.message || "Fout bij resetten");
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <MuteToggle />
          <div />
        </div>
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            {roomName}
            <OnlineStatus roomId={roomId!} />
          </h1>
          <p className="text-muted-foreground mb-4">
            {isOwner ? "You are the room owner" : "Shared trading bias tracker"}
          </p>
          <button
            onClick={copyInviteCode}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:bg-background/80 hover:text-foreground"
          >
            <span>Invite: {inviteCode}</span>
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {timeframes.map((timeframe) => (
            <div key={timeframe} className="flex flex-col items-center gap-2">
              <BiasButton
                timeframe={timeframe}
                value={biasByTimeframe[timeframe]}
                onChange={(next) => handleBiasChange(timeframe, next)}
                disabled={!isOwner}
              />
              <BiasVoting roomId={roomId!} timeframe={timeframe} userId={user.id} />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div
            className={
              overall === "bullish"
                ? "rounded-lg border-2 border-bullish bg-bullish/20 px-4 py-2 text-bullish-foreground"
                : overall === "bearish"
                ? "rounded-lg border-2 border-bearish bg-bearish/20 px-4 py-2 text-bearish-foreground"
                : "rounded-lg border-2 border-neutral bg-neutral/20 px-4 py-2 text-neutral-foreground"
            }
          >
            <span className="text-sm font-semibold tracking-wider">OVERALL BIAS: </span>
            <span className="text-sm font-bold">
              {overall.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Bullish: {counts.bullish} · Bearish: {counts.bearish} · Neutral: {counts.neutral}
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-bullish"></div>
            <span className="text-foreground">Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-bearish"></div>
            <span className="text-foreground">Bearish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-neutral"></div>
            <span className="text-foreground">Neutral</span>
          </div>
        </div>
      </div>

      {/* Floating action buttons */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open chat"
            className="fixed bottom-4 right-4 z-[100] rounded-full border border-border/60 bg-background/60 p-3 text-foreground/80 shadow-sm backdrop-blur transition-colors hover:text-foreground hover:bg-background/80 active:scale-95"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle>Room Chat</SheetTitle>
            <SheetDescription>
              Chatten met andere room members
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-8rem)] px-6 pb-6">
            <RoomChat roomId={roomId!} />
          </div>
        </SheetContent>
      </Sheet>

      <button
        aria-label="Open trade checklist"
        onClick={() => setIsChecklistOpen(true)}
        className="fixed bottom-20 right-4 z-[100] rounded-full border border-border/60 bg-background/60 p-3 text-foreground/80 shadow-sm backdrop-blur transition-colors hover:text-foreground hover:bg-background/80 active:scale-95"
      >
        <ClipboardCheck className="h-5 w-5" />
      </button>
      
      {isOwner && (
        <button
          aria-label="Reset biases to neutral"
          onClick={handleReset}
          className="fixed bottom-36 right-4 z-[100] rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground/80 shadow-sm backdrop-blur transition-colors hover:text-foreground hover:bg-background/80 active:scale-95"
        >
          Reset
        </button>
      )}

      <ChecklistDrawer isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
    </div>
  );
};

export default Room;
