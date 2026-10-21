import { describe, expect, it } from 'vitest';
import { COLORS, MAX_LEVEL, createGame, type Color, type Game } from '../src/game/engine';

// Deterministic random source cycling through the given values.
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

// Replays the current sequence correctly; returns the last press result.
function playLevel(game: Game) {
  game.finishShowing();
  let result = game.press(game.sequence[0]);
  for (let i = 1; i < game.sequence.length; i++) result = game.press(game.sequence[i]);
  return result;
}

function wrongColor(color: Color): Color {
  return COLORS.find((c) => c !== color)!;
}

function snapshot(game: Game) {
  return {
    status: game.status,
    sequence: [...game.sequence],
    currentLevel: game.currentLevel,
    playerInputIndex: game.playerInputIndex,
    completedLevels: game.completedLevels,
  };
}

describe('game engine', () => {
  it('starts idle with an empty sequence', () => {
    const game = createGame();
    expect(game.status).toBe('idle');
    expect(game.sequence).toHaveLength(0);
    expect(game.completedLevels).toBe(0);
  });

  it('start creates a one-color sequence and each level adds exactly one color', () => {
    const game = createGame(seq(0.1, 0.3, 0.6, 0.9));
    game.start();
    expect(game.status).toBe('showing-sequence');
    expect(game.sequence).toHaveLength(1);
    for (let level = 2; level <= 5; level++) {
      const before = [...game.sequence];
      expect(playLevel(game)).toBe('level-complete');
      game.nextLevel();
      expect(game.sequence).toHaveLength(level);
      expect(game.sequence.slice(0, before.length)).toEqual(before);
    }
  });

  it('a correct replay completes the level and moves to the next one', () => {
    const game = createGame(seq(0.2, 0.7));
    game.start();
    expect(playLevel(game)).toBe('level-complete');
    expect(game.status).toBe('transition');
    expect(game.completedLevels).toBe(1);
    game.nextLevel();
    expect(game.currentLevel).toBe(2);
    expect(game.status).toBe('showing-sequence');
    game.finishShowing();
    expect(game.press(game.sequence[0])).toBe('correct');
    expect(game.status).toBe('player-turn');
    expect(game.press(game.sequence[1])).toBe('level-complete');
  });

  it('a wrong press ends the game immediately, even mid-sequence', () => {
    const game = createGame(seq(0.1, 0.4, 0.8));
    game.start();
    playLevel(game);
    game.nextLevel();
    playLevel(game);
    game.nextLevel();
    game.finishShowing();
    expect(game.press(game.sequence[0])).toBe('correct');
    expect(game.press(wrongColor(game.sequence[1]))).toBe('wrong');
    expect(game.status).toBe('game-over');
    expect(game.press(game.sequence[1])).toBe('ignored');
    expect(game.status).toBe('game-over');
  });

  it('ignores input outside player-turn without changing state', () => {
    const game = createGame(seq(0.5));
    const tryPress = () => {
      const before = snapshot(game);
      for (const color of COLORS) expect(game.press(color)).toBe('ignored');
      expect(snapshot(game)).toEqual(before);
    };

    tryPress(); // idle
    game.start();
    tryPress(); // showing-sequence
    playLevel(game);
    tryPress(); // transition
    game.nextLevel();
    game.finishShowing();
    game.press(wrongColor(game.sequence[0]));
    tryPress(); // game-over
  });

  it('scores 0 for a mistake on level 1', () => {
    const game = createGame(seq(0.3));
    game.start();
    game.finishShowing();
    game.press(wrongColor(game.sequence[0]));
    expect(game.completedLevels).toBe(0);
  });

  it('scores 5 for a mistake on level 6', () => {
    const game = createGame(seq(0.1, 0.35, 0.6, 0.85));
    game.start();
    for (let i = 0; i < 5; i++) {
      playLevel(game);
      game.nextLevel();
    }
    expect(game.currentLevel).toBe(6);
    game.finishShowing();
    game.press(wrongColor(game.sequence[0]));
    expect(game.status).toBe('game-over');
    expect(game.completedLevels).toBe(5);
  });

  it('wins after level 10 and never creates level 11', () => {
    const game = createGame(seq(0.05, 0.3, 0.55, 0.8, 0.99));
    game.start();
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(playLevel(game)).toBe('level-complete');
      game.nextLevel();
    }
    expect(playLevel(game)).toBe('won');
    expect(game.status).toBe('won');
    expect(game.completedLevels).toBe(10);
    expect(game.sequence).toHaveLength(10);
    game.nextLevel();
    expect(game.status).toBe('won');
    expect(game.currentLevel).toBe(10);
    expect(game.sequence).toHaveLength(10);
  });

  it('start after game-over or win begins a fresh game', () => {
    const game = createGame(seq(0.2, 0.6));
    game.start();
    playLevel(game);
    game.nextLevel();
    game.finishShowing();
    game.press(wrongColor(game.sequence[0]));
    game.start();
    expect(game.status).toBe('showing-sequence');
    expect(game.currentLevel).toBe(1);
    expect(game.completedLevels).toBe(0);
    expect(game.sequence).toHaveLength(1);
  });

  it('reset returns to idle and ignores presses', () => {
    const game = createGame(seq(0.1, 0.4));
    game.start();
    playLevel(game);
    game.nextLevel();
    game.finishShowing();
    game.press(wrongColor(game.sequence[0]));
    game.reset();
    expect(snapshot(game)).toEqual({
      status: 'idle',
      sequence: [],
      currentLevel: 1,
      playerInputIndex: 0,
      completedLevels: 0,
    });
    expect(game.press('red')).toBe('ignored');
    game.start();
    expect(game.status).toBe('showing-sequence');
  });

  it('only uses the four game colors', () => {
    const game = createGame();
    game.start();
    for (let i = 1; i < MAX_LEVEL; i++) {
      playLevel(game);
      game.nextLevel();
    }
    for (const color of game.sequence) expect(COLORS).toContain(color);
  });
});
