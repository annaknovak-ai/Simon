// About screen: shows the last result and personal best from Score Storage.
import type { ScoreStorage } from '../storage/scoreStorage';
import { chevronIcon, starIcon, trophyIcon } from './icons';
import { TEXTS } from './texts';

interface AboutOptions {
  storage: ScoreStorage;
  onBack: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountAboutScreen(root: HTMLElement, { storage, onBack }: AboutOptions) {
  const header = el('header', 'about__header');
  const backButton = el('button', 'about__back');
  backButton.type = 'button';
  backButton.setAttribute('aria-label', TEXTS.back);
  backButton.innerHTML = chevronIcon;
  backButton.addEventListener('click', onBack);
  header.append(backButton, el('h1', 'about__title', TEXTS.about));

  function card(label: string, icon: string) {
    const node = el('div', 'about-card');
    const text = el('div', 'about-card__text');
    const value = el('div', 'about-card__value');
    text.append(el('div', 'about-card__label', label), value);
    const iconBox = el('div', 'about-card__icon');
    iconBox.innerHTML = icon;
    iconBox.setAttribute('aria-hidden', 'true');
    node.append(text, iconBox);
    return { node, value };
  }

  const last = card(TEXTS.lastResult, trophyIcon);
  const best = card(TEXTS.bestScore, starIcon);
  const cards = el('div', 'about__cards');
  cards.append(last.node, best.node);

  root.append(header, cards);

  const format = (value: number | null) => (value === null ? TEXTS.noValue : String(value));

  // Re-read storage every time the screen opens, so values are always current.
  function show() {
    const scores = storage.read();
    last.value.textContent = format(scores.lastResult);
    best.value.textContent = format(scores.bestScore);
  }

  return { show };
}
