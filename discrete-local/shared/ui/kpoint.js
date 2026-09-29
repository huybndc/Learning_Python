import { t as T, onLangChange, offLangChange } from '../i18n/index.js';
import { tp, answerHtml, stepLine } from './question.js';
import { mountRunner } from './runner.js';
import { makerFor, exampleFor, stepGroups, PASS_STREAK } from '../logic/knowledge.js';
import { h } from './dom.js';

/* ---------------------------------------------------------------
   ĐIỂM KIẾN THỨC TRONG THẺ HỌC (Phase 3, D26) — thay "Thử nhanh" 3 câu cũ:
     1. Ví dụ mẫu: đề tự sinh (chọn đề có lời giải dài nhất trong vài đề), bấm "Bước tiếp" hiện
        dần từng dòng lời giải (q.work — cùng lời giải với Luyện tập); hết dòng thì hiện đáp án.
        Hình: q.exampleFigure ?? q.figure; xong thì q.answerFigure nếu có.
     2. Tự làm: bộ chạy chế độ chuỗi — đúng PASS_STREAK câu LIÊN TIẾP mới qua;
        sai thì mời xem thêm một ví dụ (Renkl: gặp khó thì quay lại ví dụ mẫu).
   Đã nắm từ trước ⇒ vào thẳng phần tự làm, ví dụ vẫn mở lại được.
   mountPoint(host, { key, bank, prefix, figures, widgets, passed, onPass, passLabel, onResult }) → { dispose }
   --------------------------------------------------------------- */

function button(text, cls, onClick, icon) {
  const b = h('button', cls, text);
  b.type = 'button';
  if (icon) b.dataset.icon = icon;
  b.addEventListener('click', onClick);
  return b;
}

export function mountPoint(host, { key, bank, prefix, figures = {}, widgets = {}, passed = false, onPass, passLabel, onResult }) {
  const make = makerFor(bank, key);
  const S = { step: passed ? 'practice' : 'example', q: exampleFor(make, Math.random), shown: 1 };
  let runner = null;
  host.classList.add('kpoint');

  const newExample = () => { S.q = exampleFor(make, Math.random); S.shown = 1; };

  /* ---------- ví dụ mẫu ---------- */
  function drawExample() {
    const q = S.q;
    const groups = stepGroups(q);
    const total = groups.flat().length;          // hiện từng DÒNG; nhóm chỉ để xếp dòng tính dưới câu dẫn
    const done = S.shown >= total;
    const box = h('div', 'kp-example');
    const head = h('div', 'kp-head');
    head.append(h('b', null, T('kp.example')),
      h('span', 'kp-count', T('kp.stepOf', { i: Math.min(S.shown, total), n: total })),
      button(T('kp.otherExample'), 'link', () => { newExample(); draw(); }));
    box.append(head, h('p', 'run-q', T(q.textKey, tp(q.textParams))));
    // câu trả lời bằng widget (khoanh K-map…) không có hình kèm đề ⇒ câu hỏi cho sẵn exampleFigure;
    // hết bước thì answerFigure (vd bản đồ đã khoanh nhóm) thay chỗ
    const figure = (done && q.answerFigure) || q.exampleFigure || q.figure;
    if (figure && figures[figure.type]) {
      const fig = h('div', 'run-fig');
      fig.append(figures[figure.type](figure));
      box.append(fig);
    }
    const steps = h('ol', 'kp-steps');
    let left = S.shown;
    for (const g of groups) {
      if (left <= 0) break;
      const li = h('li');
      g.slice(0, left).forEach(w => {
        const line = stepLine(w);
        if (--left === 0 && S.shown > 1) line.classList.add('new');   // dòng vừa hiện
        li.append(line);
      });
      steps.append(li);
    }
    box.append(steps);

    const actions = h('div', 'row');
    if (!done) {
      actions.append(
        button(T('kp.nextStep'), 'btn primary kp-go', () => { S.shown++; draw(); }, 'next'),
        button(T('kp.showAll'), 'link', () => { S.shown = total; draw(); }));
    } else {
      box.append(h('p', 'kp-answer', T('run.answerIs', { answer: answerHtml(q) })));
      actions.append(button(T('kp.tryIt'), 'btn primary kp-go', () => { S.step = 'practice'; draw(); }, 'next'));
    }
    box.append(actions);
    return box;
  }

  /* ---------- tự làm ---------- */
  function drawPractice() {
    const box = h('div', 'kp-practice');
    const head = h('div', 'kp-head');
    head.append(h('b', null, T('kp.practice')), h('span', 'kp-count', T('kp.goal', { n: PASS_STREAK })),
      button(T('kp.backExample'), 'link', () => { S.step = 'example'; draw(); }));
    const host2 = h('div');
    box.append(head, host2);
    runner = mountRunner(host2, {
      bank, prefix, figures, widgets, kinds: [key.split(':')[1]], make, chips: false, autofocus: false,
      mode: 'lesson', goal: PASS_STREAK, onPass, passLabel, onResult,
      onExample: () => { newExample(); S.step = 'example'; draw(); },
    });
    return box;
  }

  // focus chỉ khi người học đã bấm trong khối (lúc mở thẻ không giành con trỏ — ← → còn lật thẻ)
  let touched = false;
  host.addEventListener('click', () => { touched = true; }, true);
  function draw() {
    runner?.dispose();
    runner = null;
    host.replaceChildren(S.step === 'example' ? drawExample() : drawPractice());
    if (touched) host.querySelector(S.step === 'example' ? '.kp-go' : 'input, .choice, .w-bit, .w-num')?.focus({ preventScroll: true });
  }

  // đổi ngôn ngữ: phần ví dụ vẽ lại chữ (bộ chạy tự vẽ lại phần của nó)
  const onLang = () => { if (S.step === 'example') draw(); };
  onLangChange(onLang);
  draw();
  return { dispose() { runner?.dispose(); offLangChange(onLang); } };
}
