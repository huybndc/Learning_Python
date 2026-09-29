import { pushProgress } from './progress-push.js';

/* ---------------------------------------------------------------
   LƯU TRONG TRÌNH DUYỆT — 3 app chung một origin nên khoá luôn có tên môn
   (`progress:logic`, `exam:linalg`…) như CLAUDE.md yêu cầu. Chế độ riêng tư /
   đầy bộ nhớ thì lặng lẽ bỏ qua: app vẫn chạy, chỉ không nhớ.
   --------------------------------------------------------------- */

export const subjectOf = () => document.documentElement.dataset.subject || 'home';

export function load(key, fallback, subject = subjectOf()) {
  try {
    const v = localStorage.getItem(`${key}:${subject}`);
    return v == null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}

export function save(key, value, subject = subjectOf()) {
  try { localStorage.setItem(`${key}:${subject}`, JSON.stringify(value)); } catch { /* riêng tư / đầy */ }
}

export function drop(key, subject = subjectOf()) {
  try { localStorage.removeItem(`${key}:${subject}`); } catch { /* riêng tư */ }
}

/** Nhật ký làm bài của môn (shared/logic/progress.js đọc). */
export const loadEvents = (subject) => load('progress', [], subject);

/** Ghi một hoặc nhiều sự kiện { prefix, kind, ok, mode } — thêm dấu thời gian. */
export function record(list) {
  const all = loadEvents();
  const now = Date.now();
  for (const e of [].concat(list)) all.push({ ts: now, ...e });
  save('progress', all);
  pushProgress(subjectOf(), all);
}

/** Đẩy nhật ký sẵn có (mở app lần đầu sau khi bật tính năng). */
export const syncProgress = () => pushProgress(subjectOf(), loadEvents());
