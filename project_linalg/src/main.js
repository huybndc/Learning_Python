import './style.css';
import { setupLangSwitch, onLangChange, getLang } from './i18n/index.js';
import { setupChapterNav } from './ui/chapter-nav.js';
import { mountTheory } from './ui/theory-page.js';
import { setupCh1ExamplePage } from './ui/ch1-example-page.js';
import { setupCh1InteractivePage } from './ui/ch1-interactive-page.js';
import { setupCh1PracticePage } from './ui/ch1-practice-page.js';
import { setupCh2ExamplePage } from './ui/ch2-example-page.js';
import { setupCh2LinesPage } from './ui/ch2-lines-page.js';
import { setupCh2InteractivePage } from './ui/ch2-interactive-page.js';
import { setupCh2PracticePage } from './ui/ch2-practice-page.js';
import { setupCh3ExamplePage } from './ui/ch3-example-page.js';
import { setupCh3SpacesPage } from './ui/ch3-spaces-page.js';
import { setupCh3InteractivePage } from './ui/ch3-interactive-page.js';
import { setupCh3PracticePage } from './ui/ch3-practice-page.js';
import theoryCh1Vi from './content/theory-ch1.vi.md?raw';
import theoryCh1En from './content/theory-ch1.en.md?raw';
import theoryCh2Vi from './content/theory-ch2.vi.md?raw';
import theoryCh2En from './content/theory-ch2.en.md?raw';
import theoryCh3Vi from './content/theory-ch3.vi.md?raw';
import theoryCh3En from './content/theory-ch3.en.md?raw';

const THEORY = {
  vi: { 1: theoryCh1Vi, 2: theoryCh2Vi, 3: theoryCh3Vi },
  en: { 1: theoryCh1En, 2: theoryCh2En, 3: theoryCh3En },
};

window.addEventListener('DOMContentLoaded', () => {
  setupLangSwitch();
  setupChapterNav();
  setupCh1ExamplePage();
  setupCh1InteractivePage();
  setupCh1PracticePage();
  setupCh2ExamplePage();
  setupCh2LinesPage();
  setupCh2InteractivePage();
  setupCh2PracticePage();
  setupCh3ExamplePage();
  setupCh3SpacesPage();
  setupCh3InteractivePage();
  setupCh3PracticePage();

  const mountAllTheory = () => {
    const d = THEORY[getLang()];
    Object.keys(d).forEach(n => mountTheory('#theory-ch' + n + '-body', d[n]));
  };
  mountAllTheory();
  onLangChange(mountAllTheory);
  console.log('%cÔn tập Đại số tuyến tính', 'font-weight:bold');
});
