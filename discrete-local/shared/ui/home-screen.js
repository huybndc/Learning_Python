import { $, el } from './dom.js';
import { t as T } from '../i18n/index.js';
import { statsOf, minutesSince, recentStats, DAY } from '../logic/progress.js';
import { weekOf, WEEKS, EXAM_WEEKS, daysToMidterm } from '../logic/syllabus.js';
import { loadEvents, save } from './store.js';
import { chapterTitle, roundMinutes, rankedKinds, accCell, row, leadCard, studied } from './choices.js';
import { nextPoint } from '../logic/prereq.js';
import { seekLesson, lessonGraph } from './lesson.js';

/* ---------------------------------------------------------------
   TỔNG QUAN của một môn (D16, D19):
   - điểm nhấn duy nhất: dải 16 tuần + số ngày tới giữa kỳ;
   - MỘT việc chính (gợi ý cần nhất, kèm lý do — toeic D52), việc thứ hai là
     một dòng chữ; số liệu 7 ngày viết thành một dòng, không đóng hộp;
   - không streak: nghỉ vài hôm quay lại không bị "phạt" (toeic D51).
   --------------------------------------------------------------- */

const why = x => (x.reason === 'new' ? T('home.whyNew')
  : x.reason === 'few' ? T('home.whyFew', { n: x.stats.attempts })
    : T('home.whyWeak', { p: Math.round(x.stats.accuracy * 100) }));

function termBlock(now) {
  const week = weekOf(new Date(now));
  const days = daysToMidterm(new Date(now));
  const cells = [];
  for (let w = 1; w <= WEEKS; w++) {
    const exam = EXAM_WEEKS[w];
    const cls = [w < week ? 'past' : '', w === week ? 'now' : '', exam ? 'exam' : ''].filter(Boolean).join(' ');
    // chỉ ghi nhãn ở tuần này và hai mốc thi — 16 con số chen nhau thì không đọc được gì
    const label = exam ? T(exam === 'mid' ? 'home.midShort' : 'home.finalShort') : w === week ? T('home.weekN', { w }) : '';
    cells.push(el('li', { class: cls, title: T('home.weekN', { w }) }, label && el('span', { text: label })));
  }
  return el('div', { class: 'semester' }, [
    el('div', { class: 'term-count' }, days >= 0
      ? [el('b', { text: String(days) }), el('span', { text: T('home.daysToMid') })]
      : [el('b', { text: String(week) }), el('span', { text: T('home.weekOf', { n: WEEKS }) })]),
    el('ol', { class: 'term-track', 'aria-label': T('home.term') }, cells),
  ]);
}

function today(cfg, events, now) {
  const ranked = rankedKinds(cfg, events, now);
  if (!ranked.length) {                    // môn chưa có ngân hàng câu: mời học tiếp chương đang học
    const ch = studied(cfg, events)[0] ?? cfg.chapters[0].id;
    return leadCard({ title: T('home.learnNow'), note: chapterTitle(ch), href: `#/learn/${ch}/theory`, cta: T('learn.start') });
  }
  const [first] = ranked;
  const second = ranked.find(x => x.ch !== first.ch) ?? ranked[1];
  const days = daysToMidterm(new Date(now));
  const alts = [];
  // việc học tiếp theo thứ tự tiên quyết (đồ thị data-needs, D29) — một dòng chữ, không thêm hộp
  const g = lessonGraph(cfg);
  const nx = nextPoint(g, events);
  if (nx) {
    const n = g.get(nx);
    alts.push(el('a', { href: `#/learn/${n.ch}/theory`, onClick: () => seekLesson(n.ch, n.card), text: T('learn.nextCard', { title: n.title }) }));
  }
  if (second) alts.push(...(alts.length ? [' · '] : []), el('a', { href: `#/practice/${second.ch}/${second.kind}`, text: T(`${second.prefix}.${second.kind}`) }), ` (${why(second)})`);
  if (days >= 0 && days <= 21) alts.push(' · ', el('a', { href: '#/exam', text: T('home.midExam') }));
  return leadCard({
    title: T(`${first.prefix}.${first.kind}`),
    note: `${chapterTitle(first.ch)} · ${why(first)} · ~${roundMinutes(first.bank, [first.kind])} ${T('home.min')}`,
    href: `#/practice/${first.ch}/${first.kind}`, cta: T('practice.start'),
    alt: alts.length && el('span', { class: 'alt' }, [T('home.or'), ' ', alts]),
  });
}

export function renderHome(r, cfg) {
  const events = loadEvents();
  const now = Date.now();
  const since = now - 7 * DAY;
  const seconds = Object.fromEntries(cfg.chapters.filter(c => c.bank).map(c => [c.prefix, c.bank.SECONDS]));
  const recent = statsOf(events, { since });
  const stat = (v, label) => el('span', {}, [el('b', { text: v }), label]);

  const chapters = cfg.chapters.filter(c => c.bank).map(c => {
    const tried = c.bank.KINDS.filter(k => statsOf(events, { prefix: c.prefix, kind: k }).attempts > 0).length;
    const a = row({
      href: '#/practice', title: chapterTitle(c.id),
      num: T('home.tried', { a: tried, b: c.bank.KINDS.length }),
      acc: accCell(recentStats(events, { prefix: c.prefix }, now)),
    });
    a.addEventListener('click', () => save('practice-ch', c.id));   // mở Luyện tập đúng chương này
    return a;
  });

  $('#screen-home').replaceChildren(
    el('h1', { text: T('app.short') }),
    el('p', { class: 'subtitle', text: T('app.book') }),
    termBlock(now),
    el('h2', { class: 'section-label', text: T('home.today') }),
    today(cfg, events, now),
    el('div', { class: 'stats-line' }, [
      stat(String(minutesSince(events, seconds, since)), T('home.statMin')),
      stat(recent.accuracy === null ? '—' : `${Math.round(recent.accuracy * 100)}%`, T('home.statAcc')),
      stat(String(recent.attempts), T('home.statQ')),
    ]),
    ...(chapters.length ? [el('h2', { class: 'section-label', text: T('home.byChapter') }), el('div', { class: 'list' }, chapters)] : []),
  );
  return T('nav.home');
}
