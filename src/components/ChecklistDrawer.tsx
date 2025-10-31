import { useState } from "react";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

  const currentItem = checklist[currentIndex];
  const progress = ((currentIndex + 1) / checklist.length) * 100;
  const allChecked = checklist.every(item => item.checked);

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

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
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
        </div>

        {/* Navigation & Status */}
        <div className="p-6 border-t border-border space-y-4">
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

          {allChecked && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center animate-in fade-in duration-300">
              <p className="text-sm font-medium text-primary">
                ✓ All criteria met - Ready to execute trade
              </p>
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
