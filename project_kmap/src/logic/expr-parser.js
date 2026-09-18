import { varNames, splitValues } from './quine-mccluskey.js';
import { fail as appFail } from './app-error.js';

/* ---------------------------------------------------------------
   5. PHÂN TÍCH CÚ PHÁP BIỂU THỨC BOOLEAN
   Ngữ pháp:  or := and ('+' and)* ;  and := not+ ;
              not := ('!'|'~')* atom "'"* ;  atom := '(' or ')' | VAR | '0' | '1'
   --------------------------------------------------------------- */

export function parseBoolExpr(text, n) {
  const names = varNames(n);
  const src = text.replace(/[·*.×∧&]/g, '').replace(/[|∨]/g, '+').replace(/[¬]/g, '!');
  let i = 0;
  const skip = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const peek = () => { skip(); return i < src.length ? src[i] : null; };
  const fail = (key, params) => appFail(key, { ...params, pos: i + 1 });

  function parseOr() {
    const parts = [parseAnd()];
    while (peek() === '+') { i++; parts.push(parseAnd()); }
    return parts.length === 1 ? parts[0] : m => parts.some(f => f(m)) ? 1 : 0;
  }
  function startsFactor() {
    const c = peek();
    if (c === null) return false;
    return c === '(' || c === '!' || c === '~' || c === '0' || c === '1' ||
      names.includes(c.toLowerCase()) && /[a-z]/i.test(c);
  }
  function parseAnd() {
    const parts = [];
    while (startsFactor()) parts.push(parseNot());
    if (parts.length === 0) fail('err.missingOperand');
    return parts.length === 1 ? parts[0] : m => parts.every(f => f(m)) ? 1 : 0;
  }
  function parseNot() {
    let neg = false;
    while (peek() === '!' || peek() === '~') { i++; neg = !neg; }
    let f = parseAtom();
    skip();
    while (i < src.length && (src[i] === "'" || src[i] === '’' || src[i] === '`')) { i++; const g = f; f = m => g(m) ^ 1; skip(); }
    if (neg) { const g = f; f = m => g(m) ^ 1; }
    return f;
  }
  function parseAtom() {
    const c = peek();
    if (c === null) fail('err.exprEndedEarly');
    if (c === '(') {
      i++;
      const f = parseOr();
      if (peek() !== ')') fail('err.missingParen');
      i++;
      return f;
    }
    if (c === '0') { i++; return () => 0; }
    if (c === '1') { i++; return () => 1; }
    const k = names.indexOf(c.toLowerCase());
    if (k < 0) fail('err.badVar', { ch: c, names: names.join(', ') });
    i++;
    const bit = n - 1 - k;
    return m => (m >> bit) & 1;
  }

  const f = parseOr();
  skip();
  if (i < src.length) fail('err.extraChar', { ch: src[i] });
  return f;
}

/** Bảng chân trị của một biểu thức chuỗi. */
export function exprTruthTable(text, n) {
  const f = parseBoolExpr(text, n);
  const out = new Array(1 << n);
  for (let m = 0; m < (1 << n); m++) out[m] = f(m) ? 1 : 0;
  return out;
}

/** Đếm số term và số literal của biểu thức viết ở dạng SOP phẳng. */
export function sopStats(text, n) {
  const names = varNames(n);
  const parts = text.split('+').map(s => s.trim()).filter(s => s.length);
  if (text.includes('(')) return null;               // có ngoặc ⇒ không phải SOP phẳng
  let literals = 0;
  for (const p of parts) {
    const toks = p.match(/[A-Za-z]\s*['’`]?|[!~]\s*[A-Za-z]|[01]/g) || [];
    for (const t of toks) {
      const v = t.replace(/[^A-Za-z]/g, '').toLowerCase();
      if (v && !names.includes(v)) return null;
      if (v) literals++;
    }
  }
  return { terms: parts.length, literals };
}

/* ---------------------------------------------------------------
   6. ĐỌC CHUỖI Σm(...) / ΠM(...) / d(...)
   --------------------------------------------------------------- */

export function parseSpec(text, n) {
  const size = 1 << n;
  const grab = re => {
    const mm = text.match(re);
    if (!mm) return null;
    const body = mm[1].trim();
    if (body === '') return [];
    return body.split(/[,\s;]+/).filter(s => s.length).map(s => {
      const v = Number(s);
      if (!Number.isInteger(v) || v < 0 || v >= size) appFail('err.mintermRange', { value: s, max: size - 1 });
      return v;
    });
  };
  const dcs = grab(/[dDxX]\s*\(([^)]*)\)/) || [];
  const mins = grab(/(?:^|[^A-Za-z])m\s*\(([^)]*)\)/) || (/[Σ∑S]/.test(text) ? grab(/[Σ∑S]\s*\(([^)]*)\)/) : null);
  const maxs = grab(/(?:^|[^A-Za-z])M\s*\(([^)]*)\)/) || (/[Π∏P]/.test(text) ? grab(/[Π∏P]\s*\(([^)]*)\)/) : null);

  if (!mins && !maxs) appFail('err.noSpec');
  if (mins && maxs) appFail('err.bothSpec');

  const values = new Array(size).fill(0);
  if (mins) {
    for (const m of mins) values[m] = 1;
  } else {
    values.fill(1);
    for (const m of maxs) values[m] = 0;   // maxterm ⇒ ô đó bằng 0
  }
  for (const m of dcs) values[m] = 2;
  return values;
}

/** Sinh lại chuỗi Σm(...) + d(...) từ values. */
export function formatSpec(values) {
  const { ones, dcs } = splitValues(values);
  let s = 'Σm(' + ones.join(',') + ')';
  if (dcs.length) s += ' + d(' + dcs.join(',') + ')';
  return s;
}
