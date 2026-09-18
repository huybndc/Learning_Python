import './style.css';
import { setupTabs } from './ui/tabs.js';
import { setupGrayPage } from './ui/gray-page.js';

window.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupGrayPage();
  console.log('%cGray code & K-map', 'font-weight:bold');
});
