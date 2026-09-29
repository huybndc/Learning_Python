import { $, el } from './dom.js';
import { t as T } from '../i18n/index.js';
import { buildExam, gradeItem, isBlank, secondsLeft, clock } from '../logic/exam.js';
import { chapterWeeks } from '../logic/syllabus.js';
import { load, save, record, subjectOf } from './store.js';
import { go } from './router.js';
import { questionView, explainBlock, answerHtml, tp } from './question.js';
import { chNo } from './choices.js';

/* ---------------------------------------------------------------
   PHÒNG THI (#/exam/run) — menu trái ẩn (body.exam-focus), bấm nhầm không rời bài.
   Bài lưu ở localStorage `exam:<môn>`:
     { seed, minutes, order: 'mixed' (đề trộn; bài cũ không có ⇒ xếp theo chương), mode: 'exam'|'long', chapters, startedAt, at, given[], flags[],
       checked[], hideClock, submittedAt, timeout }
   Câu hỏi không lưu — dựng lại từ seed (shared/logic/exam.js), nên F5 vẫn đúng đề.
   Thi thử: tính giờ, chỉ chấm khi nộp, hết giờ tự nộp.
   Bài tập dài: không tính giờ, bấm Kiểm tra từng câu (khoá câu đó, hiện lời giải).
   --------------------------------------------------------------- */

export const loadExam = () => load('exam', null);
const store = st => save('exam', st);

/** Chương đưa vào đề, kèm trọng số = số tuần học theo syllabus. */
export function examChapters(cfg, ids) {
  const weeks = chapterWeeks(subjectOf());
  return cfg.chapters.filter(c => c.bank && ids.includes(c.id)).map(c => ({ ...c, weight: weeks[c.id] ?? 1 }));
}

let cache = { key: '', items: [] };
/** Câu hỏi của bài — giữ nguyên đối tượng giữa các lần vẽ (widget K-map nhớ lựa chọn theo đối tượng). */
export function itemsOf(cfg, st) {
  const key = `${st.seed}|${st.minutes}|${st.chapters}|${st.order}`;
  if (cache.key !== key) cache = { key, items: buildExam(examChapters(cfg, st.chapters), st) };
  return cache.items;
}

export const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Khối "đúng/sai + đáp án + lời giải" của một câu đã chấm — phòng thi (bài dài) và màn kết quả. */
export function verdict(it, given) {
  const g = gradeItem(it, given);
  const q = it.q;
  return [
    el('div', { class: 'msg ' + (g.ok ? 'ok' : 'bad') }, el('span', {
      html: (g.ok ? T('run.correct') : g.blank ? T('exam.blankOne') : T('run.wrong'))
        + (g.ok ? '' : ` <span class="run-ans">${T('run.answerIs', { answer: answerHtml(q) })}</span>`)
        + (g.detailKey ? ` <span class="run-detail">${T(g.detailKey, tp(g.detailParams))}</span>` : ''),
    })),
    explainBlock(q),
  ];
}

/** Nộp bài: ghi nhật ký (thi thử), lưu lịch sử, sang màn kết quả. */
export function submitExam(cfg, st, timeout = false) {
  if (st.submittedAt) return;
  const items = itemsOf(cfg, st);
  const res = items.map((it, i) => gradeItem(it, st.given[i]));
  // bài dài đã ghi từng câu lúc Kiểm tra; câu bỏ trống không ghi (không biết là chưa học hay hết giờ)
  if (st.mode === 'exam') record(items.flatMap((it, i) => (res[i].blank ? [] : [{ prefix: it.prefix, kind: it.q.kind, ok: res[i].ok, mode: 'exam' }])));
  st.submittedAt = Date.now();
  st.timeout = timeout;
  store(st);
  const hist = load('exam-history', []);
  save('exam-history', [{ ts: st.submittedAt, mode: st.mode, minutes: st.minutes, chapters: st.chapters, right: res.filter(r => r.ok).length, n: items.length }, ...hist].slice(0, 20));
  go({ view: 'exam', step: 'result' });
}

let view = null;       // câu đang hiện: { seed, i, get, locked }
let warn = null;
let timer = 0;
let onKey = null;
document.addEventListener('keydown', ev => { if (document.body.classList.contains('exam-focus')) onKey?.(ev); });
// F5 / đóng tab giữa lúc đang gõ: ghi nốt chữ trong ô
window.addEventListener('pagehide', () => { const st = loadExam(); if (st) keep(st); });

