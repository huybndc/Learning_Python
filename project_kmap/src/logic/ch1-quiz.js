/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 1 (thuần, không đụng DOM)
   Mỗi câu: { kind, text, answer, hint, meta }. Chấm bằng compareAnswer().
   `meta` giữ tham số sinh đề ở dạng có cấu trúc, để kiểm chứng/chấm lại mà
   không phải bóc tách chuỗi đề bằng regex.
   --------------------------------------------------------------- */

import { convertBase, fromDecimal } from './number-systems.js';
import { radixComplement, subtractByComplement } from './complements.js';
import { encode, range } from './signed-binary.js';import { fail } from './app-error.js';

export const KINDS = ['convert', 'complement', 'subtract', 'signed'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Đề đổi cơ số. */
function makeConvert(rnd) {
  const from = pick([2, 8, 10, 16], rnd);
  const to = pick([2, 8, 10, 16].filter(b => b !== from), rnd);
  const v = int(1, 255, rnd);
  const src = fromDecimal(v, from);
  return {
    kind: 'convert',
    textKey: 'c1q.qConvert',
    textParams: { src, from: 'base.' + from, to: 'base.' + to },
    answer: convertBase(src, from, to),
    hintKey: 'c1q.hConvert',
    hintParams: { to },
    meta: { src, from, to },
  };
}

/** Đề tính r's complement. */
function makeComplement(rnd) {
  const r = pick([2, 10], rnd);
  const width = r === 2 ? 7 : 4;
  const v = int(1, Math.pow(r, width) - 2, rnd);
  const src = fromDecimal(v, r).padStart(width, '0');
  return {
    kind: 'complement',
    textKey: 'c1q.qComplement',
    textParams: { r, src, width },
    answer: radixComplement(src, r).digits,
    hintKey: 'c1q.hComplement',
    hintParams: { r1: r - 1 },
    meta: { src, r, width },
  };
}

/** Đề trừ bằng complement. */
function makeSubtract(rnd) {
  const r = pick([2, 10], rnd);
  const width = r === 2 ? 6 : 3;
  const hi = Math.pow(r, width) - 1;
  let a = int(1, hi, rnd), b = int(1, hi, rnd);
  const A = fromDecimal(a, r).padStart(width, '0');
  const B = fromDecimal(b, r).padStart(width, '0');
  const res = subtractByComplement(A, B, r);
  return {
    kind: 'subtract',
    textKey: 'c1q.qSubtract',
    textParams: { r, a: A, b: B, width },
    answer: (res.negative ? '-' : '') + res.digits,
    meta: { m: A, n: B, r, width },
    hintKey: 'c1q.hSubtract',
    hintParams: { r },
  };
}

/** Đề biểu diễn số có dấu. */
function makeSigned(rnd) {
  const w = pick([5, 8], rnd);
  const format = pick(['magnitude', 'ones', 'twos'], rnd);
  const { min, max } = range(format, w);
  const v = int(min, max, rnd);
  const fmtKey = { magnitude: 'c1.fmtMagnitude', ones: 'c1.fmtOnes', twos: 'c1.fmtTwos' }[format];
  return {
    kind: 'signed',
    textKey: 'c1q.qSigned',
    textParams: { value: v, format: fmtKey, w },
    answer: encode(v, format, w),
    hintKey: v >= 0 ? 'c1q.hSignedPos' : 'c1q.hSignedNeg',
    hintParams: { w, format: fmtKey },
    meta: { value: v, format, w },
  };
}

const MAKERS = {
  convert: makeConvert,
  complement: makeComplement,
  subtract: makeSubtract,
  signed: makeSigned,
};

/** Sinh một câu hỏi; kind = 'mix' thì chọn ngẫu nhiên trong 4 dạng. */
export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) fail('err.badQuizKind', { kind });
  return make(rnd);
}

/**
 * So đáp án: bỏ khoảng trắng, không phân biệt hoa thường, và bỏ các số 0 ở
 * đầu (trừ khi đáp án chỉ toàn 0) để người học không bị trừ oan vì đệm 0.
 */
export function compareAnswer(given, expected) {
  const norm = s => {
    let t = String(s).trim().toUpperCase().replace(/\s+/g, '');
    let sign = '';
    if (t.startsWith('-') || t.startsWith('−')) { sign = '-'; t = t.slice(1); }
    t = t.replace(/^0+(?=.)/, '');
    return sign + t;
  };
  return norm(given) === norm(expected);
}
