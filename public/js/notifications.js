export function expiredTimers(session, seen, now = Date.now()) {
  if (session?.status !== "active") return [];
  return ["restEnd", "timerEnd"].filter((key) => {
    const end = session[key], token = `${session.id}:${key}:${end}`;
    if (!end || end > now || seen.has(token)) return false;
    seen.add(token); return true;
  });
}

export function createTimerSound(environment = globalThis) {
  let context;
  return {
    unlock() {
      const Audio = environment.AudioContext || environment.webkitAudioContext;
      if (!Audio) return;
      try { context ||= new Audio(); context.resume().catch(() => {}); } catch {}
    },
    play() {
      if (!context || context.state !== "running") return false;
      try {
        const oscillator = context.createOscillator(), gain = context.createGain(), time = context.currentTime;
        oscillator.frequency.value = 880; gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(time); oscillator.stop(time + 0.5); return true;
      } catch { return false; }
    },
  };
}
