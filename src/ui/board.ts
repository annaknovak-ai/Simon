// Game board drawn as SVG: four triangular segments meeting in the center.
// Color positions are fixed (not mirrored in RTL): yellow top, green right, blue bottom, red left.
import { COLORS, type Color } from '../game/engine';
import { COLOR_NAMES, TEXTS } from './texts';

const SVG_NS = 'http://www.w3.org/2000/svg';

const SEGMENT_POINTS: Record<Color, string> = {
  yellow: '20,10 180,10 100,90',
  green: '190,20 190,180 110,100',
  blue: '180,190 20,190 100,110',
  red: '10,180 10,20 90,100',
};

export interface Board {
  readonly element: HTMLElement;
  setDimmed(dimmed: boolean): void;
  setLocked(locked: boolean): void;
  light(color: Color): void;
  unlight(color: Color): void;
  flashWrong(color: Color): void;
  clear(): void;
}

export function createBoard(onPress: (color: Color) => void): Board {
  const element = document.createElement('div');
  element.className = 'board';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', TEXTS.board);
  svg.innerHTML = `
    <defs>
      <linearGradient id="board-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.28" />
        <stop offset="0.55" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <filter id="board-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>`;

  const segments = {} as Record<Color, SVGGElement>;
  for (const color of COLORS) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `segment segment--${color}`);
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', COLOR_NAMES[color]);
    group.innerHTML = `
      <polygon class="segment__fill" points="${SEGMENT_POINTS[color]}" />
      <polygon class="segment__gloss" points="${SEGMENT_POINTS[color]}" fill="url(#board-gloss)" />`;
    group.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      onPress(color);
    });
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPress(color);
      }
    });
    segments[color] = group;
    svg.append(group);
  }

  // Dark center circle, no text; it ignores clicks (see CSS).
  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('class', 'board__center');
  center.setAttribute('cx', '100');
  center.setAttribute('cy', '100');
  center.setAttribute('r', '26');
  svg.append(center);

  element.append(svg);

  // A lit segment is moved to the top (below the center) so its glow is not hidden by neighbours.
  const raise =(color: Color) => svg.insertBefore(segments[color], center);

  return {
    element,
    setDimmed(dimmed) {
      element.classList.toggle('board--dimmed', dimmed);
    },
    setLocked(locked) {
      element.classList.toggle('board--locked', locked);
      for (const color of COLORS) {
        if (locked) segments[color].removeAttribute('tabindex');
        else segments[color].setAttribute('tabindex', '0');
        segments[color].setAttribute('aria-disabled', String(locked));
      }
    },
    light(color) {
      raise(color);
      segments[color].classList.add('segment--lit');
    },
    unlight(color) {
      segments[color].classList.remove('segment--lit');
    },
    flashWrong(color) {
      segments[color].classList.add('segment--wrong');
    },
    clear() {
      for (const color of COLORS) segments[color].classList.remove('segment--lit', 'segment--wrong');
    },
  };
}
