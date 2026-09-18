import { $ } from './dom-helpers.js';

/* Điều hướng 2 cấp: Chương (tab ngoài) → 4 mục con (sub-tab).
   Nút nhảy chéo dùng thuộc tính data-goto="<chương>:<mục con>",
   ví dụ data-goto="ch3:interactive". */

let chapterTabs = [];

/** Bật một chương theo id nút tab ngoài (vd 'tab-ch3'). */
export function activateChapter(id) {
  chapterTabs.forEach(t => {
    const on = t.id === id;
    t.setAttribute('aria-selected', String(on));
    $('#' + t.getAttribute('aria-controls')).classList.toggle('active', on);
  });
}

/** Bật một mục con trong một chương, vd activateSub('ch3', 'interactive'). */
export function activateSub(ch, sub) {
  const section = $('#page-' + ch);
  if (!section) return;
  section.querySelectorAll(':scope > .subtabs button').forEach(b => {
    const on = b.id === 'sub-' + ch + '-' + sub;
    b.setAttribute('aria-selected', String(on));
    $('#' + b.getAttribute('aria-controls')).classList.toggle('active', on);
  });
}

/** Nhảy tới một mục con bất kỳ, kể cả khác chương. */
export function goTo(ch, sub) {
  activateChapter('tab-' + ch);
  activateSub(ch, sub);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setupChapterNav() {
  chapterTabs = [...document.querySelectorAll('#chapter-tabs button')];
  chapterTabs.forEach(t => t.addEventListener('click', () => activateChapter(t.id)));

  document.querySelectorAll('.subtabs button').forEach(b => {
    // id dạng sub-<ch>-<sub>
    const [, ch, sub] = b.id.split('-');
    b.addEventListener('click', () => activateSub(ch, sub));
  });

  document.querySelectorAll('[data-goto]').forEach(b => {
    const [ch, sub] = b.dataset.goto.split(':');
    b.addEventListener('click', () => goTo(ch, sub));
  });
}
