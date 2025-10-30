import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getMuted, initMuteFromStorage, setMuted } from "@/hooks/useSound";

const MuteToggle = () => {
  const [muted, setMutedState] = useState<boolean>(() => {
    initMuteFromStorage();
    return getMuted();
  });

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { muted?: boolean } | undefined;
      if (detail && typeof detail.muted === "boolean") {
        setMutedState(detail.muted);
      }
    };
    window.addEventListener("app:muteChanged", onChange as EventListener);
    return () => window.removeEventListener("app:muteChanged", onChange as EventListener);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  return (
    <button
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={toggle}
      className="fixed right-4 top-4 z-50 rounded-full border border-border/60 bg-background/50 p-2 text-foreground/70 backdrop-blur hover:text-foreground hover:bg-background/70 transition-colors"
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
};

export default MuteToggle;


