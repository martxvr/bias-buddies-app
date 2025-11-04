import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useClickSound } from "@/hooks/useSound";

type BiasState = "neutral" | "bullish" | "bearish";

interface BiasButtonProps {
  timeframe: string;
  value: BiasState;
  onChange: (next: BiasState) => void;
  disabled?: boolean;
}

const BiasButton = ({ timeframe, value, onChange, disabled = false }: BiasButtonProps) => {
  const { playClick } = useClickSound();

  const cycleState = useCallback(() => {
    if (disabled) return;
    const next = value === "neutral" ? "bullish" : value === "bullish" ? "bearish" : "neutral";
    onChange(next);
    playClick(next);
  }, [value, onChange, playClick, disabled]);

  const getStateStyles = () => {
    switch (value) {
      case "bullish":
        return "bg-bullish hover:bg-bullish-hover text-bullish-foreground border-bullish";
      case "bearish":
        return "bg-bearish hover:bg-bearish-hover text-bearish-foreground border-bearish";
      default:
        return "bg-neutral hover:bg-neutral-hover text-neutral-foreground border-neutral";
    }
  };

  const getStateLabel = () => {
    switch (value) {
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
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-8 transition-all duration-200 hover:scale-105 active:scale-95 min-w-[140px] shadow-lg",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
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
