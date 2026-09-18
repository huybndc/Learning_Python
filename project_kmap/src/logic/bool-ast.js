/* ---------------------------------------------------------------
   CÂY CÚ PHÁP BIỂU THỨC BOOLEAN
   Cùng ngữ pháp với expr-parser.js nhưng trả về cây thay vì hàm, để biến
   đổi được về mặt cấu trúc (dual, DeMorgan) rồi in lại thành chuỗi đúng
   thứ tự ưu tiên. Biến đổi trên chuỗi ký tự là sai, vì AND viết liền
   (B'C) và dấu ngoặc đều mang thông tin ưu tiên.

   Node: {t:'or'|'and', parts} | {t:'not', x} | {t:'var', k} | {t:'const', v}
   --------------------------------------------------------------- */

import { varNames } from './quine-mccluskey.js';

export function parseAst(text, n) {
  const names = varNames(n);
  const src = text.replace(/[·*.×∧&]/g, '').replace(/[|∨]/g, '+').replace(/[¬]/g, '!');
  let i = 0;
  const skip = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const peek = () => { skip(); return i < src.length ? src[i] : null; };
  const fail = msg => { throw new Error(msg + ' (vị trí ' + (i + 1) + ')'); };

  function parseOr() {
    const parts = [parseAnd()];
    while (peek() === '+') { i++; parts.push(parseAnd()); }
    return parts.length === 1 ? parts[0] : { t: 'or', parts };
  }
  function startsFactor() {
    const c = peek();
    if (c === null) return false;
    return c === '(' || c === '!' || c === '~' || c === '0' || c === '1' ||
      (names.includes(c.toUpperCase()) && /[a-z]/i.test(c));
  }
  function parseAnd() {
    const parts = [];
    while (startsFactor()) parts.push(parseNot());
    if (parts.length === 0) fail('thiếu toán hạng');
    return parts.length === 1 ? parts[0] : { t: 'and', parts };
  }
  function parseNot() {
    let neg = false;
    while (peek() === '!' || peek() === '~') { i++; neg = !neg; }
    let x = parseAtom();
    skip();
    while (i < src.length && (src[i] === "'" || src[i] === '’' || src[i] === '`')) { i++; neg = !neg; skip(); }
    return neg ? { t: 'not', x } : x;
  }
  function parseAtom() {
    const c = peek();
    if (c === null) fail('biểu thức kết thúc sớm');
    if (c === '(') {
      i++;
      const x = parseOr();
      if (peek() !== ')') fail('thiếu dấu )');
      i++;
      return x;
    }
    if (c === '0') { i++; return { t: 'const', v: 0 }; }
    if (c === '1') { i++; return { t: 'const', v: 1 }; }
    const k = names.indexOf(c.toUpperCase());
    if (k < 0) fail('ký tự không hợp lệ "' + c + '" — chỉ dùng ' + names.join(', '));
    i++;
    return { t: 'var', k };
  }

  const ast = parseOr();
  skip();
  if (i < src.length) fail('thừa ký tự "' + src[i] + '"');
  return ast;
}

/** Đánh giá cây tại minterm m (A là MSB). */
export function evalAst(ast, m, n) {
  switch (ast.t) {
    case 'const': return ast.v;
    case 'var': return (m >> (n - 1 - ast.k)) & 1;
    case 'not': return evalAst(ast.x, m, n) ^ 1;
    case 'or': return ast.parts.some(p => evalAst(p, m, n)) ? 1 : 0;
    case 'and': return ast.parts.every(p => evalAst(p, m, n)) ? 1 : 0;
    default: throw new Error('node lạ: ' + ast.t);
  }
}

/** Độ ưu tiên để quyết định có cần ngoặc khi in: OR thấp nhất. */
const PREC = { or: 1, and: 2, not: 3, var: 4, const: 4 };

/** In cây thành chuỗi, chỉ thêm ngoặc khi thật sự cần. */
export function formatAst(ast, n) {
  const names = varNames(n);
  const wrap = (node, minPrec) => {
    const s = go(node);
    return PREC[node.t] < minPrec ? '(' + s + ')' : s;
  };
  const go = node => {
    switch (node.t) {
      case 'const': return String(node.v);
      case 'var': return names[node.k];
      case 'not': {
        // biến đơn thì viết A', còn lại viết (…)'
        const inner = node.x;
        if (inner.t === 'var' || inner.t === 'const') return go(inner) + "'";
        return '(' + go(inner) + ")'";
      }
      case 'or': return node.parts.map(p => wrap(p, PREC.or)).join(' + ');
      case 'and': return node.parts.map(p => wrap(p, PREC.and + 1)).join('');
      default: throw new Error('node lạ: ' + node.t);
    }
  };
  return go(ast);
}

/** Dual: đổi OR ↔ AND, 0 ↔ 1, giữ nguyên biến và dấu phủ định. */
export function dualAst(ast) {
  switch (ast.t) {
    case 'const': return { t: 'const', v: ast.v ^ 1 };
    case 'var': return { ...ast };
    case 'not': return { t: 'not', x: dualAst(ast.x) };
    case 'or': return { t: 'and', parts: ast.parts.map(dualAst) };
    case 'and': return { t: 'or', parts: ast.parts.map(dualAst) };
    default: throw new Error('node lạ: ' + ast.t);
  }
}

/** Bù từng literal: A → A′, A′ → A (không đụng cấu trúc +/·). */
export function complementLiteralsAst(ast) {
  switch (ast.t) {
    case 'const': return { ...ast };
    case 'var': return { t: 'not', x: { ...ast } };
    case 'not': return ast.x.t === 'var' ? { ...ast.x } : { t: 'not', x: complementLiteralsAst(ast.x) };
    case 'or': return { t: 'or', parts: ast.parts.map(complementLiteralsAst) };
    case 'and': return { t: 'and', parts: ast.parts.map(complementLiteralsAst) };
    default: throw new Error('node lạ: ' + ast.t);
  }
}

/** Đẩy dấu phủ định xuống lá bằng DeMorgan: (x+y)′ = x′y′, (xy)′ = x′+y′. */
export function pushNot(ast) {
  switch (ast.t) {
    case 'const': return { t: 'const', v: ast.v ^ 1 };
    case 'var': return { t: 'not', x: { ...ast } };
    case 'not': return ast.x;                                  // (x′)′ = x
    case 'or': return { t: 'and', parts: ast.parts.map(pushNot) };
    case 'and': return { t: 'or', parts: ast.parts.map(pushNot) };
    default: throw new Error('node lạ: ' + ast.t);
  }
}
