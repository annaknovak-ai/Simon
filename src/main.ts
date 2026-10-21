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
import './styles/about.css';
import { createScoreStorage } from './storage/scoreStorage';
import { mountAboutScreen } from './ui/aboutScreen';
import { mountHomeScreen } from './ui/homeScreen';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  // Corner decoration, shared by both screens.
  const decor = document.createElement('div');
  decor.className = 'decor';
  decor.setAttribute('aria-hidden', 'true');
  for (const corner of ['top-start', 'top-end', 'bottom-start', 'bottom-end']) {
    const triangle = document.createElement('span');
    triangle.className = `decor__triangle decor__triangle--${corner}`;
    decor.append(triangle);
  }

  const homeSection = document.createElement('section');
  homeSection.className = 'screen screen--home';
  const aboutSection = document.createElement('section');
  aboutSection.className = 'screen screen--about';
  aboutSection.hidden = true;
  app.append(decor, homeSection, aboutSection);

  // Both screens are built once and swapped by hiding/showing (no URL change).
  const storage = createScoreStorage();
  const home = mountHomeScreen(homeSection, {
    storage,
    onAbout: () => {
      about.show();
      homeSection.hidden = true;
      aboutSection.hidden = false;
      window.scrollTo(0, 0);
    },
  });
  const about = mountAboutScreen(aboutSection, {
    storage,
    onBack: () => {
      home.showIdle();
      aboutSection.hidden = true;
      homeSection.hidden = false;
      window.scrollTo(0, 0);
    },
  });
}
