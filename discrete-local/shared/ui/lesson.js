import { marked } from 'marked';
import { splitCards, kindCards } from '../logic/cards.js';
import { mountPoint } from './kpoint.js';
import { t as T } from '../i18n/index.js';
import { load, save, loadEvents } from './store.js';
import { pointKeys, isPassed, cardPassed } from '../logic/knowledge.js';
import { buildGraph, weakestPrereq } from '../logic/prereq.js';
import { getLang } from '../i18n/index.js';
import { h } from './dom.js';

/* ---------------------------------------------------------------
   TAB "HỌC": bài lý thuyết Markdown hiện thành THẺ, mỗi thẻ một ý.
   - Thanh tiến độ bấm được, nút thẻ trước/sau, phím ← → khi tab đang mở.
   - "Xem cả chương" trải hết các thẻ ra để đọc lướt / ôn nhanh.
   - <div data-check="c1q:convert:toDec"></div> trong Markdown thành một ĐIỂM KIẾN THỨC
     (ui/kpoint.js): ví dụ mẫu hiện từng bước → tự làm tới khi đúng 2 câu liên tiếp.
     Thanh tiến độ tô xanh thẻ đã qua.
   Nội dung vẫn sửa ở file .md như cũ, không đụng code.
   --------------------------------------------------------------- */

const STATE = new WeakMap();          // host → { i, all, runners }
const BY_CHAPTER = {};                // chương → trạng thái bài học đang gắn (để mở đúng thẻ từ nơi khác)

/** Mở bài học của chương ở thẻ i (gọi trước khi chuyển sang #/learn/chN/theory). */
export function seekLesson(chapter, i) {
  save('lesson-' + chapter, i);
  const st = BY_CHAPTER[chapter];
  if (st) { st.i = i; st.all = false; st.redraw?.(); }
}

/** Đồ thị tiên quyết của cả môn (dựng từ bài học các chương, nhớ theo ngôn ngữ) — shared/logic/prereq.js. */
const GRAPHS = new Map();
export function lessonGraph(cfg) {
  const key = getLang() + ':' + cfg.chapters.map(c => c.id).join();
  if (!GRAPHS.has(key)) {
    GRAPHS.set(key, buildGraph(cfg.chapters.map(c => ({ ch: c.id, md: cfg.lesson?.(c.id) ?? '' }))));
  }
  return GRAPHS.get(key);
}

/** Link mở một thẻ: { href, title, open }. */
const cardLink = (ch, i, title) => ({ href: `#/learn/${ch}/theory`, title, open: () => seekLesson(ch, i) });

/**
 * Thẻ bài học để ôn lại một dạng câu: { href, title, open, root? } hoặc null.
 * Tra bằng data-check / data-also trong Markdown (shared/logic/cards.js kindCards).
 * root = điểm tiên quyết gần nhất đang yếu (đồ thị data-needs) — "gốc có thể" của lỗi, kèm % đúng.
 */
export function reviewOf(cfg, prefix, kind, tag) {
  const c = cfg.chapters.find(x => x.prefix === prefix);
  const md = c && cfg.lesson?.(c.id);
  const map = md ? kindCards(md) : new Map();
  const i = (tag && map.get(`${prefix}:${kind}:${tag}`)) ?? map.get(`${prefix}:${kind}`);   // nhãn: thẻ riêng cho một kiểu câu của dạng
  if (i == null) return null;
  const card = splitCards(md).cards[i];
  const out = cardLink(c.id, i, card.title);
  const g = lessonGraph(cfg);
  const node = [`${prefix}:${kind}:${tag}`, `${prefix}:${kind}`, ...pointKeys(card.body)].find(k => g.has(k));
  const weak = node && weakestPrereq(g, node, loadEvents());
  if (weak) {
    const n = g.get(weak.key);
    out.root = { ...cardLink(n.ch, n.card, n.title), acc: weak.acc };
  }
  return out;
}

/** Gắn điểm kiến thức vào các chỗ data-check trong một vùng vừa vẽ. */
function mountChecks(root, st, { banks, figures, widgets }, { onPass, passLabel, onResult }) {
  const events = loadEvents();
  root.querySelectorAll('[data-check]').forEach(el => {
    el.classList.add('lesson-check');
    for (const key of pointKeys(`data-check="${el.dataset.check}"`)) {
      const [prefix, kind] = key.split(':');
      const bank = banks[prefix];
      if (!bank || !bank.KINDS.includes(kind)) continue;
      const box = h('div');
      el.append(box);
      st.runners.push(mountPoint(box, { key, bank, prefix, figures, widgets, passed: isPassed(events, key), onPass, passLabel, onResult }));
    }
  });
}

function cardEl(card) {
  const a = h('article', 'lesson-card card');
  a.append(h('h2', null, card.title), h('div', 'lesson-body', marked.parse(card.body, { async: false })));
  return a;
}

