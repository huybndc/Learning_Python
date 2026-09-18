import './style.css';
import { setupTabs } from './ui/tabs.js';
import { setupGrayPage } from './ui/gray-page.js';
import { setupKmapPage } from './ui/kmap-page.js';

window.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupGrayPage();
  setupKmapPage();
  console.log('%cGray code & K-map', 'font-weight:bold');
});
