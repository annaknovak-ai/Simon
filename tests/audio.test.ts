import { describe, expect, it, vi } from 'vitest';
import { COLORS } from '../src/game/engine';
import { TONES, createAudioService } from '../src/audio/audioService';

interface FakeOscillator {
  type: string;
  frequency: number;
  startedAt?: number;
  stoppedAt?: number;
}

// Minimal AudioContext stand-in that records the oscillators it creates.
function fakeContext(state: AudioContextState = 'suspended', currentTime = 2) {
  const oscillators: FakeOscillator[] = [];
  const param = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
  const ctx = {
    state,
    currentTime,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createBuffer: vi.fn(() => ({})),
    createBufferSource: vi.fn(() => ({ buffer: null, connect: vi.fn(), start: vi.fn() })),
    createGain: vi.fn(() => ({ gain: param(), connect: vi.fn() })),
    createOscillator: vi.fn(() => {
      const osc: FakeOscillator = { type: 'sine', frequency: 0 };
      oscillators.push(osc);
      return {
        set type(value: string) {
          osc.type = value;
        },
        frequency: { setValueAtTime: (value: number) => (osc.frequency = value) },
        connect: vi.fn(),
        start: (t: number) => (osc.startedAt = t),
        stop: (t: number) => (osc.stoppedAt = t),
      };
    }),
  };
  return { ctx: ctx as unknown as AudioContext, raw: ctx, oscillators };
}

describe('Audio Service', () => {
  it('has a distinct tone for each of the four colors', () => {
    const freqs = COLORS.map((c) => TONES[c]);
    freqs.forEach((f) => expect(f).toBeGreaterThan(0));
    expect(new Set(freqs).size).toBe(4);
  });

  it('does nothing before unlock', () => {
    const fake = fakeContext();
    const factory = vi.fn(() => fake.ctx);
    const audio = createAudioService(factory);
    expect(() => audio.play('green', 500)).not.toThrow();
    expect(factory).not.toHaveBeenCalled();
    expect(fake.oscillators).toHaveLength(0);
  });

  it('plays the color tone now and stops after the duration', () => {
    const fake = fakeContext('running', 2);
    const audio = createAudioService(() => fake.ctx);
    audio.unlock();
    audio.play('green', 500);
    expect(fake.oscillators).toHaveLength(1);
    const [osc] = fake.oscillators;
    expect(osc.frequency).toBe(TONES.green);
    expect(osc.startedAt).toBe(2);
    expect(osc.stoppedAt).toBeCloseTo(2.5);
  });

  it('resumes a suspended context but not a running one', () => {
    const suspended = fakeContext('suspended');
    createAudioService(() => suspended.ctx).unlock();
    expect(suspended.raw.resume).toHaveBeenCalledTimes(1);

    const running = fakeContext('running');
    createAudioService(() => running.ctx).unlock();
    expect(running.raw.resume).not.toHaveBeenCalled();
  });

  it('creates a single context across several unlocks', () => {
    const fake = fakeContext();
    const factory = vi.fn(() => fake.ctx);
    const audio = createAudioService(factory);
    audio.unlock();
    audio.unlock();
    audio.unlock();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(fake.raw.resume).toHaveBeenCalledTimes(3);
  });

  it('stays silent without throwing when Web Audio is unavailable', () => {
    const audio = createAudioService(() => {
      throw new Error('not supported');
    });
    expect(() => audio.unlock()).not.toThrow();
    expect(() => audio.play('red', 250)).not.toThrow();
  });
});
