function getAC(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  try { return new AC() as AudioContext; } catch { return null; }
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume = 0.15,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export function playAddToCart() {
  const ac = getAC();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523, t,        0.10, 0.13);       // C5
  tone(ac, 659, t + 0.09, 0.16, 0.11);       // E5
}

export function playPaymentAccepted() {
  const ac = getAC();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523, t,         0.18, 0.13);      // C5
  tone(ac, 659, t + 0.14,  0.18, 0.13);      // E5
  tone(ac, 784, t + 0.28,  0.32, 0.15);      // G5
}

export function playPaymentRejected() {
  const ac = getAC();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 330, t,         0.18, 0.13, "sawtooth"); // E4
  tone(ac, 196, t + 0.20,  0.28, 0.11, "sawtooth"); // G3
}
