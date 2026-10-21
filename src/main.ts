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
import './styles/home.css';
import { mountHomeScreen } from './ui/homeScreen';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) mountHomeScreen(app);
