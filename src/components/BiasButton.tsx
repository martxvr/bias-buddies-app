import { useState } from "react";
import { cn } from "@/lib/utils";

type BiasState = "neutral" | "bullish" | "bearish";

interface BiasButtonProps {
  timeframe: string;
}

const BiasButton = ({ timeframe }: BiasButtonProps) => {
  const [bias, setBias] = useState<BiasState>("neutral");
  
  console.log("BiasButton rendering for timeframe:", timeframe);

  const playSound = (nextState: BiasState) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Verschillende frequenties per state
      const frequency = nextState === "bullish" ? 800 : nextState === "bearish" ? 400 : 600;
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      // Subtiel volume met fade out
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Audio playback failed:", error);
    }
  };

  const cycleState = () => {
    setBias((prev) => {
      const nextState = prev === "neutral" ? "bullish" : prev === "bullish" ? "bearish" : "neutral";
      playSound(nextState);
      return nextState;
    });
  };

  const getStateStyles = () => {
    switch (bias) {
      case "bullish":
        return "bg-bullish hover:bg-bullish-hover text-bullish-foreground border-bullish";
      case "bearish":
        return "bg-bearish hover:bg-bearish-hover text-bearish-foreground border-bearish";
      default:
        return "bg-neutral hover:bg-neutral-hover text-neutral-foreground border-neutral";
    }
  };

  const getStateLabel = () => {
    switch (bias) {
      case "bullish":
        return "BULLISH";
      case "bearish":
        return "BEARISH";
      default:
        return "NEUTRAL";
    }
  };

  return (
    <button
      onClick={cycleState}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-8 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[140px] shadow-lg",
        getStateStyles()
      )}
    >
      <span className="text-3xl font-bold">{timeframe}</span>
      <span className="text-xs font-semibold tracking-wider opacity-90">
        {getStateLabel()}
      </span>
    </button>
  );
};

export default BiasButton;
