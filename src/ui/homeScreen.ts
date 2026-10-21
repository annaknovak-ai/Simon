// Home screen controller: builds the DOM, routes input to the Game Engine,
// owns all timing (sequence playback, success pause, wrong-press flash) and renders each state.
import { createAudioService } from '../audio/audioService';
import { createGame, type Color } from '../game/engine';
import { createBoard } from './board';
import { checkIcon, speakerIcon, trophyIcon, xIcon } from './icons';
import { TEXTS } from './texts';

// Timings from DESIGN.md decisions 1, 8 and 9 (milliseconds).
const PRE_SEQUENCE_PAUSE = 600;
const SEQUENCE_LIT = 500;
const SEQUENCE_GAP = 250;
const PRESS_LIT = 250;
const WRONG_FLASH = 300;
const SUCCESS_PAUSE = 1500;

const CONFETTI_COLORS = ['yellow', 'green', 'blue', 'red', 'yellow', 'blue', 'green', 'red'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountHomeScreen(root: HTMLElement) {
  const game = createGame();
  const audio = createAudioService();
  // Every new game bumps the run id; pending timers from an older run do nothing.
  let runId = 0;
  const timers = new Set<number>();

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        resolve();
      }, ms);
      timers.add(id);
    });

  const cancelTimers = () => {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
  };

  // --- DOM ---
  const decor = el('div', 'decor');
  decor.setAttribute('aria-hidden', 'true');
  for (const corner of ['top-start', 'top-end', 'bottom-start', 'bottom-end']) {
    decor.append(el('span', `decor__triangle decor__triangle--${corner}`));
  }

  const title = el('h1', 'title', TEXTS.title);
  const levelPill = el('div', 'level-pill');
  const scoreBlock = el('div', 'score');
  const scoreLabel = el('div', 'score__label', TEXTS.score);
  const scoreValue = el('div', 'score__value');
  scoreBlock.append(scoreLabel, scoreValue);

  const board = createBoard(handlePress);

  const action = el('div', 'action');
  const statusText = el('p', 'action__status');
  statusText.setAttribute('aria-live', 'polite');
  const speaker = el('span', 'action__speaker');
  speaker.innerHTML = speakerIcon;
  speaker.setAttribute('aria-hidden', 'true');
  const startButton = el('button', 'btn btn--primary', TEXTS.start);
  startButton.type = 'button';
  startButton.addEventListener('click', startGame);
  action.append(statusText, speaker, startButton);

  const result = el('div', 'result');
  result.setAttribute('aria-live', 'polite');

  root.append(decor, title, levelPill, scoreBlock, board.element, action, result);

  // --- Rendering ---
  function setPlaying(visible: boolean) {
    levelPill.hidden = !visible;
    scoreBlock.hidden = !visible;
    board.element.hidden = !visible;
    action.hidden = !visible;
    result.hidden = visible;
  }

  function renderPlaying(status: 'idle' | 'showing-sequence' | 'player-turn') {
    setPlaying(true);
    levelPill.textContent = TEXTS.level(game.currentLevel);
    scoreValue.textContent = String(game.completedLevels);
    board.setDimmed(status === 'showing-sequence');
    board.setLocked(status !== 'player-turn');
    statusText.textContent =
      status === 'idle' ? TEXTS.instructions : status === 'showing-sequence' ? TEXTS.listening : TEXTS.playerTurn;
    speaker.hidden = status !== 'showing-sequence';
    startButton.hidden = status !== 'idle';
  }

  function resultIcon(kind: 'success' | 'fail' | 'won', icon: string) {
    const wrap = el('div', `result__icon-wrap`);
    const circle = el('div', `result__icon result__icon--${kind}`);
    circle.innerHTML = icon;
    wrap.append(circle);
    if (kind === 'success') {
      CONFETTI_COLORS.forEach((color, i) => {
        wrap.append(el('span', `confetti confetti--${color} confetti--${i + 1}`));
      });
    }
    return wrap;
  }

  function stat(label: string, value: number) {
    const block = el('div', 'score');
    block.append(el('div', 'score__label', label), el('div', 'score__value', String(value)));
    return block;
  }

  function playAgainButton(variant: 'danger' | 'info') {
    const button = el('button', `btn btn--${variant}`, TEXTS.playAgain);
    button.type = 'button';
    button.addEventListener('click', startGame);
    return button;
  }

  function renderResult(kind: 'success' | 'fail' | 'won') {
    setPlaying(false);
    result.replaceChildren();
    const score = game.completedLevels;
    if (kind === 'success') {
      result.append(
        resultIcon('success', checkIcon),
        el('h2', 'result__title', TEXTS.successTitle),
        el('p', 'result__subtitle', TEXTS.successSubtitle(score)),
        stat(TEXTS.score, score),
      );
    } else if (kind === 'fail') {
      result.append(
        resultIcon('fail', xIcon),
        el('h2', 'result__title', TEXTS.gameOverTitle),
        el('p', 'result__subtitle', TEXTS.gameOverSubtitle),
        stat(TEXTS.yourScore, score),
        playAgainButton('danger'),
      );
    } else {
      // Personal best is a temporary in-game value until Score Storage arrives (Milestone 3).
      result.append(
        resultIcon('won', trophyIcon),
        el('h2', 'result__title', TEXTS.wonTitle),
        el('p', 'result__subtitle', TEXTS.wonSubtitle),
        stat(TEXTS.finalScore, score),
        stat(TEXTS.personalBest, score),
        playAgainButton('info'),
      );
    }
  }

  // --- Game flow ---
  async function playSequence(run: number) {
    board.clear();
    renderPlaying('showing-sequence');
    await sleep(PRE_SEQUENCE_PAUSE);
    for (const [i, color] of game.sequence.entries()) {
      if (run !== runId) return;
      board.light(color);
      audio.play(color, SEQUENCE_LIT);
      await sleep(SEQUENCE_LIT);
      board.unlight(color);
      if (i < game.sequence.length - 1) await sleep(SEQUENCE_GAP);
    }
    if (run !== runId) return;
    game.finishShowing();
    renderPlaying('player-turn');
  }

  function startGame() {
    // Must run inside the click so browsers allow audio.
    audio.unlock();
    cancelTimers();
    runId++;
    game.start();
    void playSequence(runId);
  }

  async function handlePress(color: Color) {
    const run = runId;
    const outcome = game.press(color);
    if (outcome === 'ignored') return;

    if (outcome === 'wrong') {
      board.setLocked(true);
      board.flashWrong(color);
      await sleep(WRONG_FLASH);
      if (run !== runId) return;
      board.clear();
      renderResult('fail');
      return;
    }

    board.light(color);
    audio.play(color, PRESS_LIT);
    if (outcome !== 'correct') board.setLocked(true);
    await sleep(PRESS_LIT);
    board.unlight(color);
    if (run !== runId) return;

    if (outcome === 'won') {
      renderResult('won');
    } else if (outcome === 'level-complete') {
      renderResult('success');
      await sleep(SUCCESS_PAUSE);
      if (run !== runId) return;
      game.nextLevel();
      await playSequence(run);
    }
  }

  renderPlaying('idle');
}
