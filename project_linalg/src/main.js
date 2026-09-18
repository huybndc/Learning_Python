import './style.css';
import { setupLangSwitch, onLangChange, getLang } from './i18n/index.js';
import { setupChapterNav } from './ui/chapter-nav.js';
import { mountTheory } from './ui/theory-page.js';
import { setupCh1ExamplePage } from './ui/ch1-example-page.js';
import { setupCh1InteractivePage } from './ui/ch1-interactive-page.js';
import { setupCh1PracticePage } from './ui/ch1-practice-page.js';
import theoryCh1Vi from './content/theory-ch1.vi.md?raw';
import theoryCh1En from './content/theory-ch1.en.md?raw';

const THEORY = {
  vi: { 1: theoryCh1Vi },
  en: { 1: theoryCh1En },
};

window.addEventListener('DOMContentLoaded', () => {
  setupLangSwitch();
  setupChapterNav();
  setupCh1ExamplePage();
  setupCh1InteractivePage();
  setupCh1PracticePage();

  const mountAllTheory = () => {
    const d = THEORY[getLang()];
    Object.keys(d).forEach(n => mountTheory('#theory-ch' + n + '-body', d[n]));
  };
  mountAllTheory();
  onLangChange(mountAllTheory);
  console.log('%cÔn tập Đại số tuyến tính', 'font-weight:bold');
});