/** Ghi đáp án đang nhập của câu đang hiện (trước khi chuyển câu / vẽ lại / nộp). */
function keep(st) {
  if (!view || view.seed !== st.seed || view.locked || st.submittedAt) return;
  st.given[view.i] = view.get() ?? '';
  store(st);
}

export function renderExamRun(cfg) {
  const st = loadExam();
  if (!st || st.submittedAt) { go({ view: 'exam' }); return T('nav.exam'); }
  keep(st);                                  // vẽ lại (đổi ngôn ngữ) không mất chữ đang gõ
  const items = itemsOf(cfg, st);
  const n = items.length;
  const timed = st.mode === 'exam';
  clearInterval(timer);

  const draw = () => {
    const i = Math.min(st.at ?? 0, n - 1);
    const it = items[i];
    const locked = !timed && st.checked[i] != null;
    const moveTo = j => { keep(st); st.at = Math.max(0, Math.min(n - 1, j)); warn = null; store(st); draw(); };
    const pick = g => { st.given[i] = g; store(st); draw(); };

    const check = g => {                     // chỉ bài tập dài
      warn = null;
      if (isBlank(g)) { warn = T('run.empty'); return draw(); }
      st.given[i] = g;
      const r = it.bank.checkAnswer(it.q, g);
      if (r.retry) { warn = T(r.detailKey, tp(r.detailParams)); store(st); return draw(); }
      st.checked[i] = !!r.ok;
      record({ prefix: it.prefix, kind: it.q.kind, ok: !!r.ok, mode: 'long' });
      store(st);
      draw();
    };

    const qv = questionView(it.q, {
      figures: cfg.figures, widgets: cfg.widgets, given: st.given[i] ?? null, locked,
      action: timed ? null : T('run.check'),
      // thi thử: bấm phương án = chọn; Enter trong ô gõ = ghi rồi sang câu sau
      onSubmit: timed ? (it.q.format === 'choice' ? pick : g => { st.given[i] = g; moveTo(i + 1); }) : check,
    });
    view = { seed: st.seed, i, get: qv.get, locked };

    /* thanh trên: tên bài · đồng hồ · nộp */
    const answered = items.filter((_, j) => !isBlank(st.given[j])).length;
    const flags = st.flags.filter(Boolean).length;
    const clockBtn = timed && el('button', {
      type: 'button', class: 'exam-clock', title: T('exam.clockHide'),
      onClick: () => { st.hideClock = !st.hideClock; store(st); tick(); },
    });
    const msg = el('p');
    const dlg = el('dialog', { class: 'exam-dialog' }, [msg,
      el('div', { class: 'exam-dialog-actions' }, [
        el('button', { type: 'button', class: 'btn', onClick: () => dlg.close() }, T('exam.keepGoing')),
        el('button', { type: 'button', class: 'btn primary', onClick: () => { dlg.close(); submitExam(cfg, st); } }, T(timed ? 'exam.submit' : 'exam.finish')),
      ]),
    ]);
    const askSubmit = () => {
      keep(st);
      const blank = timed ? items.filter((_, j) => isBlank(st.given[j])).length : n - st.checked.filter(x => x != null).length;
      msg.innerHTML = T(timed ? 'exam.confirmExam' : 'exam.confirmLong', { blank, flags: st.flags.filter(Boolean).length });
      dlg.showModal();
    };
    const bar = el('header', { class: 'exam-bar' }, [
      el('a', { class: 'back', href: '#/exam', 'data-icon': 'prev', title: timed ? T('exam.leaveNote') : null, text: T('exam.leave') }),
      el('b', { class: 'exam-name', text: `${T(timed ? 'exam.modeExam' : 'exam.modeLong')} · ${T('exam.minutes', { m: st.minutes })}` }),
      el('span', { class: 'spacer' }),
      clockBtn,
      el('button', { type: 'button', class: 'btn primary', onClick: askSubmit }, T(timed ? 'exam.submit' : 'exam.finish')),
    ]);

    /* lưới câu, nhóm theo chương */
    const groups = [];
    items.forEach((x, j) => { if (groups.at(-1)?.ch !== x.ch) groups.push({ ch: x.ch, idx: [] }); groups.at(-1).idx.push(j); });
    const cell = j => {
      const cls = ['pal', !isBlank(st.given[j]) && 'done', st.flags[j] && 'flag',
        !timed && st.checked[j] === true && 'ok', !timed && st.checked[j] === false && 'bad'].filter(Boolean).join(' ');
      return el('button', { type: 'button', class: cls, 'aria-current': j === i ? 'true' : null, onClick: () => moveTo(j) }, String(j + 1));
    };
    const pal = el('nav', { class: 'exam-pal', 'aria-label': T('exam.answered', { a: answered, n }) }, [
      ...groups.map(g => [el('small', { text: T('shell.chapter', { n: chNo(g.ch) }) }), el('div', { class: 'pal-grid' }, g.idx.map(cell))]),
      el('p', { class: 'pal-note' }, [T('exam.answered', { a: answered, n }), flags ? ` · ${T('exam.flags', { f: flags })}` : '']),
    ]);

    /* câu đang làm */
    const flagBtn = el('button', {
      type: 'button', class: 'link exam-flag', 'aria-pressed': String(!!st.flags[i]),
      onClick: () => { keep(st); st.flags[i] = !st.flags[i]; store(st); draw(); },
    }, T(st.flags[i] ? 'exam.flagged' : 'exam.flag'));
    const main = el('article', { class: 'run-card card exam-q' }, [
      el('div', { class: 'run-head' }, [
        el('span', { class: 'run-count', text: T('run.qOf', { i: i + 1, n }) }),
        el('span', { class: 'muted small', text: T('shell.chapter', { n: chNo(it.ch) }) }),
        el('span', { class: 'spacer' }), flagBtn,
      ]),
      ...qv.nodes,
      el('div', { class: 'run-feedback' }, [
        warn && el('div', { class: 'msg warn' }, el('span', { html: warn })),
        locked && verdict(it, st.given[i]),
      ]),
      el('div', { class: 'exam-nav' }, [
        el('button', { type: 'button', class: 'btn', 'data-icon': 'prev', disabled: i === 0, onClick: () => moveTo(i - 1) }, T('exam.prev')),
        el('button', { type: 'button', class: 'btn', 'data-icon': 'next', disabled: i === n - 1, onClick: () => moveTo(i + 1) }, T('exam.next')),
      ]),
    ]);

    $('#screen-exam').replaceChildren(bar, el('div', { class: 'exam-body' }, [pal, main]), dlg);
    tick();
    const focus = main.querySelector('input:not(:disabled), .choice:not(:disabled), .w-bit:not(:disabled), .w-num:not(:disabled)');
    focus?.focus({ preventScroll: true });

    // ← → đổi câu, 1–9 chọn phương án — trừ khi đang gõ / đang bấm widget
    onKey = ev => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || dlg.open) return;
      if (ev.target.closest?.('input, textarea, .run-widget')) return;
      if (ev.key === 'ArrowLeft' && i > 0) moveTo(i - 1);
      else if (ev.key === 'ArrowRight' && i < n - 1) moveTo(i + 1);
      else if (it.q.format === 'choice' && !locked) {
        const k = Number(ev.key) - 1;
        if (k >= 0 && k < it.q.choices.length) (timed ? pick : check)(String(k));
      }
    };
  };

  /* đồng hồ: đếm ngược từ startedAt (F5 không làm lại giờ); còn 5 phút thì hiện lại và đổi màu */
  function tick() {
    if (!timed) return;
    const btn = $('.exam-clock');
    if (!btn || !document.body.classList.contains('exam-focus')) { clearInterval(timer); return; }
    const left = secondsLeft(st, Date.now());
    if (left <= 0) { clearInterval(timer); keep(st); submitExam(cfg, st, true); return; }
    const low = left <= 300;
    const hidden = st.hideClock && !low;
    btn.textContent = hidden ? T('exam.clockShow') : clock(left);
    btn.classList.toggle('low', low);
    btn.classList.toggle('hidden', hidden);
  }

  draw();
  if (timed && !st.submittedAt) timer = setInterval(tick, 1000);   // lần vẽ đầu có thể đã tự nộp (hết giờ khi đang tắt máy)
  return T(timed ? 'exam.modeExam' : 'exam.modeLong');
}
