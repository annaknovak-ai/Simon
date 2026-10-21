// Score Storage: the only module that touches Local Storage (pure module, no DOM).
// Values are untrusted input: only whole numbers 0-10 are accepted.
// If storage is unavailable, values live in memory for the current page load only.
import { MAX_LEVEL } from '../game/engine';

export const LAST_RESULT_KEY = 'simon.lastResult';
export const BEST_SCORE_KEY = 'simon.bestScore';

// null = no saved value yet.
export interface Scores {
  lastResult: number | null;
  bestScore: number | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ScoreStorage {
  read(): Scores;
  recordResult(score: number): Scores;
}

const VALID = /^(?:[0-9]|10)$/;

export function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_LEVEL;
}

function parse(raw: string | null): number | null {
  return raw !== null && VALID.test(raw) ? Number(raw) : null;
}

const defaultStorage = (): StorageLike => window.localStorage;

export function createScoreStorage(getStorage: () => StorageLike = defaultStorage): ScoreStorage {
  // In-memory fallback, used once any write fails.
  let memory: Scores | null = null;

  const storage = (): StorageLike | null => {
    try {
      return getStorage() ?? null;
    } catch {
      return null;
    }
  };

  const readKey = (key: string): number | null => {
    try {
      return parse(storage()?.getItem(key) ?? null);
    } catch {
      return null;
    }
  };

  const read = (): Scores =>
    memory ? { ...memory } : { lastResult: readKey(LAST_RESULT_KEY), bestScore: readKey(BEST_SCORE_KEY) };

  return {
    read,

    recordResult(score) {
      const current = read();
      if (!isValidScore(score)) return current;
      const next: Scores = {
        lastResult: score,
        bestScore: current.bestScore === null || score > current.bestScore ? score : current.bestScore,
      };
      try {
        const s = storage();
        if (!s) throw new Error('Local Storage unavailable');
        s.setItem(LAST_RESULT_KEY, String(next.lastResult));
        s.setItem(BEST_SCORE_KEY, String(next.bestScore));
        memory = null;
      } catch {
        memory = next;
      }
      return { ...next };
    },
  };
}
