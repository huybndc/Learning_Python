import { t as T, onLangChange, offLangChange } from '../i18n/index.js';
import { questionView, explainBlock, answerHtml, tp } from './question.js';
import { record, subjectOf } from './store.js';
import { freshQuestion, poolSize, seededQuestion, newSeed, questionCode } from '../logic/question-pool.js';
import { streakOf } from '../logic/knowledge.js';
import { h } from './dom.js';

/* ---------------------------------------------------------------
   BỘ CHẠY LUYỆN TẬP — dùng chung cho mọi chương của cả 3 app.
   Một lượt = `size` câu tự sinh KHÔNG LẶP (dạng chỉ có ít câu khác nhau thì lượt ngắn lại), chấm ngay, có gợi ý và lời giải; hết lượt
   là màn tổng kết. Chương chỉ cần đưa "ngân hàng" câu hỏi:
     bank = { KINDS, makeQuestion(kind, rnd), checkAnswer(q, given) }
   Câu hỏi: { kind, format, textKey, textParams, answer, answerText?, choices?,
             hintKey?, hintParams?, explainKey?, explainParams?, figure? }
   format: 'text' | 'number' | 'set' | 'choice'. Nhãn dạng bài: T(`${prefix}.${kind}`).
   `figures[type](figure)` vẽ hình kèm đề (K-map, bảng chân trị…).
   `q.input = { type, … }` → trả lời bằng widget (bấm bit, bấm bảng chân trị, khoanh K-map…)
   thay cho ô gõ chữ; widget trả về chuỗi đúng định dạng checkAnswer đang nhận.
   Phương án trắc nghiệm có thể là { label, figure } để hiện hình (vd ký hiệu cổng).
   Nhúng vào thẻ học (điểm kiến thức — ui/kpoint.js): `goal: 2` ⇒ hỏi tới khi đúng 2 câu LIÊN TIẾP
   (không có số câu cố định, không có màn tổng kết); `make(rnd)` thay cách sinh câu (câu mang nhãn);
   qua thì gọi `onPass()`, sai thì mời `onExample()` (xem thêm một ví dụ mẫu).
   Mỗi câu chấm xong ghi một sự kiện vào nhật ký (store.record) — Tổng quan/Luyện tập đọc lại.
   Mỗi câu sinh từ một hạt giống riêng ⇒ trả lời xong hiện MÃ CÂU (hub D33): gửi mã khi báo lỗi là tái hiện đúng câu.
   Hết lượt có "Làm lại câu sai": đúng những câu vừa sai, không ghi nhật ký (vừa xem lời giải, làm lại không phải bằng chứng đã nắm).
   Trả về { dispose } để gỡ listener khi phần tử bị thay (thẻ học đổi trang).
   --------------------------------------------------------------- */

/** "đúng 40%" / "chưa làm câu nào" — trạng thái của điểm tiên quyết bị nghi là gốc lỗi. */
export const rootState = acc => (acc == null ? T('run.rootNew') : T('run.rootAcc', { p: Math.round(acc * 100) }));

