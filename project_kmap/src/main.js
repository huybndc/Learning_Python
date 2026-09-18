import './style.css';
import { setupLangSwitch, onLangChange, getLang } from './i18n/index.js';
import { setupChapterNav } from './ui/chapter-nav.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';
import { setupPracticePage } from './ui/practice-page.js';
import { mountTheory } from './ui/theory-page.js';
import { setupCh1ExamplePage } from './ui/ch1-example-page.js';
import theoryCh1Vi from './content/theory-ch1.vi.md?raw';
import theoryCh1En from './content/theory-ch1.en.md?raw';
import { setupCh1CodesPage } from './ui/ch1-codes-page.js';
import { setupCh1InteractivePage } from './ui/ch1-interactive-page.js';
import { setupCh1PracticePage } from './ui/ch1-practice-page.js';
import { setupCh2ExamplePage } from './ui/ch2-example-page.js';
import { setupCh2InteractivePage } from './ui/ch2-interactive-page.js';
import { setupCh2PracticePage } from './ui/ch2-practice-page.js';
import theoryCh2Vi from './content/theory-ch2.vi.md?raw';
import theoryCh2En from './content/theory-ch2.en.md?raw';
import theoryCh3Vi from './content/theory-ch3.vi.md?raw';
import theoryCh3En from './content/theory-ch3.en.md?raw';

window.addEventListener('DOMContentLoaded', () => {
  setupLangSwitch();
  setupChapterNav();
  setupGrayPage();
  setupKmapPage();
  setupPracticePage();
  setupCh1ExamplePage();
  setupCh1CodesPage();
  setupCh1InteractivePage();
  setupCh1PracticePage();
  setupCh2ExamplePage();
  setupCh2InteractivePage();
  setupCh2PracticePage();
  const THEORY = {
    vi: { 1: theoryCh1Vi, 2: theoryCh2Vi, 3: theoryCh3Vi },
    en: { 1: theoryCh1En, 2: theoryCh2En, 3: theoryCh3En },
  };
  const mountAllTheory = () => {
    const d = THEORY[getLang()];
    [1, 2, 3].forEach(i => mountTheory('#theory-ch' + i + '-body', d[i]));
  };
  mountAllTheory();
  onLangChange(mountAllTheory);
  console.log('%cÔn tập Logic Circuit', 'font-weight:bold');
});
