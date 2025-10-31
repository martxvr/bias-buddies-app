let sharedAudioContext: AudioContext | null = null;
let globalMuted = false;

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
  type BiasState = "neutral" | "bullish" | "bearish";
  const playClick = (bias?: BiasState) => {
    if (globalMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Some browsers require resume on user gesture
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const duration = 0.1; // 100ms
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Subtiele envelope en volume
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Toon per bias (sine, smooth)
    const freq = bias === "bullish" ? 600 : bias === "bearish" ? 300 : 400;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  };

  return { playClick };
}

export function setMuted(muted: boolean) {
  globalMuted = muted;
  try {
    window.localStorage.setItem("app-muted", muted ? "1" : "0");
    window.dispatchEvent(new CustomEvent("app:muteChanged", { detail: { muted } }));
  } catch {}
}

export function getMuted() {
  return globalMuted;
}

export function initMuteFromStorage() {
  try {
    const v = window.localStorage.getItem("app-muted");
    globalMuted = v === "1";
  } catch {
    globalMuted = false;
  }
}


