/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D1 — Mệnh đề & logic (MCS 1, 3; Rosen 1.1–1.3). Thuần, không biết ngôn ngữ.
   Đáp án luôn TÍNH từ bảng chân trị (prop-logic.js), không lấy từ nhãn soạn tay:
   mẫu "luật" chỉ để có đề hay, đúng/sai do máy kiểm lại.
   --------------------------------------------------------------- */

import { parseProp, formatProp, truthColumn, classify, equivalent, evalProp, varsOf, rowEnv, truthTable } from './prop-logic.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, int, shuffle } from '@shared/logic/shuffle.js';
import { line as L, tableLine } from '@shared/logic/steps.js';

export const KINDS = ['table', 'value', 'classify', 'equiv', 'contra'];
export const GROUPS = [
  { id: 'g-table', kinds: ['table', 'value'] },
  { id: 'g-laws', kinds: ['classify', 'equiv', 'contra'] },
];
export const SECONDS = { table: 120, value: 60, classify: 90, equiv: 90, contra: 45 };

const OPS = ['∧', '∨', '→', '↔', '⊕'];
const TF = b => (b ? 'T' : 'F');

/** Đổi tên biến p, q, r theo hoán vị ngẫu nhiên — cùng một luật, đề trông khác. */
function rename(text, rnd) {
  const to = shuffle(['p', 'q', 'r'], rnd);
  return text.replace(/[pqr]/g, v => to['pqr'.indexOf(v)]);
}

/** Công thức ngẫu nhiên đủ `n` biến, độ sâu vừa phải (2–3 phép nhị phân); mặc định cột có cả 0 lẫn 1. */
function randomFormula(n, rnd, contingentOnly = true) {
  const vars = ['p', 'q', 'r'].slice(0, n);
  const neg = () => (rnd() < 0.3 ? '¬' : '');
  const leaf = () => neg() + pick(vars, rnd);
  // một cặp "x op y" luôn hai biến KHÁC nhau — q → q, p ∧ ¬p làm cột thành hằng, đề vô vị
  const pair = () => { const [x, y] = shuffle(vars, rnd); return `(${neg()}${x} ${pick(OPS, rnd)} ${neg()}${y})`; };
  for (;;) {
    const f = rnd() < 0.5 ? `${pair()} ${pick(OPS, rnd)} ${leaf()}` : `${neg()}${pair()} ${pick(OPS, rnd)} ${pair()}`;
    const ast = parseProp(f);
    if (varsOf(ast).length !== n || (contingentOnly && classify(ast) !== 'contingent')) continue;
    if (!/\b([p-r]) [∧∨→↔⊕] ¬?\1\b/.test(formatProp(ast))) return ast;     // bỏ "p ∨ p", "q ∧ ¬q" khi in ra
  }
}

/** Bảng chân trị đầy đủ (cột biến | cột từng công thức con) — người học dò lại được từng ô, như Rosen lập bảng. */
function tableOf(asts, vars, mark = []) {
  return tableLine('s1.cols', { vars: vars.join(', ') }, { ...truthTable(asts, vars), mark });
}

function makeTable(rnd) {
  const n = pick([2, 3, 3], rnd);
  const ast = randomFormula(n, rnd);
  const vars = ['p', 'q', 'r'].slice(0, n);
  const f = formatProp(ast);
  return {
    kind: 'table', format: 'text',
    textKey: 'c1q.qTable', textParams: { f },
    answer: truthColumn(ast, vars),
    input: { type: 'truth', vars, mode: 'column' },
    hintKey: 'c1q.hTable',
    meta: { f, vars },
    work: [tableOf([ast], vars), L('s1.readCol', {}, `${f}: ${truthColumn(ast, vars)}`)],
  };
}

function makeValue(rnd) {
  const n = pick([2, 3], rnd);
  const ast = randomFormula(n, rnd);
  const vars = varsOf(ast);
  const row = int(0, (1 << n) - 1, rnd);
  const env = rowEnv(vars, row);
  const f = formatProp(ast);
  const v = evalProp(ast, env);
  return {
    kind: 'value', format: 'choice',
    textKey: 'c1q.qValue', textParams: { f, env: vars.map(x => `${x} = ${TF(env[x])}`).join(', ') },
    choices: ['c1q.true', 'c1q.false'], answer: v ? 0 : 1,
    meta: { f, env },
    // chỉ dòng đang hỏi của bảng chân trị
    work: [tableLine('s1.inside', {}, (t => ({ ...t, rows: [t.rows[row]] }))(truthTable([ast], vars))), L('s1.result', {}, TF(v))],
  };
}

/* Mẫu cho câu phân loại: A, B, C được thay bằng biến (đổi tên ngẫu nhiên). */
const TAUT = ['p ∨ ¬p', '(p ∧ (p → q)) → q', '((p → q) ∧ (q → r)) → (p → r)', '(p → q) ↔ (¬q → ¬p)', '¬(p ∧ q) ↔ (¬p ∨ ¬q)', '(¬q ∧ (p → q)) → ¬p', 'p → (p ∨ q)'];
const CONTRA = ['p ∧ ¬p', '(p ↔ q) ∧ (p ⊕ q)', '¬(p → q) ∧ q', '(p → q) ∧ (p ∧ ¬q)', '¬(p ∨ ¬p)'];

