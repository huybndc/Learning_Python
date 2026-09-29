import { $, ht } from '@shared/ui/dom.js';
import { fail } from '@shared/logic/app-error.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';
import { parseProp, varsOf, evalProp, rowEnv, subformulas, formatProp, classify } from '../logic/prop-logic.js';
import { pulverize, modPow, lcm, mod, isPrime, rsaKeys } from '../logic/number-theory.js';

/* ---------------------------------------------------------------
   CÔNG CỤ BẤM THỬ (mục Công cụ, D25): markup ở src/pages/chN.html (khung *-interactive),
   ở đây chỉ tính và vẽ kết quả. Mọi phép tính lấy từ logic/ — công cụ và lời giải câu hỏi dùng chung một lõi.
     D1  bảng chân trị tự dựng (cột phụ cho từng công thức con, so với G)
     D6  Euclid / Pulverizer bấm từng dòng, giữ bất biến r = s·a + t·b
     D7  lũy thừa mod bằng bình phương liên tiếp · sân chơi RSA
   --------------------------------------------------------------- */

const num = x => String(x).replace('-', '−');                 // dấu trừ Unicode như sách
const par = x => (x < 0 ? `(${num(x)})` : num(x));            // số âm trong phép nhân cần ngoặc
const say = (host, text, cls = '') => host.append(ht('div', cls, text));
const msg = (host, ok, text) => host.append(ht('div', 'msg ' + (ok ? 'ok' : 'bad'), text));

function readInt(sel) {
  const s = $(sel).value.trim().replace('−', '-');
  if (!/^-?\d+$/.test(s)) fail('err.needInt');
  return +s;
}

/** Chạy một lần vẽ; lỗi (AppError) hiện ở ô lỗi của công cụ thay vì làm vỡ trang. */
function guarded(errSel, clear, draw) {
  return () => {
    clear();
    $(errSel).textContent = '';
    try { draw(); } catch (e) { clear(); $(errSel).textContent = T('err.prefix') + tError(e); }
  };
}

function tableOf(host, head, rows) {
  host.replaceChildren(
    ht('thead'), ht('tbody'),
  );
  const tr = ht('tr');
  head.forEach(([text, cls]) => tr.append(ht('th', cls, text)));
  host.tHead.append(tr);
  rows.forEach(({ cells, cls }) => {
    const r = ht('tr', cls);
    cells.forEach(([text, c]) => r.append(ht('td', c, text)));
    host.tBodies[0].append(r);
  });
}

/* ---------------- D1: bảng chân trị tự dựng ---------------- */
const MAX_VARS = 6;

const colsOf = ast => {
  const subs = subformulas(ast);
  return subs.length ? subs : [{ text: formatProp(ast), ast }];   // công thức chỉ là một biến
};

const drawTruth = guarded('#t1-err', () => { $('#t1-table').replaceChildren(); $('#t1-verdict').replaceChildren(); }, () => {
  const f = parseProp($('#t1-f').value);
  const g = $('#t1-g').value.trim() ? parseProp($('#t1-g').value) : null;
  const vars = [...new Set([...varsOf(f), ...(g ? varsOf(g) : [])])].sort();
  if (vars.length > MAX_VARS) fail('t1.tooMany', { n: MAX_VARS });
  const fText = formatProp(f), gText = g && formatProp(g);
  const cols = [];
  [...colsOf(f), ...(g ? colsOf(g) : [])].forEach(c => { if (!cols.some(x => x.text === c.text)) cols.push(c); });
  const finals = new Set([fText, gText]);
  const diff = [];
  const rows = Array.from({ length: 1 << vars.length }, (_, m) => {
    const env = rowEnv(vars, m);
    if (g && evalProp(f, env) !== evalProp(g, env)) diff.push(m);
    return {
      cls: diff.at(-1) === m ? 'diff' : '',
      cells: [
        ...vars.map(v => [env[v] ? '1' : '0', env[v] ? 'val-1' : 'val-0']),
        ...cols.map(c => {
          const v = evalProp(c.ast, env);
          return [v ? '1' : '0', (v ? 'val-1' : 'val-0') + (finals.has(c.text) ? ' fin' : '')];
        }),
      ],
    };
  });
  const label = c => (c.text === fText ? 'F = ' : c.text === gText ? 'G = ' : '') + c.text;
  tableOf($('#t1-table'), [...vars.map(v => [v]), ...cols.map(c => [label(c), finals.has(c.text) ? 'fin' : ''])], rows);

  const host = $('#t1-verdict');
  say(host, `F: ${T('c1q.cls.' + classify(f))}`, 'small');
  if (g) say(host, `G: ${T('c1q.cls.' + classify(g))}`, 'small');
  if (g) msg(host, !diff.length, diff.length
    ? `${T('c1q.noEquiv')} — ${T('c1q.wrongRows', { rows: diff.join(', ') })}`
    : `${T('c1q.yesEquiv')}: ${T('s1.sameCol')}`);
});

/* ---------------- D6: Euclid / Pulverizer từng dòng ---------------- */
let shown = 2;                   // số dòng bảng đang hiện (2 dòng đầu là a, b)

