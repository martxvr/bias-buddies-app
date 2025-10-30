let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioContext) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      sharedAudioContext = new Ctx();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function useClickSound() {
  const playClick = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Some browsers require resume on user gesture
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const duration = 0.05; // 50ms
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Subtle tick: short envelope and modest volume
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Soft high-ish frequency blip
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2200, now);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  };

  return { playClick };
}


