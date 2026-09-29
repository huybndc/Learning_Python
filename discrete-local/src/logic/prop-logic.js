/* ---------------------------------------------------------------
   LOGIC MỆNH ĐỀ (MCS 1, 3; Rosen 1.1–1.3) — thuần, không biết ngôn ngữ.
   Ngữ pháp, ưu tiên từ thấp tới cao (↔ thấp nhất, ¬ cao nhất):
     iff  := imp ('↔' imp)*            (kết hợp trái)
     imp  := or ('→' imp)?             (kết hợp PHẢI: p → q → r = p → (q → r))
     or   := xor ('∨' xor)*
     xor  := and ('⊕' and)*
     and  := not ('∧' not)*
     not  := '¬' not | atom ;  atom := '(' iff ')' | biến p..z | T | F
   Nhận cả kiểu gõ ASCII: ~ ! -, & ^, |, xor, ->, =>, <->, <=>.
   Cây: { t: 'var'|'const'|'not'|'and'|'or'|'xor'|'imp'|'iff', … }
   --------------------------------------------------------------- */

import { fail } from '@shared/logic/app-error.js';

const ASCII = [[/<->|<=>|\biff\b/g, '↔'], [/->|=>/g, '→'], [/\bxor\b/g, '⊕'], [/\band\b|&&?|\^/g, '∧'], [/\bor\b|\|\|?/g, '∨'], [/\bnot\b|[~!¬]/g, '¬']];

/** Chuỗi ASCII → ký hiệu chuẩn (để hiện lại đúng như sách). */
export const normalize = s => ASCII.reduce((acc, [re, to]) => acc.replace(re, to), String(s));

export function parseProp(text) {
  const src = normalize(text).replace(/\s+/g, '');
  let i = 0;
  const peek = () => src[i];
  const eat = c => (src[i] === c ? (i++, true) : false);
  const bin = (t, op, next) => () => {
    let a = next();
    while (eat(op)) a = { t, a, b: next() };
    return a;
  };
  const atom = () => {
    const c = peek();
    if (c === '(') { i++; const e = iff(); if (!eat(')')) fail('err.propParen', { pos: i + 1 }); return e; }
    if (c === 'T' || c === 'F') { i++; return { t: 'const', v: c === 'T' }; }
    if (c && /[p-z]/.test(c)) { i++; return { t: 'var', v: c }; }
    return fail(c ? 'err.propChar' : 'err.propEnd', { ch: c ?? '', pos: i + 1 });
  };
  const not = () => (eat('¬') ? { t: 'not', a: not() } : atom());
  const and = bin('and', '∧', not);
  const xor = bin('xor', '⊕', and);
  const or = bin('or', '∨', xor);
  const imp = () => { const a = or(); return eat('→') ? { t: 'imp', a, b: imp() } : a; };
  const iff = bin('iff', '↔', imp);
  if (!src) fail('err.propEmpty');
  const e = iff();
  if (i < src.length) fail('err.propChar', { ch: src[i], pos: i + 1 });
  return e;
}

/** Các biến theo thứ tự chữ cái (p, q, r, …). */
export function varsOf(ast) {
  const out = new Set();
  (function walk(n) { if (n.t === 'var') out.add(n.v); if (n.a) walk(n.a); if (n.b) walk(n.b); })(ast);
  return [...out].sort();
}

export function evalProp(ast, env) {
  switch (ast.t) {
    case 'var': return !!env[ast.v];
    case 'const': return ast.v;
    case 'not': return !evalProp(ast.a, env);
    case 'and': return evalProp(ast.a, env) && evalProp(ast.b, env);
    case 'or': return evalProp(ast.a, env) || evalProp(ast.b, env);
    case 'xor': return evalProp(ast.a, env) !== evalProp(ast.b, env);
    case 'imp': return !evalProp(ast.a, env) || evalProp(ast.b, env);
    case 'iff': return evalProp(ast.a, env) === evalProp(ast.b, env);
    default: return fail('err.propNode', { t: ast.t });
  }
}