const drawPulverizer = guarded('#t6-err', () => {
  ['#t6-table', '#t6-out'].forEach(s => $(s).replaceChildren());
  $('#t6-say').textContent = '';
}, () => {
  const a = readInt('#t6-a'), b = readInt('#t6-b');
  if (a <= 0 || b <= 0) fail('err.needPositive');
  const P = pulverize(a, b);
  shown = Math.min(shown, P.rows.length);
  const done = shown === P.rows.length;
  const gRow = P.rows.length - 2;
  tableOf($('#t6-table'),
    [['#'], ['q'], ['r'], ['s'], ['t'], ['s·a + t·b']],
    P.rows.slice(0, shown).map((w, i) => ({
      cls: done && i === gRow ? 'hit' : '',
      cells: [[String(i), 'val-0'], [w.q ?? '', 'val-0'], [num(w.r)], [num(w.s)], [num(w.t)],
        [`${par(w.s)}·${a} + ${par(w.t)}·${b} = ${num(w.s * a + w.t * b)}`, 'val-0']],
    })));
  $('#t6-next').disabled = $('#t6-all').disabled = done;
  if (shown === 2) { $('#t6-say').textContent = T('t6.start'); return; }
  const [p, c, w] = P.rows.slice(shown - 3, shown);
  $('#t6-say').textContent = T('t6.step', {
    i: shown - 1, q: w.q, p: p.r, c: c.r, r: num(w.r),
    ps: num(p.s), cs: par(c.s), s: num(w.s), pt: num(p.t), ct: par(c.t), t: num(w.t),
  });
  if (!done) return;
  const out = $('#t6-out');
  msg(out, true, T('t6.done', { a, b, g: P.gcd, s: par(P.s), t: par(P.t) }));
  say(out, T('t6.lcm', { a, b, g: P.gcd, l: lcm(a, b) }), 'small');
  if (P.gcd === 1) say(out, T('t6.inv', { a, b, ia: mod(P.s, b), ib: mod(P.t, a) }), 'small');
});

/* ---------------- D7: lũy thừa mod bằng bình phương liên tiếp ---------------- */
const drawPow = guarded('#t7-err', () => {
  ['#t7-table', '#t7-out'].forEach(s => $(s).replaceChildren());
  $('#t7-bits').textContent = '';
}, () => {
  const a = readInt('#t7-a'), k = readInt('#t7-k'), n = readInt('#t7-n');
  const P = modPow(a, k, n);
  const used = new Set(P.used);
  $('#t7-bits').textContent = T('t7.bits', { k, bits: P.bits, used: P.used.map(i => 2 ** i).join(' + ') || '0' });
  tableOf($('#t7-table'),
    [['i'], ['2ⁱ'], [T('t7.how')], [`a^(2ⁱ) mod ${n}`], [T('t7.bit')]],
    P.squares.map(({ i, v }) => ({
      cls: used.has(i) ? 'hit' : '',
      cells: [[String(i), 'val-0'], [String(2 ** i)],
        [i ? `${P.squares[i - 1].v}² = ${P.squares[i - 1].v ** 2}` : `${a} mod ${n}`, 'val-0'],
        [String(v), 'val-1'], [used.has(i) ? '1' : '0', used.has(i) ? 'val-1' : 'val-0']],
    })));
  const terms = P.used.map(i => P.squares[i].v);
  msg($('#t7-out'), true, T('t7.prod', { a, k, n, terms: terms.join(' · ') || '1', v: P.value }));
});

/* ---------------- D7: sân chơi RSA ---------------- */
const drawRsa = guarded('#r-err', () => $('#r-steps').replaceChildren(), () => {
  const p = readInt('#r-p'), q = readInt('#r-q'), e = readInt('#r-e'), m = readInt('#r-m');
  [p, q].forEach(x => { if (!isPrime(x)) fail('t7.notPrime', { x }); });
  if (p === q) fail('t7.samePq');
  const K = rsaKeys(p, q, e);
  if (m < 0 || m >= K.n) fail('t7.badM', { n: K.n });
  const c = modPow(m, e, K.n).value, back = modPow(c, K.d, K.n).value;
  const P = pulverize(e, K.phi);
  const host = $('#r-steps');
  [
    T('t7.n', { p, q, n: K.n }),
    T('t7.phi', { p1: p - 1, q1: q - 1, phi: K.phi }),
    T('t7.d', { s: par(P.s), e, t: par(P.t), phi: K.phi, d: K.d }),
    T('t7.keys', { e, d: K.d, n: K.n }),
    T('t7.enc', { m, e, n: K.n, c }),
    T('t7.dec', { c, d: K.d, n: K.n, back }),
  ].forEach(s => say(host, s, 'mono'));
  msg(host, back === m, T(back === m ? 't7.ok' : 't7.bad', { m }));
});

export function setupTools() {
  const on = (sels, fn) => sels.forEach(s => $(s).addEventListener('input', fn));
  on(['#t1-f', '#t1-g'], drawTruth);
  on(['#t6-a', '#t6-b'], () => { shown = 2; drawPulverizer(); });
  $('#t6-next').addEventListener('click', () => { shown++; drawPulverizer(); });
  $('#t6-all').addEventListener('click', () => { shown = Infinity; drawPulverizer(); });
  on(['#t7-a', '#t7-k', '#t7-n'], drawPow);
  on(['#r-p', '#r-q', '#r-e', '#r-m'], drawRsa);
  const all = () => { drawTruth(); drawPulverizer(); drawPow(); drawRsa(); };
  onLangChange(all);
  all();
}