export function mountRunner(host, { bank, prefix, figures = {}, widgets = {}, size = 10, kinds, chips = true, autofocus = true, mode = 'practice', review,
  goal = 0, make, onPass, onExample, passLabel, onResult }) {
  // seen: chữ ký các câu trong lượt này (không lặp); recent: các câu ở lượt trước (tránh nếu còn cách)
  const S = { kinds: [...(kinds || bank.KINDS)], size, round: [], phase: 'ask', hint: false, last: null, seen: new Set(), recent: new Set(), redo: null };
  // nhúng trong thẻ học thì chưa giành con trỏ cho tới khi người học bấm vào (← → vẫn lật thẻ)
  let touched = autofocus;
  host.classList.add('runner');

  const top = h('div', 'run-kinds');
  top.hidden = !chips;
  const card = h('div', 'run-card card');
  host.replaceChildren(top, card);

  const label = kind => T(`${prefix}.${kind}`);
  const cur = () => S.round.at(-1);

  /* ---------- chọn dạng bài ---------- */
  function drawKinds() {
    top.replaceChildren();
    const all = S.kinds.length === bank.KINDS.length;
    const chip = (text, on, act) => {
      const b = h('button', 'chip');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', act);
      top.append(b);
    };
    chip(T('run.allKinds'), all, () => { S.kinds = [...bank.KINDS]; restart(); });
    bank.KINDS.forEach(k => chip(label(k), !all && S.kinds.length === 1 && S.kinds[0] === k,
      () => { S.kinds = [k]; restart(); }));
  }

  function nextKind() {
    const pool = S.kinds.length > 1 ? S.kinds.filter(k => k !== S.last) : S.kinds;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const genOf = kind => (make ? () => make(Math.random) : () => seededQuestion(bank, kind, newSeed()));

  /** Lượt không dài hơn số câu khác nhau mà các dạng đang chọn sinh được (ra câu lặp cho đủ 10 thì vô ích). */
  function roundSize() {
    if (goal) return size;
    let cap = 0;
    for (const k of S.kinds) { cap += poolSize(genOf(k), size - cap); if (cap >= size) return size; }
    return Math.max(cap, 1);
  }

  function restart() {
    S.recent = S.seen; S.seen = new Set(); S.round = []; S.redo = null;
    S.size = roundSize();
    drawKinds(); ask();
  }

  /** Làm lại đúng các câu vừa sai (giữ nguyên đề, phương án). */
  function redoWrong(list) {
    S.redo = list; S.round = []; S.size = list.length;
    ask();
  }

  function ask() {
    if (S.redo) { S.round.push({ q: S.redo[S.round.length], given: null, ok: null }); S.phase = 'ask'; S.hint = false; S.warn = null; return draw(); }
    // dạng được chọn trước, còn lại xếp ngẫu nhiên: dạng nào hết câu mới thì thử dạng khác
    const first = nextKind();
    const order = [first, ...S.kinds.filter(k => k !== first).sort(() => Math.random() - 0.5)];
    let q = null, kind = first;
    for (const k of order) { q = freshQuestion(genOf(k), S.seen, S.recent); if (q) { kind = k; break; } }
    if (!q && !goal) { S.size = S.round.length; return finish(); }   // hết câu mới ở mọi dạng: kết thúc lượt sớm
    if (!q) { S.seen = new Set(); q = freshQuestion(genOf(first), S.seen); }   // chế độ chuỗi: làm lại vòng mới
    S.last = kind;
    S.round.push({ q, given: null, ok: null });
    S.phase = 'ask';
    S.hint = false;
    S.warn = null;
    draw();
  }

  /* ---------- vẽ một câu ---------- */
  const streak = () => streakOf(S.round.filter(e => e.ok !== null).map(e => e.ok));

  function progress() {
    const bar = h('ol', 'run-dots');
    if (goal) {                              // chế độ chuỗi: chấm các câu đã làm (8 câu gần nhất) + câu đang làm
      bar.setAttribute('aria-label', T('run.streak', { k: streak(), n: goal }));
      S.round.slice(-8).forEach(e => bar.append(h('li', e.ok === true ? 'ok' : e.ok === false ? 'bad' : 'now')));
      return bar;
    }
    bar.setAttribute('aria-label', T('run.qOf', { i: S.round.length, n: S.size }));
    for (let i = 0; i < S.size; i++) {
      const e = S.round[i];
      const cls = !e ? '' : e.ok === true ? 'ok' : e.ok === false ? 'bad' : 'now';
      bar.append(h('li', cls));
    }
    return bar;
  }

  function draw() {
    if (S.phase === 'done') return drawDone();
    const e = cur(), q = e.q;
    const head = h('div', 'run-head');
    head.append(progress(), h('span', 'run-count', goal ? T('run.streak', { k: streak(), n: goal }) : T('run.qOf', { i: S.round.length, n: S.size })));
    // dạng bài giấu tới khi trả lời xong: biết trước dạng là lộ một nửa lời giải
    if (S.phase !== 'ask') {
      head.append(h('span', 'badge', label(q.kind)));
      const code = questionCode(subjectOf(), prefix, q, bank.mcq);
      if (code) head.append(Object.assign(h('span', 'run-code', code), { title: T('run.code') }));
    }

    const view = questionView(q, { figures, widgets, given: e.given, locked: S.phase !== 'ask', onSubmit: check, action: T('run.check') });
    const body = [head, ...view.nodes];
    // lượt bị rút ngắn vì dạng này chỉ có ít câu khác nhau: nói rõ để người học không tưởng là lỗi
    if (!goal && !S.redo && S.size < size && S.round.length === 1) body.splice(1, 0, h('p', 'run-note', T('run.shortRound', { n: S.size })));

    const fb = h('div', 'run-feedback');
    if (S.phase === 'ask') {
      const tools = h('div', 'run-tools');
      if (q.hintKey) {
        const hb = h('button', 'link', T('run.hint'));
        hb.type = 'button';
        hb.addEventListener('click', () => { S.hint = true; draw(); });
        tools.append(hb);
      }
      const rb = h('button', 'link', T('run.reveal'));
      rb.type = 'button';
      rb.addEventListener('click', reveal);
      tools.append(rb);
      body.push(tools);
      if (S.hint && q.hintKey) fb.append(h('div', 'msg', `<span>${T(q.hintKey, tp(q.hintParams))}</span>`));
      if (S.warn) fb.append(h('div', 'msg warn', `<span>${S.warn}</span>`));
    } else {
      const ok = e.ok;
      // bọc cả dòng trong MỘT span: .msg là flex, để rời thì mỗi mảnh chữ thành một cột
      fb.append(h('div', 'msg ' + (ok ? 'ok' : 'bad'), '<span>'
        + (ok ? T('run.correct') : e.revealed ? T('run.revealed') : T('run.wrong'))
        + (ok ? '' : ` <span class="run-ans">${T('run.answerIs', { answer: answerHtml(q) })}</span>`)
        + (e.detail ? ` <span class="run-detail">${e.detail}</span>` : '') + '</span>'));
      const ex = explainBlock(q);
      if (ex) fb.append(ex);
      // sai: chỉ luôn thẻ bài học của đúng dạng này (thẻ đó có câu thử của dạng này)
      const rv = !ok && review?.(q.kind, q.review);
      if (rv) {
        const a = h('a', 'run-review block', T('run.review', { title: rv.title }));
        a.href = rv.href;
        a.addEventListener('click', rv.open);
        fb.append(a);
        // đồ thị tiên quyết: điểm cần-biết-trước gần nhất đang yếu — nhiều khi lỗi nằm ở đó chứ không ở dạng này
        if (rv.root) {
          const b = h('a', 'run-review block root', T('run.root', { title: rv.root.title, state: rootState(rv.root.acc) }));
          b.href = rv.root.href;
          b.addEventListener('click', rv.root.open);
          fb.append(b);
        }
      }
      if (goal) fb.append(goalActions(ok));
      else {
        const next = h('button', 'btn primary run-next', S.round.length >= S.size ? T('run.finish') : T('run.next'));
        next.type = 'button';
        next.dataset.icon = 'next';
        next.addEventListener('click', () => (S.round.length >= S.size ? finish() : ask()));
        fb.append(next);
      }
    }
    body.push(fb);
    card.replaceChildren(...body.filter(Boolean));
    const focus = card.querySelector(S.phase === 'ask' ? 'input:not(.w-typed), .choice, .w-bit, .w-truth [tabindex], .w-num' : '.run-next');
    if (focus && touched && host.offsetParent) focus.focus({ preventScroll: true });
  }

  /* ---------- chế độ chuỗi (điểm kiến thức): qua / câu tiếp / xem thêm ví dụ ---------- */
  function goalActions(ok) {
    const row = h('div', 'row run-goal');
    const btn = (text, cls, act, icon) => {
      const b = h('button', cls, text);
      b.type = 'button';
      if (icon) b.dataset.icon = icon;
      b.addEventListener('click', act);
      row.append(b);
      return b;
    };
    if (streak() >= goal) {
      row.append(h('span', 'run-pass', T('run.passed')));
      if (onPass) btn(passLabel ?? T('run.next'), 'btn primary run-next', onPass, 'next');
      btn(T('run.more'), onPass ? 'btn' : 'btn primary run-next', ask);
    } else {
      btn(T('run.next'), 'btn primary run-next', ask, 'next');
      if (!ok && onExample) btn(T('run.anotherExample'), 'link', onExample);
    }
    return row;
  }

  /* ---------- chấm ---------- */
  function check(given) {
    if (S.phase !== 'ask') return;
    touched = true;
    S.warn = null;
    if (!String(given).trim()) { S.warn = T('run.empty'); draw(); return; }
    const e = cur();
    const r = bank.checkAnswer(e.q, given);
    // không đọc được đáp án (sai cú pháp…) thì báo để sửa, CHƯA tính là sai
    if (r.retry) { S.warn = T(r.detailKey, tp(r.detailParams)); e.given = given; draw(); return; }
    e.given = given;
    e.ok = !!r.ok;
    e.detail = r.detailKey ? T(r.detailKey, tp(r.detailParams)) : '';
    S.phase = 'answered';
    if (!S.redo) record({ prefix, kind: e.q.kind, ok: e.ok, mode, ...(e.q.review && { tag: e.q.review }) });
    onResult?.(e.ok);
    draw();
  }

  function reveal() {
    touched = true;
    const e = cur();
    e.ok = false;
    e.revealed = true;
    S.phase = 'answered';
    if (!S.redo) record({ prefix, kind: e.q.kind, ok: false, mode, ...(e.q.review && { tag: e.q.review }) });
    onResult?.(false);
    draw();
  }

  /* ---------- hết lượt ---------- */
  function finish() { S.phase = 'done'; draw(); }

  function drawDone() {
    const right = S.round.filter(e => e.ok).length;
    const byKind = new Map();
    S.round.forEach(e => {
      const k = byKind.get(e.q.kind) || { ok: 0, n: 0 };
      k.n++; if (e.ok) k.ok++;
      byKind.set(e.q.kind, k);
    });
    const wrongKinds = [...byKind].filter(([, v]) => v.ok < v.n).map(([k]) => k);

    const list = h('ul', 'run-summary');
    [...byKind].sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).forEach(([k, v]) => {
      const li = h('li', v.ok === v.n ? 'ok' : 'bad');
      li.append(h('span', null, label(k)));
      // sai thì chỉ luôn thẻ bài học cần ôn (thẻ đó có câu thử của đúng dạng này)
      const rv = v.ok < v.n && review?.(k);
      if (rv) {
        const a = h('a', 'run-review', T('run.review', { title: rv.title }));
        a.href = rv.href;
        a.addEventListener('click', rv.open);
        li.append(a);
      }
      li.append(h('b', null, `${v.ok}/${v.n}`));
      list.append(li);
    });
    const again = h('button', 'btn primary', T('run.again'));
    again.addEventListener('click', restart);
    const actions = h('div', 'row');
    const wrong = S.round.filter(e => !e.ok).map(e => e.q);
    if (wrong.length) {
      const redo = h('button', 'btn', T('run.redoWrong', { n: wrong.length }));
      redo.addEventListener('click', () => redoWrong(wrong));
      actions.append(redo);
    }
    if (wrongKinds.length && !S.redo) {
      const retry = h('button', 'btn', T('run.retryWrong'));
      retry.addEventListener('click', () => { S.kinds = wrongKinds; restart(); });
      actions.append(retry);
    }
    actions.prepend(again);
    card.replaceChildren(
      h('p', 'run-score', `${right}<span>/${S.round.length}</span>`),
      h('p', 'muted', right === S.round.length ? T('run.perfect') : T('run.doneNote')),
      list, actions);
    again.focus({ preventScroll: true });
  }

  // phím số 1–4 chọn đáp án trắc nghiệm (chỉ khi bộ chạy này đang hiện)
  const onKey = ev => {
    if (!host.offsetParent || S.phase !== 'ask' || ev.metaKey || ev.ctrlKey) return;
    if (ev.target.closest?.('input, textarea, .run-widget')) return;   // đang gõ (ô đáp án, nháp, ô bit)
    const owner = ev.target.closest?.('.runner');
    if (owner && owner !== host) return;                           // phím thuộc bộ chạy khác trên cùng trang
    const q = cur()?.q;
    const i = Number(ev.key) - 1;
    if (q?.format === 'choice' && i >= 0 && i < q.choices.length) check(String(i));
  };
  const onLang = () => { drawKinds(); draw(); };
  document.addEventListener('keydown', onKey);
  onLangChange(onLang);

  restart();
  return {
    dispose() {
      document.removeEventListener('keydown', onKey);
      offLangChange(onLang);
    },
  };
}
