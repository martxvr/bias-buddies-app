import { useState } from "react";
import { cn } from "@/lib/utils";

type BiasState = "neutral" | "bullish" | "bearish";

interface BiasButtonProps {
  timeframe: string;
}

const BiasButton = ({ timeframe }: BiasButtonProps) => {
  const [bias, setBias] = useState<BiasState>("neutral");

  const cycleState = () => {
    setBias((prev) => {
      if (prev === "neutral") return "bullish";
      if (prev === "bullish") return "bearish";
      return "neutral";
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
