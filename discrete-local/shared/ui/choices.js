import { el } from './dom.js';
import { t as T } from '../i18n/index.js';
import { rankNeeds, studiedChapters } from '../logic/progress.js';
import { load, save } from './store.js';

/* ---------------------------------------------------------------
   KHỐI DÙNG CHUNG cho Tổng quan / Học / Luyện tập / Thi thử (D19):
   danh sách kẻ dòng thay lưới thẻ; mỗi dòng nói trước giá phải trả
   (~phút, % đúng) như toeic R1, nhưng gọn thành cột số bên phải.
   --------------------------------------------------------------- */

export const ROUND = 10;
export const chNo = id => id.replace('ch', '');
export const chapterTitle = id => `${T('shell.chapter', { n: chNo(id) })} · ${T('nav.' + id)}`;

/** Phút cho một lượt 10 câu gồm các dạng này (trung bình thời gian chuẩn). */
export function roundMinutes(bank, kinds) {
  const avg = kinds.reduce((s, k) => s + (bank.SECONDS?.[k] ?? 60), 0) / kinds.length;
  return Math.max(1, Math.round((ROUND * avg) / 60));
}

/** "đúng 78% (12 câu, 7 ngày qua)" / "chưa làm câu nào". */
export function accNote(stats) {
  if (stats.accuracy === null) return T('practice.none');
  return T(stats.scope === 'week' ? 'practice.accWeek' : 'practice.accAll',
    { p: Math.round(stats.accuracy * 100), n: stats.attempts });
}

/** Cột % đúng gọn: thanh nhỏ + số, chưa làm thì "—". */
export function accCell(stats) {
  const p = stats.accuracy === null ? null : Math.round(stats.accuracy * 100);
  return el('span', { class: 'row-acc', title: accNote(stats) }, [
    el('span', { class: 'meter' }, p !== null && el('i', { style: `width:${p}%` })),
    el('span', { text: p === null ? '—' : `${p}%` }),
  ]);
}

/** Chương Huy đã học (đã làm câu), mới nhất trước — không đoán theo syllabus (D43). */
export const studied = (cfg, events) => studiedChapters(cfg.chapters, events);

/** Mọi dạng của các chương ĐÃ HỌC (chưa đụng chương nào thì mọi chương), xếp theo độ cần luyện (toeic D52). */
export function rankedKinds(cfg, events, now = Date.now()) {
  const taught = studied(cfg, events);
  const items = cfg.chapters
    .filter(c => c.bank && (!taught.length || taught.includes(c.id)))
    .flatMap(c => c.bank.KINDS.map(kind => ({ ch: c.id, prefix: c.prefix, kind, bank: c.bank })));
  return rankNeeds(events, items, now);
}

/** Một dòng bấm được: tên (+ nhãn) · cột số · cột % · mũi tên. */
export const row = ({ href, title, sub, num, acc, tag }) => el('a', { class: 'entry', href }, [
  el('span', { class: 'row-main' }, [el('b', {}, [title, tag]), sub && el('small', { text: sub })]),
  el('span', { class: 'row-num', text: num ?? '' }),
  acc ?? el('span'),
  el('span', { class: 'row-go', 'aria-hidden': 'true' }),
]);

export const tag = (text, kind = 'hi') => el('span', { class: `tag ${kind}`, text });

/**
 * Khối "việc chính": một dòng tiêu đề + ghi chú + nút màu nhấn; `alt` là lựa chọn thứ hai
 * viết thành một dòng chữ (không thêm hộp nữa).
 */
export const leadCard = ({ title, note, href, cta, alt }) => el('div', { class: 'lead-card' }, [
  el('div', { class: 'lead-main' }, [el('b', { text: title }), el('small', { text: note }), alt]),
  el('a', { class: 'btn primary', href, 'data-icon': 'next' }, el('span', { text: cta })),
]);

/** Hai thẻ đầu mục Luyện tập: luyện theo dạng | bài full 60–90 phút (Thi thử gộp vào đây — D30). */
export const practiceTabs = active => el('nav', { class: 'page-tabs', 'aria-label': T('nav.practice') }, [
  el('a', { href: '#/practice', 'aria-current': active === 'practice' ? 'page' : null, text: T('practice.tabKinds') }),
  el('a', { href: '#/exam', 'aria-current': active === 'exam' ? 'page' : null, text: T('practice.tabFull') }),
]);

/** Cách trả lời đang chọn ở Luyện tập: 'write' (tự luận) | 'choice' (trắc nghiệm) — nhớ theo môn. */
export const answerMode = () => (load('answer-mode', 'write') === 'choice' ? 'choice' : 'write');

/** Thanh chọn Tự luận / Trắc nghiệm (cùng kiểu thanh chọn chương). */
export function modeBar(onChange) {
  const cur = answerMode();
  return el('div', { class: 'chapter-bar mode-bar', role: 'group', 'aria-label': T('practice.mode') },
    ['write', 'choice'].map(m => el('button', {
      type: 'button', 'aria-pressed': String(m === cur),
      onClick: () => { if (m !== cur) { save('answer-mode', m); onChange(); } },
    }, T('practice.mode_' + m))));
}