/** Môi trường của dòng m (biến đầu là bit cao — dòng 0 = mọi biến sai, như widget bảng chân trị). */
export const rowEnv = (vars, m) => Object.fromEntries(vars.map((v, k) => [v, !!((m >> (vars.length - 1 - k)) & 1)]));

/** Cột kết quả dạng '0110…' trên tập biến `vars` (mặc định: biến của chính công thức). */
export function truthColumn(ast, vars = varsOf(ast)) {
  let s = '';
  for (let m = 0; m < 1 << vars.length; m++) s += evalProp(ast, rowEnv(vars, m)) ? '1' : '0';
  return s;
}

/** 'tautology' | 'contradiction' | 'contingent' (khả thỏa nhưng không hằng đúng). */
export function classify(ast) {
  const col = truthColumn(ast);
  return /^1+$/.test(col) ? 'tautology' : /^0+$/.test(col) ? 'contradiction' : 'contingent';
}

/** Tương đương logic: cùng cột trên HỢP các biến của hai công thức. */
export function equivalent(a, b) {
  const vars = [...new Set([...varsOf(a), ...varsOf(b)])].sort();
  return truthColumn(a, vars) === truthColumn(b, vars);
}

const PREC = { iff: 1, imp: 2, or: 3, xor: 4, and: 5, not: 6, var: 7, const: 7 };
const SYM = { iff: '↔', imp: '→', or: '∨', xor: '⊕', and: '∧' };

/**
 * In lại công thức như sách: ngoặc khi ưu tiên đòi hỏi, và cả khi hai phép nhị phân KHÁC nhau lồng nhau
 * (viết (p ∧ q) ∨ r chứ không p ∧ q ∨ r — đúng nhưng khó đọc). → kết hợp phải: p → q → r giữ nguyên.
 */
export function formatProp(ast) {
  const binary = n => n.t in SYM;
  const wrap = (n, need) => (PREC[n.t] < need || (binary(n) && binary(ast) && n.t !== ast.t) ? `(${formatProp(n)})` : formatProp(n));
  switch (ast.t) {
    case 'var': return ast.v;
    case 'const': return ast.v ? 'T' : 'F';
    case 'not': return '¬' + wrap(ast.a, PREC.not);
    case 'imp': return `${wrap(ast.a, PREC.imp + 1)} → ${wrap(ast.b, PREC.imp)}`;
    default: return `${wrap(ast.a, PREC[ast.t])} ${SYM[ast.t]} ${wrap(ast.b, PREC[ast.t] + 1)}`;
  }
}

/** Các công thức con theo thứ tự tính (lá trước) — cột phụ của bảng chân trị từng bước. */
export function subformulas(ast) {
  const out = [];
  (function walk(n) {
    if (n.t === 'var' || n.t === 'const') return;
    if (n.a) walk(n.a);
    if (n.b) walk(n.b);
    const s = formatProp(n);
    if (!out.some(x => x.text === s)) out.push({ text: s, ast: n });
  })(ast);
  return out;
}

/**
 * Bảng chân trị đầy đủ cho lời giải: cột các biến rồi cột từng công thức con của `asts` (không lặp),
 * dòng i = rowEnv(vars, i) — dòng 0 là mọi biến sai, biến đầu là bit cao (như widget và cột đáp án).
 * @returns {{ head: string[], rows: number[][], vars: number, outs: number[] }}  outs = cột của từng công thức trong `asts`
 */
export function truthTable(asts, vars) {
  const cols = [];
  for (const a of asts) for (const c of subformulas(a)) if (!cols.some(x => x.text === c.text)) cols.push(c);
  const head = [...vars, ...cols.map(c => c.text)];
  const rows = Array.from({ length: 1 << vars.length }, (_, m) => {
    const env = rowEnv(vars, m);
    return [...vars.map(v => (env[v] ? 1 : 0)), ...cols.map(c => (evalProp(c.ast, env) ? 1 : 0))];
  });
  return { head, rows, vars: vars.length, outs: asts.map(a => head.indexOf(formatProp(a))) };
}
