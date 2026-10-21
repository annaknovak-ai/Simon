// All Hebrew UI strings in one place.
import { APP_TITLE } from '../appInfo';
import { MAX_LEVEL, type Color } from '../game/engine';

export const TEXTS = {
  title: APP_TITLE,
  level: (level: number) => `שלב ${level} מתוך ${MAX_LEVEL}`,
  score: 'ניקוד',
  instructions: 'צפו ברצף הצבעים ושחזרו אותו לפי הסדר',
  start: 'התחל',
  listening: 'מקשיב לרצף...',
  playerTurn: 'תור השחקן',
  successTitle: 'כל הכבוד!',
  successSubtitle: (level: number) => `השלמת את שלב ${level}`,
  gameOverTitle: 'ניסיון נכשל!',
  gameOverSubtitle: 'הסתיים המשחק',
  yourScore: 'הניקוד שלך',
  wonTitle: 'סיימת את המשחק!',
  wonSubtitle: `הגעת לשלב ${MAX_LEVEL} מתוך ${MAX_LEVEL}`,
  finalScore: 'ניקוד סופי',
  personalBest: 'שיא אישי',
  playAgain: 'שחק שוב',
  board: 'לוח המשחק',
} as const;

export const COLOR_NAMES: Record<Color, string> = {
  yellow: 'צהוב',
  green: 'ירוק',
  blue: 'כחול',
  red: 'אדום',
};
