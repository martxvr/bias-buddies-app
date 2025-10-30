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
  const playClick = () => {
    if (globalMuted) return;
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


