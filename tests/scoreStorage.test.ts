import { describe, expect, it } from 'vitest';
import {
  BEST_SCORE_KEY,
  LAST_RESULT_KEY,
  createScoreStorage,
  type StorageLike,
} from '../src/storage/scoreStorage';

// Simple in-memory Local Storage stand-in.
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
  return { storage, data };
}

describe('scoreStorage', () => {
  it('returns null for both values when nothing is saved', () => {
    const { storage } = fakeStorage();
    expect(createScoreStorage(() => storage).read()).toEqual({ lastResult: null, bestScore: null });
  });

  it('updates the last result', () => {
    const { storage, data } = fakeStorage();
    const scores = createScoreStorage(() => storage);
    expect(scores.recordResult(5).lastResult).toBe(5);
    expect(data.get(LAST_RESULT_KEY)).toBe('5');
    expect(scores.read().lastResult).toBe(5);
  });

  it('sets the first best score from the first result', () => {
    const { storage, data } = fakeStorage();
    expect(createScoreStorage(() => storage).recordResult(3).bestScore).toBe(3);
    expect(data.get(BEST_SCORE_KEY)).toBe('3');
  });

  it('raises the best score only when the new result is higher', () => {
    const { storage } = fakeStorage({ [BEST_SCORE_KEY]: '7' });
    const scores = createScoreStorage(() => storage);
    expect(scores.recordResult(4)).toEqual({ lastResult: 4, bestScore: 7 });
    expect(scores.recordResult(7)).toEqual({ lastResult: 7, bestScore: 7 });
    expect(scores.recordResult(9)).toEqual({ lastResult: 9, bestScore: 9 });
    expect(scores.read()).toEqual({ lastResult: 9, bestScore: 9 });
  });

  it('treats 0 as a real result', () => {
    const { storage } = fakeStorage();
    const scores = createScoreStorage(() => storage);
    expect(scores.recordResult(0)).toEqual({ lastResult: 0, bestScore: 0 });
    expect(scores.read()).toEqual({ lastResult: 0, bestScore: 0 });
  });

  it.each(['abc', '', '3.5', '-1', '11', '1e1', ' 5', '05'])('reads corrupt value %j as no data', (raw) => {
    const { storage } = fakeStorage({ [LAST_RESULT_KEY]: raw, [BEST_SCORE_KEY]: raw });
    expect(createScoreStorage(() => storage).read()).toEqual({ lastResult: null, bestScore: null });
  });

  it('replaces a corrupt best score with the new result', () => {
    const { storage } = fakeStorage({ [BEST_SCORE_KEY]: '99' });
    expect(createScoreStorage(() => storage).recordResult(2).bestScore).toBe(2);
  });

  it('reads the edge values 0 and 10', () => {
    const { storage } = fakeStorage({ [LAST_RESULT_KEY]: '0', [BEST_SCORE_KEY]: '10' });
    expect(createScoreStorage(() => storage).read()).toEqual({ lastResult: 0, bestScore: 10 });
  });

  it('does not save an invalid score', () => {
    const { storage, data } = fakeStorage();
    const scores = createScoreStorage(() => storage);
    scores.recordResult(11);
    scores.recordResult(2.5);
    expect(data.size).toBe(0);
  });

  it('keeps values across page loads (new instance, same storage)', () => {
    const { storage } = fakeStorage();
    createScoreStorage(() => storage).recordResult(6);
    expect(createScoreStorage(() => storage).read()).toEqual({ lastResult: 6, bestScore: 6 });
  });

  describe('when Local Storage is unavailable', () => {
    const throwingAccess = () => {
      throw new Error('SecurityError');
    };
    const throwingMethods: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    it.each([
      ['access throws', throwingAccess],
      ['getItem/setItem throw', () => throwingMethods],
    ])('%s: does not throw and keeps values in memory only', (_name, getStorage) => {
      const scores = createScoreStorage(getStorage);
      expect(scores.read()).toEqual({ lastResult: null, bestScore: null });
      expect(scores.recordResult(4)).toEqual({ lastResult: 4, bestScore: 4 });
      expect(scores.recordResult(2)).toEqual({ lastResult: 2, bestScore: 4 });
      expect(scores.read()).toEqual({ lastResult: 2, bestScore: 4 });
      // A reload starts with nothing saved.
      expect(createScoreStorage(getStorage).read()).toEqual({ lastResult: null, bestScore: null });
    });

    it('setItem fails but getItem works: memory values win for this load', () => {
      const { storage } = fakeStorage({ [LAST_RESULT_KEY]: '8', [BEST_SCORE_KEY]: '8' });
      const readOnly: StorageLike = {
        getItem: storage.getItem,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      };
      const scores = createScoreStorage(() => readOnly);
      expect(scores.recordResult(3)).toEqual({ lastResult: 3, bestScore: 8 });
      expect(scores.read()).toEqual({ lastResult: 3, bestScore: 8 });
    });
  });
});
