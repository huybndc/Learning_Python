import { t as T } from '../i18n/index.js';
import { SHARED_WIDGETS } from './widgets.js';
import { h, ht } from './dom.js';
import { splitMatrices } from '../logic/steps.js';

/* ---------------------------------------------------------------
   VẼ MỘT CÂU (đề + hình + chỗ trả lời) — dùng chung cho bộ chạy luyện tập
   và bài full. Nơi gọi tự lo chấm điểm, thanh tiến độ, lời giải.
     questionView(q, { figures, widgets, given, locked, onSubmit, action })
       given     đáp án đang có (chuỗi) — trắc nghiệm: chỉ số phương án
       locked    đã chấm: khoá lại, tô đúng/sai
       onSubmit  Enter / bấm phương án / nút `action` → onSubmit(chuỗi đáp án)
       action    nhãn nút bên cạnh ô trả lời (bỏ trống = không có nút)
     → { nodes: [đề, khung làm bài], get() → đáp án đang nhập }
   --------------------------------------------------------------- */

/** Tham số: khoá từ điển thì dịch; chuỗi còn lại là biểu thức → x' hiện thành x′ như sách. */
export const prime = s => String(s).replace(/'/g, '′');
export const tp = params => Object.fromEntries(Object.entries(params || {})
  .map(([k, v]) => [k, typeof v !== 'string' ? v : /^[a-z][\w-]*(\.[\w-]+)+$/i.test(v) && T(v) !== v ? T(v) : prime(v)]));
const tr = s => (typeof s === 'string' && T(s) !== s ? T(s) : s);

export function answerText(q) {
  if (q.answerText != null) return prime(tr(q.answerText));       // có thể là khoá từ điển (vd "không có")
  if (q.format === 'choice') { const c = q.choices[q.answer]; return tr(c && typeof c === 'object' ? c.label : c); }
  return prime(q.answer);
}

/** Đáp án in trong lời nhắn: biểu thức ⇒ phông như sách, số / bit ⇒ mono. */
export function answerHtml(q) {
  const s = String(answerText(q));
  const esc = s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  if (q.layout === 'rows') return `<b>${s}</b>`;      // câu khái niệm: chữ từ điển đã thoát HTML sẵn (concepts.js)
  if (splitMatrices(s).some(p => typeof p !== 'string')) return `<b>${mathSpan(s).outerHTML}</b>`;   // đáp án là ma trận: vẽ lưới
  return `<b class="${/[a-z]/.test(s.replace(/Σm|ΠM/g, '')) && (q.mcq || q.format !== 'choice') ? 'step-math' : 'mono'}">${esc}</b>`;
}

const PH = { number: 'run.phNumber', set: 'run.phSet', text: 'run.phText' };

function actionBtn(label, onClick) {
  const b = h('button', 'btn primary', label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function questionView(q, { figures = {}, widgets = {}, given = null, locked = false, onSubmit = () => {}, action = null }) {
  const W = { ...SHARED_WIDGETS, ...widgets };
  let get = () => given ?? '';
  let box;

  if (q.format === 'choice') {
    box = h('div', 'run-choices' + (q.mcq ? ' mcq' : '') + (q.layout === 'rows' ? ' rows' : ''));
    q.choices.forEach((c, i) => {
      const b = h('button', 'choice');
      b.type = 'button';
      b.append(h('span', 'key', String(i + 1)));
      if (c && typeof c === 'object') {
        if (c.figure && figures[c.figure.type]) b.append(figures[c.figure.type](c.figure));
        b.append(h('span', 'choice-label', tr(c.label)));
        b.classList.add('visual');
      } else if (q.mcq) {                                         // trắc nghiệm biểu thức / dãy bit: chữ mono, dấu ′ như sách
        const t = mathSpan(String(c));
        t.classList.add('choice-text');
        b.append(t);
      } else b.append(h('span', null, tr(c)));
      if (locked) {
        b.disabled = true;
        if (i === q.answer) b.classList.add('right');
        else if (String(i) === given) b.classList.add('wrong');
      } else if (String(i) === given) b.classList.add('picked');
      b.addEventListener('click', () => onSubmit(String(i)));
      box.append(b);
    });
  } else if (q.input && W[q.input.type]) {
    const w = W[q.input.type](q.input, { given, locked, answer: locked ? q.answer : undefined, onSubmit: () => onSubmit(w.get()) });
    box = h('div', 'run-widget');
    box.append(w.el);
    if (!locked && action) box.append(actionBtn(action, () => onSubmit(w.get())));
    get = () => w.get();
  } else {
    box = h('div', 'run-answer');
    const inp = h('input');
    inp.type = 'text';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    if (q.format === 'number') inp.inputMode = 'decimal';
    inp.placeholder = T(PH[q.format] || PH.text);
    inp.value = given ?? '';
    inp.disabled = locked;
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); onSubmit(inp.value); } });
    box.append(inp);
    if (!locked && action) box.append(actionBtn(action, () => onSubmit(inp.value)));
    get = () => inp.value;
  }

  // hình + chỗ trả lời đặt cạnh nhau cho đỡ cuộn (vd mạch bên trái, bảng chân trị bên phải)
  const work = h('div', 'run-work');
  if (q.figure && figures[q.figure.type]) {
    const fig = h('div', 'run-fig');
    fig.append(figures[q.figure.type](q.figure));
    work.append(fig);
  }
  work.append(box);
  // "Trả lời: …" — nói rõ phải nhập gì, theo định dạng nào (đề Mano luôn nêu rõ điều này)
  const fmt = q.formatKey && T(q.formatKey) !== q.formatKey ? h('p', 'run-format', T(q.formatKey, tp(q.formatParams ?? q.textParams))) : null;
  return { nodes: [h('p', 'run-q', T(q.textKey, tp(q.textParams))), fmt, work].filter(Boolean), get: () => get() };
}

