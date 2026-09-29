import { $ } from './dom.js';
import { setupLangSwitch, onLangChange, t as T } from '../i18n/index.js';
import { setupScratch } from './scratch.js';
import { startRouter, currentRoute } from './router.js';
import { showRoute } from './screens.js';
import { startSync } from './sync.js';
import { syncProgress } from './store.js';

/* ---------------------------------------------------------------
   KHUNG CHUNG của mỗi app: menu theo việc (Tổng quan · Học · Luyện tập ·
   Thi thử), nút sáng/tối, nút mây đồng bộ (D37), VI/EN, nháp, nút ⓘ thay cho đoạn chữ hướng dẫn.
   main.js của app gọi setupShell(cfg) — cfg mô tả chương và ngân hàng câu.
   --------------------------------------------------------------- */

const THEME_KEY = 'study-theme';

/** Nút sáng/tối. Báo 'themechange' để canvas (đọc màu từ biến CSS) vẽ lại. */
export function setupTheme() {
  const btn = $('#theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch { /* chế độ riêng tư */ }
    window.dispatchEvent(new Event('themechange'));
  });
}

/* ---------------- gợi ý: đoạn .hint → nút ⓘ mở popover ---------------- */

let hintSeq = 0;

/** Đặt popover ngay dưới nút ⓘ, không tràn khỏi màn hình. */
function place(pop, btn) {
  const r = btn.getBoundingClientRect();
  const left = Math.max(16, Math.min(r.left - 12, innerWidth - pop.offsetWidth - 16));
  const below = r.bottom + 8;
  const top = below + pop.offsetHeight > innerHeight - 16 ? r.top - pop.offsetHeight - 8 : below;
  pop.style.left = left + 'px';
  pop.style.top = Math.max(16, top) + 'px';
}

/**
 * Mỗi phần tử .hint (chữ hướng dẫn, vẫn giữ data-i18n nên đổi ngôn ngữ vẫn
 * đúng) thành một popover, mở bằng nút ⓘ cạnh tiêu đề panel chứa nó.
 * Chữ hướng dẫn không còn chiếm chỗ trên màn hình, cần thì mới xem.
 */
export function upgradeHints(root = document) {
  root.querySelectorAll('.hint:not([popover])').forEach(h => {
    h.id ||= 'hint-' + (++hintSeq);
    h.setAttribute('popover', '');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'info';
    btn.textContent = 'i';
    btn.setAttribute('popovertarget', h.id);
    btn.setAttribute('aria-expanded', 'false');
    const head = h.closest('.card')?.querySelector(':scope > h2');
    if (head) head.append(btn); else h.before(btn);
    h.addEventListener('toggle', e => {
      const open = e.newState === 'open';
      btn.setAttribute('aria-expanded', String(open));
      if (open) place(h, btn);
    });
  });
  labelHints();
}

function labelHints() {
  document.querySelectorAll('button.info').forEach(b => {
    b.setAttribute('aria-label', T('shell.hint'));
    b.title = T('shell.hint');
  });
}

/**
 * @param {{ chapters: {id:string, bank?:object, prefix?:string}[], figures?:object,
 *           widgets?:object, lesson?:(chId:string)=>string }} cfg
 */
export function setupShell(cfg) {
  setupLangSwitch();
  setupTheme();
  upgradeHints();
  setupScratch();
  startSync();
  syncProgress();
  startRouter(cfg.chapters.map(c => c.id), r => showRoute(r, cfg));
  onLangChange(() => { showRoute(currentRoute(), cfg); labelHints(); });
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.hint:popover-open').forEach(h => h.hidePopover());
  }, { passive: true });
}
