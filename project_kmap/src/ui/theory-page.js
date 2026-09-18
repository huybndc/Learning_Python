import { marked } from 'marked';
import { $ } from './dom-helpers.js';
import theoryMd from '../content/theory.md?raw';

/* Tab Lý thuyết: render nội dung Markdown tĩnh trong src/content/theory.md.
   Sửa nội dung học tập ở file .md đó, không cần đụng tới code. */

export function renderTheory(md) {
  return marked.parse(md, { async: false });
}

export function setupTheoryPage() {
  $('#theory-body').innerHTML = renderTheory(theoryMd);
}
