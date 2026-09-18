import './style.css';
import { setupChapterNav } from './ui/chapter-nav.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';
import { setupPracticePage } from './ui/practice-page.js';
import { mountTheory } from './ui/theory-page.js';
import theoryCh3 from './content/theory-ch3.md?raw';

window.addEventListener('DOMContentLoaded', () => {
  setupChapterNav();
  setupGrayPage();
  setupKmapPage();
  setupPracticePage();
  mountTheory('#theory-ch3-body', theoryCh3);
  console.log('%cÔn tập Logic Circuit', 'font-weight:bold');
});
