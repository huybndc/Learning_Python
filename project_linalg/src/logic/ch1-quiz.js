import { fail } from './app-error.js';
import { fmtVec, fmt, fmtParen, clean } from './num-format.js';
import { add, sub, dot, norm, angleDeg, combine, scale, projection } from './vector.js';

/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 1 (thuần, không đụng DOM)
   Mỗi câu: { kind, textKey, textParams, answer, tol, hintKey, hintParams, meta }.
   `answer` là số hoặc mảng số — ui/ chấm bằng logic/answer-check.js, nên viết
   "(3, -2)" hay "3 -2" đều được.
   --------------------------------------------------------------- */

export const KINDS = ['combine', 'dot', 'length', 'angle'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Vector ngẫu nhiên toạ độ nguyên, khác 0. */
function randVec(rnd, dim = 2, lo = -5, hi = 5) {
  for (let guard = 0; guard < 50; guard++) {
    const v = Array.from({ length: dim }, () => int(lo, hi, rnd));
    if (v.some(x => x !== 0)) return v;
  }
  return Array.from({ length: dim }, (_, i) => (i === 0 ? 1 : 0));
}

/** Tổ hợp tuyến tính c₁v + c₂w — gộp cả cộng, trừ và nhân vô hướng vào một dạng. */
function makeCombine(rnd) {
  const dim = pick([2, 2, 3], rnd);
  const [v, w] = [randVec(rnd, dim), randVec(rnd, dim)];
  const [c, d] = [int(-3, 3, rnd) || 2, int(-3, 3, rnd) || 1];
  return {
    kind: 'combine',
    textKey: 'c1q.qCombine',
    textParams: { c: fmtParen(c), d: fmtParen(d), v: fmtVec(v), w: fmtVec(w) },
    answer: combine([c, d], [v, w]),
    tol: 1e-6,
    hintKey: 'c1q.hCombine',
    hintParams: { c: fmtParen(c), d: fmtParen(d) },
    meta: { v, w, c, d, dim },
  };
}

/** Tích vô hướng — đáp án là một số, hay bị nhầm thành vector. */
function makeDot(rnd) {
  const dim = pick([2, 2, 3], rnd);
  const [v, w] = [randVec(rnd, dim), randVec(rnd, dim)];
  return {
    kind: 'dot',
    textKey: 'c1q.qDot',
    textParams: { v: fmtVec(v), w: fmtVec(w) },
    answer: dot(v, w),
    tol: 1e-6,
    hintKey: 'c1q.hDot',
    hintParams: {},
    meta: { v, w, dim },
  };
}

/**
 * Độ dài: một nửa số câu ra bộ ba Pythagoras để đáp án tròn, nửa còn lại để
 * số lẻ và yêu cầu làm tròn 2 chữ số.
 */
function makeLength(rnd) {
  const nice = [[3, 4], [6, 8], [5, 12], [8, 15], [9, 12], [7, 24]];
  const round = rnd() < 0.5;
  const base = round ? pick(nice, rnd) : randVec(rnd, 2);
  const v = [base[0] * pick([1, -1], rnd), base[1] * pick([1, -1], rnd)];
  const exact = norm(v);
  return {
    kind: 'length',
    textKey: round ? 'c1q.qLength' : 'c1q.qLengthRound',
    textParams: { v: fmtVec(v) },
    answer: round ? exact : clean(Number(exact.toFixed(2))),
    tol: round ? 1e-6 : 0.011,
    hintKey: 'c1q.hLength',
    hintParams: {},
    meta: { v, exact, rounded: !round },
  };
}

/** Góc giữa hai vector, đơn vị độ, làm tròn 1 chữ số thập phân. */
function makeAngle(rnd) {
  // trộn vài cặp góc đẹp (0/45/90/180) với cặp ngẫu nhiên để không đoán mò được
  const nice = [[[1, 0], [0, 1]], [[1, 0], [1, 1]], [[1, 1], [-1, 1]], [[2, 0], [-3, 0]], [[1, 2], [2, -1]]];
  const useNice = rnd() < 0.45;
  const [v, w] = useNice ? pick(nice, rnd) : [randVec(rnd, 2), randVec(rnd, 2)];
  const exact = angleDeg(v, w);
  return {
    kind: 'angle',
    textKey: 'c1q.qAngle',
    textParams: { v: fmtVec(v), w: fmtVec(w) },
    answer: clean(Number(exact.toFixed(1))),
    tol: 0.11,
    hintKey: 'c1q.hAngle',
    hintParams: { dot: fmt(dot(v, w)) },
    meta: { v, w, exact },
  };
}

const MAKERS = { combine: makeCombine, dot: makeDot, length: makeLength, angle: makeAngle };

/** Sinh một câu hỏi; kind = 'mix' thì chọn ngẫu nhiên trong 4 dạng. */
export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) fail('err.badQuizKind', { kind });
  return make(rnd);
}

/** Lời giải mẫu dưới dạng số liệu, để ui/ dựng câu giải thích sau khi chấm. */
export function solutionDetail(q) {
  const { v, w, c, d } = q.meta;
  switch (q.kind) {
    case 'combine':
      return { parts: [fmtVec(scale(c, v)), fmtVec(scale(d, w))], result: fmtVec(q.answer) };
    case 'dot':
      return { parts: v.map((x, i) => fmtParen(x) + '·' + fmtParen(w[i])), result: fmt(q.answer) };
    case 'length':
      return { parts: v.map(x => fmtParen(x) + '²'), result: fmt(q.meta.exact) };
    case 'angle':
      return {
        parts: [fmt(dot(v, w)), fmt(norm(v)), fmt(norm(w))],
        result: fmt(q.meta.exact),
      };
    default:
      return { parts: [], result: String(q.answer) };
  }
}

/** Kiểm chứng lại đáp án từ meta — dùng trong test, không dùng ở ui/. */
export function recompute(q) {
  const { v, w, c, d } = q.meta;
  if (q.kind === 'combine') return add(scale(c, v), scale(d, w));
  if (q.kind === 'dot') return dot(v, w);
  if (q.kind === 'length') return norm(v);
  if (q.kind === 'angle') return angleDeg(v, w);
  return null;
}

/** Hình chiếu dùng cho phần giải thích trực quan ở tab Ví dụ. */
export const projectionOf = (v, w) => projection(v, w);

/** Phân loại span của hai vector trong R²: 'plane' | 'line' | 'point'. */
export function spanKind(v, w, eps = 1e-9) {
  const zero = u => u.every(x => Math.abs(x) <= eps);
  if (zero(v) && zero(w)) return 'point';
  if (zero(v) || zero(w)) return 'line';
  return Math.abs(v[0] * w[1] - v[1] * w[0]) > eps ? 'plane' : 'line';
}

/** Giữ lại để ui/ vẽ hiệu hai vector mà không phải import thêm module. */
export const difference = (v, w) => sub(v, w);
