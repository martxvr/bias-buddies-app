import { useState, useEffect } from "react";
import { Check, X, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getMuted } from "@/hooks/useSound";

interface ChecklistItem {
  id: string;
  question: string;
  checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
  { id: "htf-bias", question: "Following HTF Bias (via tradebiasapp.com)?", checked: false },
  { id: "sweep", question: "Sweep of Liquidity?", checked: false },
  { id: "fvg", question: "Fair Value Gap (FVG on both NQ & ES)?", checked: false },
  { id: "breaker", question: "Breaker Block (BB) or Mitigation Block (MB) paired with FVG on either NQ or ES?", checked: false },
  { id: "ssl-bsl", question: "Buy at SSL, Sell at BSL?", checked: false },
  { id: "displacement", question: "Displacement on both NQ & ES (MSS)?", checked: false },
  { id: "objective", question: "First Objective has not been met?", checked: false },
  { id: "macro", question: "Inside Macro (09:45-10:15, 10:45-11:15, 11:45-12:15)?", checked: false },
];

interface ChecklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChecklistDrawer = ({ isOpen, onClose }: ChecklistDrawerProps) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentItem = checklist[currentIndex];
  const progress = ((currentIndex + 1) / checklist.length) * 100;
  const allChecked = checklist.every(item => item.checked);

  // Play success sound when all checked
  useEffect(() => {
    if (allChecked && !showCompletion && !getMuted()) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Success chord: C-E-G
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      setTimeout(() => setShowCompletion(true), 400);
    }
  }, [allChecked, showCompletion]);

  const handleAnswer = (answer: boolean) => {
    const updated = [...checklist];
    updated[currentIndex].checked = answer;
    setChecklist(updated);

    // Auto-advance to next question if not last
    if (currentIndex < checklist.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < checklist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleReset = () => {
    setChecklist(initialChecklist);
    setCurrentIndex(0);
    setShowCompletion(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Trade Checklist</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentIndex + 1} of {checklist.length}
          </p>
        </div>

        {/* Question or Completion */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          {showCompletion ? (
            <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500">
              {/* Congratulations Header */}
              <div className="text-center space-y-4 pb-6 border-b border-border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-scale-in">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Ready to Trade!
                </h3>
                <p className="text-muted-foreground">
                  All criteria met - you can place your position
                </p>
              </div>

              {/* All Questions with Checkmarks */}
              <div className="space-y-3">
                {checklist.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 animate-in fade-in duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-foreground flex-1 leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-300">
              <div className="text-center space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <h3 className="text-2xl font-medium text-foreground leading-relaxed">
                  {currentItem.question}
                </h3>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  variant={currentItem.checked === false ? "default" : "outline"}
                  onClick={() => handleAnswer(false)}
                  className="min-w-[120px] gap-2"
                >
                  <X className="h-5 w-5" />
                  No
                </Button>
                <Button
                  size="lg"
                  variant={currentItem.checked === true ? "default" : "outline"}
                  onClick={() => handleAnswer(true)}
                  className="min-w-[120px] gap-2"
                >
                  <Check className="h-5 w-5" />
                  Yes
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Status */}
        <div className="p-6 border-t border-border space-y-4">
          {!showCompletion && (
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === checklist.length - 1}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            Reset Checklist
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChecklistDrawer;