function makeClassify(rnd) {
  const want = pick(['tautology', 'contradiction', 'contingent'], rnd);
  let ast;
  if (want === 'contingent') do ast = randomFormula(pick([2, 3], rnd), rnd); while (classify(ast) !== 'contingent');
  else ast = parseProp(rename(pick(want === 'tautology' ? TAUT : CONTRA, rnd), rnd));
  const cls = classify(ast);
  const vars = varsOf(ast);
  const col = truthColumn(ast, vars);
  const order = ['tautology', 'contradiction', 'contingent'];
  return {
    kind: 'classify', format: 'choice',
    textKey: 'c1q.qClassify', textParams: { f: formatProp(ast) },
    choices: order.map(c => 'c1q.cls.' + c), answer: order.indexOf(cls),
    meta: { f: formatProp(ast) },
    work: [tableOf([ast], vars), L('s1.cls.' + cls, {}, col)],
  };
}

/* Cặp để hỏi tương đương: gồm luật thật lẫn "luật" hay nhớ nhầm — đáp án do máy tính. */
const PAIRS = [
  ['p → q', '¬p ∨ q'], ['p → q', '¬q → ¬p'], ['p → q', 'q → p'], ['p → q', '¬p → ¬q'],
  ['¬(p ∧ q)', '¬p ∨ ¬q'], ['¬(p ∧ q)', '¬p ∧ ¬q'], ['¬(p ∨ q)', '¬p ∧ ¬q'], ['¬(p ∨ q)', '¬p ∨ ¬q'],
  ['p ∧ (q ∨ r)', '(p ∧ q) ∨ (p ∧ r)'], ['p ∧ (q ∨ r)', '(p ∧ q) ∨ r'], ['p ∨ (q ∧ r)', '(p ∨ q) ∧ (p ∨ r)'],
  ['p ↔ q', '(p → q) ∧ (q → p)'], ['p ⊕ q', '¬(p ↔ q)'], ['¬(p → q)', 'p ∧ ¬q'], ['¬(p → q)', '¬p → ¬q'],
  ['(p → r) ∧ (q → r)', '(p ∨ q) → r'], ['(p → r) ∧ (q → r)', '(p ∧ q) → r'], ['p → (q → r)', '(p ∧ q) → r'],
  ['p → (q → r)', '(p → q) → r'], ['(p → q) ∧ (p → r)', 'p → (q ∧ r)'],
];

function makeEquiv(rnd) {
  const [x, y] = pick(PAIRS, rnd).map(s => rename(s, rnd));
  const [a, b] = rnd() < 0.5 ? [x, y] : [y, x];
  const A = parseProp(a), B = parseProp(b);
  const same = equivalent(A, B);
  const vars = [...new Set([...varsOf(A), ...varsOf(B)])].sort();
  const ca = truthColumn(A, vars), cb = truthColumn(B, vars);
  const diff = [...ca].findIndex((c, i) => c !== cb[i]);
  const env = diff >= 0 ? rowEnv(vars, diff) : null;
  return {
    kind: 'equiv', format: 'choice',
    textKey: 'c1q.qEquiv', textParams: { a: formatProp(A), b: formatProp(B) },
    choices: ['c1q.yesEquiv', 'c1q.noEquiv'], answer: same ? 0 : 1,
    meta: { a, b },
    work: [
      tableOf([A, B], vars, [...ca].flatMap((c, i) => (c !== cb[i] ? [i] : []))),
      `${formatProp(A)} :  ${ca}`, `${formatProp(B)} :  ${cb}`,
      same ? L('s1.sameCol') : L('s1.diffRow', { row: vars.map(v => `${v} = ${TF(env[v])}`).join(', ') }),
    ],
  };
}

/** Đảo / phản đảo / nghịch đảo của một phép kéo theo có vế là công thức nhỏ. */
function makeContra(rnd) {
  const part = () => { const v = pick(['p', 'q', 'r'], rnd); return rnd() < 0.5 ? v : `${v} ${pick(['∧', '∨'], rnd)} ${pick(['p', 'q', 'r'].filter(x => x !== v), rnd)}`; };
  let X, Y;
  do { X = parseProp(part()); Y = parseProp(part()); } while (formatProp(X) === formatProp(Y));
  const neg = n => (n.t === 'not' ? n.a : { t: 'not', a: n });
  const imp = (a, b) => formatProp({ t: 'imp', a, b });
  const forms = { contrapositive: imp(neg(Y), neg(X)), converse: imp(Y, X), inverse: imp(neg(X), neg(Y)), negation: formatProp({ t: 'and', a: X, b: neg(Y) }) };
  const ask = pick(['contrapositive', 'converse', 'inverse'], rnd);
  const order = shuffle(Object.keys(forms), rnd);
  return {
    kind: 'contra', format: 'choice', mcq: true,
    textKey: 'c1q.qContra', textParams: { f: imp(X, Y), ask: 'c1q.form.' + ask },
    choices: order.map(k => forms[k]), answer: order.indexOf(ask),
    meta: { f: imp(X, Y), ask },
    work: [L('s1.form.' + ask, {}, forms[ask]), ...(ask === 'contrapositive' ? [L('s1.contraSame')] : [L('s1.notSame')])],
  };
}

const MAKERS = { table: makeTable, value: makeValue, classify: makeClassify, equiv: makeEquiv, contra: makeContra };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c1q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.format === 'choice') return { ok: Number(given) === q.answer };
  const bits = String(given).replace(/\s+/g, '');
  if (bits.length !== q.answer.length || !/^[01]+$/.test(bits)) return { retry: true, detailKey: 'c1q.needBits', detailParams: { n: q.answer.length } };
  const wrong = [...bits].flatMap((b, i) => (b !== q.answer[i] ? [i] : []));
  return wrong.length ? { ok: false, detailKey: 'c1q.wrongRows', detailParams: { rows: wrong.join(', ') } } : { ok: true };
}
