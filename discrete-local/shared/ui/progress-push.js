import { buildItems } from '../logic/progress-export.js';
import { t } from '../i18n/index.js';

let timer = 0;

/** Đẩy tiến độ của môn hiện tại sang máy chủ dev (ghi ~/study-progress/math.json). Chỉ chạy khi `npm run dev`. */
export function pushProgress(subject, events) {
  if (!import.meta.env?.DEV || typeof fetch !== 'function') return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const items = buildItems(subject, events, (p, k) => t(`${p}.${k}`));
    fetch('/__progress', { method: 'POST', body: JSON.stringify({ subject, items }) }).catch(() => {});
  }, 1500);
}
