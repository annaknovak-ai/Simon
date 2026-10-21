// Audio Service: four tones generated with the Web Audio API (no audio files).
// The AudioContext is created / resumed inside the Start click to satisfy browser autoplay rules.
import type { Color } from '../game/engine';

// Frequencies (Hz) inspired by the original Simon game.
export const TONES: Record<Color, number> = {
  green: 415,
  red: 310,
  yellow: 252,
  blue: 209,
};

const VOLUME = 0.3;
const ATTACK = 0.01;
const RELEASE = 0.04;

export interface AudioService {
  unlock(): void;
  play(color: Color, durationMs: number): void;
}

function defaultContext(): AudioContext {
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio API not supported');
  return new Ctor();
}

export function createAudioService(createContext: () => AudioContext = defaultContext): AudioService {
  let ctx: AudioContext | null = null;
  let failed = false;

  const resume = (context: AudioContext) => {
    if (context.state === 'running') return;
    try {
      void context.resume().catch(() => {});
    } catch {
      // Ignore: the game keeps working silently.
    }
  };

  return {
    unlock() {
      if (failed) return;
      if (!ctx) {
        try {
          ctx = createContext();
        } catch {
          failed = true;
          return;
        }
        resume(ctx);
        // A tiny silent buffer unlocks audio on iOS Safari within the user gesture.
        try {
          const source = ctx.createBufferSource();
          source.buffer = ctx.createBuffer(1, 1, 22050);
          source.connect(ctx.destination);
          source.start(0);
        } catch {
          // Ignore.
        }
        return;
      }
      resume(ctx);
    },

    play(color, durationMs) {
      if (!ctx) return;
      try {
        const start = ctx.currentTime;
        const end = start + durationMs / 1000;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(TONES[color], start);
        // Short envelope to avoid clicks.
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(VOLUME, start + ATTACK);
        gain.gain.setValueAtTime(VOLUME, Math.max(start + ATTACK, end - RELEASE));
        gain.gain.linearRampToValueAtTime(0, end);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end);
      } catch {
        // Ignore: the game keeps working silently.
      }
    },
  };
}
