// Rubik is bundled locally (no Google Fonts) so it also works offline.
// Only the Hebrew and Latin (digits) subsets are needed.
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-600.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import '@fontsource/rubik/latin-600.css';
import '@fontsource/rubik/latin-700.css';
import './styles/tokens.css';
import './styles/base.css';
import { APP_TITLE } from './appInfo';

// Temporary placeholder page until the game screen is built.
const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const title = document.createElement('h1');
  title.textContent = APP_TITLE;
  app.append(title);
}