/** Dòng toán: có biến chữ ⇒ phông biểu thức như sách (x′y); chỉ số / bit ⇒ phông mono cho thẳng cột. */
function mathSpan(s) {
  const e = h('span', /[a-zA-Z]/.test(s.replace(/[ABCDEF]/g, '')) ? 'step-math' : 'mono');
  // ma trận '[1 2; 3 4]' (LinAlg) vẽ thành lưới có ngoặc, cột sau '|' có vạch ngăn
  for (const part of splitMatrices(s)) {
    if (typeof part === 'string') { e.append(prime(part)); continue; }
    const g = h('span', 'mat');
    g.style.gridTemplateColumns = `repeat(${part.rows[0].length}, auto)`;
    part.rows.forEach(r => r.forEach((x, j) => g.append(ht('span', j === part.bar ? 'bar' : null, x.replace('-', '−')))));
    e.append(g);
  }
  return e;
}

/** Một dòng lời giải: chuỗi toán thuần, { key, params } hoặc { key, params, m } — xem explainBlock. */
export function stepLine(w) {
  const line = h('div', typeof w === 'string' ? 'step calc' : 'step');
  if (typeof w === 'string') line.append(mathSpan(w));
  else {
    line.append(h('span', null, T(w.key, tp(w.params))));
    if (w.m !== undefined) line.append(' ', mathSpan(String(w.m)));
    if (w.table) line.append(stepTable(w.table));
  }
  return line;
}

/** Bảng trong lời giải (tableLine): cột biến | cột công thức con, cột kết quả đậm, dòng `mark` tô đỏ, dòng `pick` tô màu nhấn. */
function stepTable({ head, rows, vars, outs = [], mark = [], pick = [] }) {
  const cls = i => [i === vars ? 'sep' : '', outs.includes(i) ? 'out' : ''].join(' ').trim() || null;
  const t = h('table', 'fig-truth step-table');
  const hr = h('tr');
  head.forEach((x, i) => hr.append(ht('th', cls(i), x)));
  t.append(h('thead'));
  t.tHead.append(hr);
  const body = h('tbody');
  rows.forEach((r, k) => {
    const tr = h('tr', mark.includes(k) ? 'mark' : pick.includes(k) ? 'pick' : null);
    r.forEach((x, i) => tr.append(ht('td', cls(i), String(x))));
    body.append(tr);
  });
  t.append(body);
  const box = h('div', 'tblbox');
  box.append(t);
  return box;
}

/**
 * Khối "Lời giải từng bước" — hiện sau MỌI câu, đúng hay sai (D23). `q.work`: mỗi dòng là
 * chuỗi toán thuần, { key, params } (một câu), hoặc { key, params, m } (câu dẫn + phép tính).
 * Dùng chung cho bộ chạy luyện tập và bài full.
 * @returns {HTMLElement|null}
 */
export function explainBlock(q) {
  if (!q.explainKey && !q.work?.length) return null;
  const box = h('div', 'run-explain');
  box.append(h('b', null, T('run.solution')));
  if (q.explainKey) box.append(h('div', null, T(q.explainKey, tp(q.explainParams))));
  if (q.work?.length) {
    const lines = h('div', 'run-lines');
    for (const w of q.work) lines.append(stepLine(w));
    box.append(lines);
  }
  return box;
}
