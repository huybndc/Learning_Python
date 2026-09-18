import { $ } from './dom-helpers.js';

let tabs = [];

/** Bật một tab theo id nút tab, tắt các tab còn lại. */
export function activateTab(id) {
  tabs.forEach(t => {
    const on = t.id === id;
    t.setAttribute('aria-selected', String(on));
    $('#' + t.getAttribute('aria-controls')).classList.toggle('active', on);
  });
}

export function setupTabs() {
  tabs = [...document.querySelectorAll('.tabs button')];
  tabs.forEach(t => t.addEventListener('click', () => activateTab(t.id)));
  const jump = (btn, tab) => $(btn).addEventListener('click', () => {
    activateTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  jump('#goto-kmap', 'tab-kmap');
  jump('#goto-theory', 'tab-theory');
}
