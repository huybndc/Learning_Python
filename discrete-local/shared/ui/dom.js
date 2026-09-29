/* Tiện ích DOM dùng chung cho cả 3 app. */

export const $ = sel => document.querySelector(sel);

/**
 * Tạo phần tử: el('a', { class: 'x', href: '#/', text: '…', onClick }, [con…]).
 * `html` gán innerHTML (chuỗi từ điển có thẻ <b>, <span class="math">).
 * Con là null/false/'' thì bỏ qua, mảng lồng được làm phẳng (toeic D49) —
 * viết `cond && el(…)` hay `cond ? [a, b] : []` ngay trong danh sách con.
 */
export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...[children].flat(Infinity).filter(c => c != null && c !== false && c !== ''));
  return e;
}

/** Phần tử nhanh, chuỗi thứ ba là innerHTML (chữ từ điển có thẻ <b>, <span class="math">). */
export function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/** Như h nhưng chữ thuần (textContent) — số, chữ người dùng gõ, dữ liệu không tin được. */
export function ht(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
