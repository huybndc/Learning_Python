import { marked } from 'marked';
import { $ } from './dom-helpers.js';

/* Trang Lý thuyết dùng chung cho mọi chương: render Markdown tĩnh ở
   src/content/theory-chN.md. Sửa nội dung học tập ở file .md, không đụng code. */

export function renderTheory(md) {
  return marked.parse(md, { async: false });
}

/** Gắn nội dung .md đã render vào một mount point, vd '#theory-ch3-body'. */
export function mountTheory(sel, md) {
  const host = $(sel);
  if (host) host.innerHTML = renderTheory(md);
}
