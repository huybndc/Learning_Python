import './style.css';
import { setupChapterNav } from './ui/chapter-nav.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';
import { setupPracticePage } from './ui/practice-page.js';
import { mountTheory } from './ui/theory-page.js';
import { setupCh1ExamplePage } from './ui/ch1-example-page.js';
import theoryCh1 from './content/theory-ch1.md?raw';
import { setupCh1InteractivePage } from './ui/ch1-interactive-page.js';
import { setupCh1PracticePage } from './ui/ch1-practice-page.js';
import { setupCh2ExamplePage } from './ui/ch2-example-page.js';
import theoryCh2 from './content/theory-ch2.md?raw';
import theoryCh3 from './content/theory-ch3.md?raw';

window.addEventListener('DOMContentLoaded', () => {
  setupChapterNav();
  setupGrayPage();
  setupKmapPage();
  setupPracticePage();
  setupCh1ExamplePage();
  setupCh1InteractivePage();
  setupCh1PracticePage();
  setupCh2ExamplePage();
  mountTheory('#theory-ch1-body', theoryCh1);
  mountTheory('#theory-ch2-body', theoryCh2);
  mountTheory('#theory-ch3-body', theoryCh3);
  console.log('%cÔn tập Logic Circuit', 'font-weight:bold');
});
