import './style.css';
import { setupChapterNav } from './ui/chapter-nav.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';
import { setupPracticePage } from './ui/practice-page.js';
import { mountTheory } from './ui/theory-page.js';
import { setupCh1ExamplePage } from './ui/ch1-example-page.js';
import theoryCh1 from './content/theory-ch1.md?raw';
import theoryCh3 from './content/theory-ch3.md?raw';

window.addEventListener('DOMContentLoaded', () => {
  setupChapterNav();
  setupGrayPage();
  setupKmapPage();
  setupPracticePage();
  setupCh1ExamplePage();
  mountTheory('#theory-ch1-body', theoryCh1);
  mountTheory('#theory-ch3-body', theoryCh3);
  console.log('%cÔn tập Logic Circuit', 'font-weight:bold');
});
