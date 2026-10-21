// Game Engine: the Simon state machine (pure module, no DOM, no timers).

export type Color = 'yellow' | 'green' | 'blue' | 'red';
export const COLORS: readonly Color[] = ['yellow', 'green', 'blue', 'red'];

export type Status =
  | 'idle'
  | 'showing-sequence'
  | 'player-turn'
  | 'transition'
  | 'game-over'
  | 'won';

export type PressResult = 'ignored' | 'correct' | 'level-complete' | 'won' | 'wrong';

export const MAX_LEVEL = 10;

export interface Game {
  readonly status: Status;
  readonly sequence: readonly Color[];
  readonly currentLevel: number;
  readonly playerInputIndex: number;
  readonly completedLevels: number;
  start(): void;
  finishShowing(): void;
  press(color: Color): PressResult;
  nextLevel(): void;
  reset(): void;
}

// `random` returns a number in [0, 1), like Math.random; injectable for tests.
export function createGame(random: () => number = Math.random): Game {
  let status: Status = 'idle';
  let sequence: Color[] = [];
  let currentLevel = 1;
  let playerInputIndex = 0;
  let completedLevels = 0;

  const randomColor = (): Color => COLORS[Math.floor(random() * COLORS.length) % COLORS.length];

  return {
    get status() {
      return status;
    },
    get sequence() {
      return sequence;
    },
    get currentLevel() {
      return currentLevel;
    },
    get playerInputIndex() {
      return playerInputIndex;
    },
    get completedLevels() {
      return completedLevels;
    },

    start() {
      if (status !== 'idle' && status !== 'game-over' && status !== 'won') return;
      sequence = [randomColor()];
      currentLevel = 1;
      playerInputIndex = 0;
      completedLevels = 0;
      status = 'showing-sequence';
    },

    finishShowing() {
      if (status !== 'showing-sequence') return;
      playerInputIndex = 0;
      status = 'player-turn';
    },

    press(color) {
      if (status !== 'player-turn') return 'ignored';
      if (color !== sequence[playerInputIndex]) {
        status = 'game-over';
        return 'wrong';
      }
      playerInputIndex++;
      if (playerInputIndex < sequence.length) return 'correct';
      completedLevels++;
      if (currentLevel >= MAX_LEVEL) {
        status = 'won';
        return 'won';
      }
      status = 'transition';
      return 'level-complete';
    },

    nextLevel() {
      if (status !== 'transition') return;
      sequence = [...sequence, randomColor()];
      currentLevel++;
      playerInputIndex = 0;
      status = 'showing-sequence';
    },

    // Back to the start screen state (used when returning from the About screen).
    reset() {
      status = 'idle';
      sequence = [];
      currentLevel = 1;
      playerInputIndex = 0;
      completedLevels = 0;
    },
  };
}
