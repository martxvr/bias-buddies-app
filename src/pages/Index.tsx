import BiasButton from "@/components/BiasButton";
import { useMemo, useState } from "react";
import MuteToggle from "@/components/MuteToggle";
import ChecklistDrawer from "@/components/ChecklistDrawer";
import { ClipboardCheck } from "lucide-react";
import { RoomsButton } from "@/components/RoomsButton";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const timeframes = ["1D", "4H", "1H", "15M", "5M"];

  type BiasState = "neutral" | "bullish" | "bearish";
  const [biasByTimeframe, setBiasByTimeframe] = useState<Record<string, BiasState>>(
    () => Object.fromEntries(timeframes.map((tf) => [tf, "neutral"]))
  );

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

  const handleCreateRoom = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCreateRoomOpen(true);
  };

  const handleJoinRoom = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setJoinRoomOpen(true);
  };
  const { counts, overall }: { counts: Record<BiasState, number>; overall: BiasState } = useMemo(() => {
    const counts: Record<BiasState, number> = { bullish: 0, bearish: 0, neutral: 0 };
    Object.values(biasByTimeframe).forEach((b) => {
      counts[b] += 1;
    });
    const entries = Object.entries(counts) as [BiasState, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const [topBias, topCount] = entries[0];
    const secondCount = entries[1][1];
    // If tie for top, treat as neutral overall
    const overall: BiasState = topCount === secondCount ? "neutral" : topBias;
    return { counts, overall };
  }, [biasByTimeframe]);

  const handleReset = () => {
    setBiasByTimeframe(Object.fromEntries(timeframes.map((tf) => [tf, "neutral"])) as Record<string, BiasState>);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <RoomsButton onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {user ? (
          <Button variant="ghost" size="sm" onClick={signOut}>
            Logout
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            Login
          </Button>
        )}
      </div>

      <div className="w-full max-w-5xl">
        <MuteToggle />
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            Trading Bias Tracker
          </h1>
          <p className="text-muted-foreground">
            Click buttons to cycle through market bias states
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {timeframes.map((timeframe) => (
            <BiasButton
              key={timeframe}
              timeframe={timeframe}
              value={biasByTimeframe[timeframe]}
              onChange={(next) =>
                setBiasByTimeframe((prev) => ({ ...prev, [timeframe]: next }))
              }
            />
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
      <button
        aria-label="Open trade checklist"
        onClick={() => setIsChecklistOpen(true)}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-border/60 bg-background/60 p-3 text-foreground/80 shadow-sm backdrop-blur transition-colors hover:text-foreground hover:bg-background/80 active:scale-95"
      >
        <ClipboardCheck className="h-5 w-5" />
      </button>
      <button
        aria-label="Reset biases to neutral"
        onClick={handleReset}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground/80 shadow-sm backdrop-blur transition-colors hover:text-foreground hover:bg-background/80 active:scale-95"
      >
        Reset
      </button>

      <ChecklistDrawer isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
    </div>
  );
};

export default Index;
