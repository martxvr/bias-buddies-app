import { useState } from "react";
import { Plus, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PRESET_TIMEFRAMES = [
  "1m", "2m", "3m", "4m", "5m", "10m", "15m", "30m",
  "1h", "2h", "4h", "8h", "1D", "1W", "1M", "3M", "1Y"
];

interface TimeframeManagerProps {
  timeframes: string[];
  onTimeframesChange: (timeframes: string[]) => void;
  disabled?: boolean;
}

export const TimeframeManager = ({
  timeframes,
  onTimeframesChange,
  disabled = false,
}: TimeframeManagerProps) => {
  const [customTimeframe, setCustomTimeframe] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTimeframe = (tf: string) => {
    if (timeframes.length >= 7) {
      toast.error("Maximum 7 timeframes allowed");
      return;
    }
    if (timeframes.includes(tf)) {
      toast.error("Timeframe already added");
      return;
    }
    onTimeframesChange([...timeframes, tf]);
  };

  const handleRemoveTimeframe = (tf: string) => {
    if (timeframes.length <= 1) {
      toast.error("At least 1 timeframe required");
      return;
    }
    onTimeframesChange(timeframes.filter((t) => t !== tf));
  };

  const handleAddCustom = () => {
    const tf = customTimeframe.trim().toUpperCase();
    if (!tf) return;
    
    // Validate format (e.g., 7m, 12h, 2D)
    const validFormat = /^[0-9]+[mhDWMY]$/i;
    if (!validFormat.test(tf)) {
      toast.error("Invalid format. Use: number + m/h/D/W/M/Y (e.g., 7m, 12h)");
      return;
    }
    
    handleAddTimeframe(tf);
    setCustomTimeframe("");
  };

  const availablePresets = PRESET_TIMEFRAMES.filter(
    (tf) => !timeframes.includes(tf)
  );

  if (disabled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Timeframes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Timeframes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current timeframes */}
          <div>
            <p className="text-sm font-medium mb-2 text-foreground">
              Active Timeframes ({timeframes.length}/7)
            </p>
            <div className="flex flex-wrap gap-2">
              {timeframes.map((tf) => (
                <Badge
                  key={tf}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {tf}
                  <button
                    onClick={() => handleRemoveTimeframe(tf)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Preset timeframes */}
          {availablePresets.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                Add Preset
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availablePresets.map((tf) => (
                  <Button
                    key={tf}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTimeframe(tf)}
                    disabled={timeframes.length >= 7}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tf}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom timeframe */}
          <div>
            <p className="text-sm font-medium mb-2 text-foreground">
              Custom Timeframe
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 7m, 12h, 2D"
                value={customTimeframe}
                onChange={(e) => setCustomTimeframe(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="flex-1"
              />
              <Button
                onClick={handleAddCustom}
                disabled={!customTimeframe.trim() || timeframes.length >= 7}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Format: number + unit (m=minutes, h=hours, D=days, W=weeks, M=months, Y=years)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