/**
 * Vẽ bài học vào `host`. Gọi lại được (vd khi đổi ngôn ngữ): giữ nguyên thẻ đang xem.
 * @param {HTMLElement} host
 * @param {string} md
 * @param {{ chapter: string, banks?: object, figures?: object, widgets?: object }} opts
 */
export function mountLesson(host, md, opts = {}) {
  const { intro, cards } = splitCards(md);
  // nhớ thẻ đang xem theo chương: mục Học hiện "đang ở thẻ 5", mở lại là về đúng chỗ
  const st = STATE.get(host) || { i: load('lesson-' + opts.chapter, 0), all: false, runners: [] };
  STATE.set(host, st);
  BY_CHAPTER[opts.chapter] = st;
  st.i = Math.min(st.i, cards.length - 1);
  const ctx = { banks: opts.banks || {}, figures: opts.figures || {}, widgets: opts.widgets || {} };

  const draw = () => {
    save('lesson-' + opts.chapter, st.i);
    st.runners.forEach(r => r.dispose());
    st.runners = [];
    host.classList.add('lesson');
    host.classList.remove('card', 'theory-body');

    const top = h('div', 'lesson-top');
    // phần mở đầu (nguồn + "Sau chương này bạn làm được") chỉ hiện ở thẻ đầu — các thẻ sau gọn
    const introEl = intro && (st.i === 0 || st.all) && h('div', 'lesson-intro', marked.parse(intro, { async: false }));
    const steps = h('ol', 'lesson-steps');
    const events = loadEvents();
    cards.forEach((c, k) => {
      const li = h('li');
      const b = h('button', k === st.i && !st.all ? 'on' : k < st.i && !st.all ? 'done' : '');
      if (cardPassed(events, c.body)) b.classList.add('passed');
      b.type = 'button';
      b.title = c.title;
      b.setAttribute('aria-label', `${k + 1}. ${c.title}`);
      b.addEventListener('click', () => { st.i = k; st.all = false; draw(); host.scrollIntoView({ block: 'start' }); });
      li.append(b);
      steps.append(li);
    });
    const count = h('span', 'lesson-count', st.all ? T('lesson.allCount', { n: cards.length })
      : T('lesson.count', { i: st.i + 1, n: cards.length }));
    const toggle = h('button', 'link', st.all ? T('lesson.oneByOne') : T('lesson.showAll'));
    toggle.type = 'button';
    toggle.addEventListener('click', () => { st.all = !st.all; draw(); });
    top.append(steps, count, toggle);

    const body = h('div', 'lesson-deck');
    if (st.all) cards.forEach(c => body.append(cardEl(c)));
    else body.append(cardEl(cards[st.i]));

    const nav = h('div', 'lesson-nav');
    if (!st.all) {
      const prev = cards[st.i - 1], next = cards[st.i + 1];
      const go = (d, c, icon) => {
        const b = h('button', 'btn' + (icon === 'next' ? ' primary' : ''));
        b.type = 'button';
        b.dataset.icon = icon;
        b.append(h('span', null, c.title));
        b.addEventListener('click', () => { st.i += d; draw(); host.scrollIntoView({ block: 'start' }); });
        return b;
      };
      // thẻ cuối: mời sang luyện tập của đúng chương này
      const end = h('a', 'btn primary', T('lesson.toPractice'));
      end.href = `#/practice/${opts.chapter}`;
      end.dataset.icon = 'next';
      nav.append(prev ? go(-1, prev, 'prev') : h('span'), next ? go(1, next, 'next') : end);
    }
    host.replaceChildren(...[introEl, top, body, nav].filter(Boolean));
    // qua điểm kiến thức: nút "Thẻ tiếp" ngay trong khối (thẻ cuối: sang Luyện tập chương); tô xanh chấm tiến độ
    const next = cards[st.i + 1];
    const toNext = () => {
      if (!next) { location.hash = `#/practice/${opts.chapter}`; return; }
      st.i += 1; draw(); host.scrollIntoView({ block: 'start' });
    };
    const onResult = () => {
      const dot = steps.children[st.i]?.firstChild;
      if (dot && cardPassed(loadEvents(), cards[st.i].body)) dot.classList.add('passed');
    };
    mountChecks(body, st, ctx, st.all ? {} : {
      onPass: toNext, passLabel: next ? T('kp.nextCard', { title: next.title }) : T('lesson.toPractice'), onResult,
    });
  };

  if (!st.keyed) {
    st.keyed = true;
    document.addEventListener('keydown', e => {
      if (!host.offsetParent || st.all || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target.closest?.('[role="tablist"], .runner')) return;   // mũi tên của điều hướng / của câu hỏi nhanh
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      const n = STATE.get(host).count;
      if (!d || st.i + d < 0 || st.i + d >= n) return;
      e.preventDefault();
      st.i += d;
      st.redraw();
    });
  }
  st.count = cards.length;
  st.redraw = draw;
  draw();
}
