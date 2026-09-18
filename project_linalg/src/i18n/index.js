import { vi } from './vi/index.js';
import { en } from './en/index.js';

/* ---------------------------------------------------------------
   SONG NGỮ VI / EN
   - t(key, params) tra chuỗi; {tên} trong chuỗi được thay bằng params.tên
   - markup tĩnh dùng data-i18n / data-i18n-html / data-i18n-ph / data-i18n-title
   - onLangChange(fn) để mỗi trang tự vẽ lại khi đổi ngôn ngữ
   --------------------------------------------------------------- */

const DICTS = { vi, en };
export const LANGS = ['vi', 'en'];
const STORE_KEY = 'linalg-app-lang';

let lang = 'vi';
try {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved && LANGS.includes(saved)) lang = saved;
} catch { /* private mode: dùng mặc định */ }

const listeners = new Set();

export function getLang() { return lang; }

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORE_KEY, lang); } catch { /* bỏ qua */ }
  document.documentElement.lang = lang;
  applyStaticText();
  listeners.forEach(fn => fn(lang));
}

export function onLangChange(fn) { listeners.add(fn); }

/** Tra chuỗi theo khoá; thiếu khoá thì trả về chính khoá để dễ phát hiện. */
export function t(key, params) {
  const s = DICTS[lang][key] ?? DICTS.vi[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : '{' + k + '}'));
}

/** Dịch một lỗi: AppError thì tra theo mã, lỗi thường thì giữ nguyên message. */
export function tError(e) {
  return e && e.key ? t(e.key, e.params) : (e && e.message) || String(e);
}

/** Điền chuỗi cho toàn bộ markup tĩnh đang có trên trang. */
export function applyStaticText(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}

/** Gắn nút chuyển ngôn ngữ. */
export function setupLangSwitch() {
  document.documentElement.lang = lang;
  document.querySelectorAll('#lang-switch button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    b.addEventListener('click', () => {
      setLang(b.dataset.lang);
      document.querySelectorAll('#lang-switch button').forEach(x => {
        x.setAttribute('aria-pressed', String(x.dataset.lang === lang));
      });
    });
  });
  applyStaticText();
}
