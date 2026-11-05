/* Chat sounds, synthesised with Web Audio (no files to load): a soft rising
   blip when you send, a two-note chime when the team writes. The setting is
   per browser and on by default. */
const KEY = 'embed_chat_sound';
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage off */ }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, gain: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
  return o;
}

export function playChat(kind: 'send' | 'receive') {
  if (typeof window === 'undefined' || !soundOn()) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + 0.01;
    if (kind === 'send') {
      const o = tone(ctx, 620, t, 0.14, 0.09);
      o.frequency.exponentialRampToValueAtTime(980, t + 0.09);
    } else {
      tone(ctx, 880, t, 0.42, 0.11); tone(ctx, 1760, t, 0.2, 0.025);
      tone(ctx, 1318.5, t + 0.12, 0.55, 0.1); tone(ctx, 2637, t + 0.12, 0.22, 0.02);
    }
  } catch { /* no audio: stay silent */ }
}
