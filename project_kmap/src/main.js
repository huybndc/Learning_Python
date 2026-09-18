import './style.css';
import { setupTabs } from './ui/tabs.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';
import { setupPracticePage } from './ui/practice-page.js';
import { setupTheoryPage } from './ui/theory-page.js';

window.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupGrayPage();
  setupKmapPage();
  setupPracticePage();
  setupTheoryPage();
  console.log('%cGray code & K-map', 'font-weight:bold');
});
