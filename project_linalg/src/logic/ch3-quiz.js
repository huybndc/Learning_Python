import { fail } from './app-error.js';
import { fmtVec } from './num-format.js';
import {
  isIndependent, spanKind, inSpan, dimensions, matrixFromColumns, rankOfVectors,
} from './subspace.js';

/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 3 (thuần, không đụng DOM)
   Ba dạng đầu trả lời bằng ô chọn, dạng cuối trả lời bằng số. Đáp án luôn
   tính lại bằng chính module subspace.js chứ không tin vào ý định sinh đề.
   --------------------------------------------------------------- */

export const KINDS = ['independent', 'spankind', 'inspan', 'nulldim'];
export const YESNO = ['yes', 'no'];
export const SPAN_KINDS = ['point', 'line', 'plane', 'space'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Vector nguyên khác 0 trong R³. */
function randVec(rnd, lo = -3, hi = 3) {
  for (let guard = 0; guard < 60; guard++) {
    const v = [int(lo, hi, rnd), int(lo, hi, rnd), int(lo, hi, rnd)];
    if (v.some(x => x !== 0)) return v;
  }
  return [1, 0, 0];
}

/** Tổ hợp tuyến tính của các vector đã có — để cố tình tạo bộ phụ thuộc. */
const combo = (vectors, coefs) =>
  vectors[0].map((_, i) => vectors.reduce((s, v, k) => s + coefs[k] * v[i], 0));

/**
 * Bộ vector theo ý muốn độc lập hay phụ thuộc.
 * Bộ phụ thuộc dựng bằng cách cho vector cuối là tổ hợp của các vector trước.
 */
function vectorSet(count, wantIndependent, rnd) {
  for (let guard = 0; guard < 80; guard++) {
    const vs = Array.from({ length: count }, () => randVec(rnd));
    if (!wantIndependent && count >= 2) {
      const coefs = Array.from({ length: count - 1 }, () => int(-2, 2, rnd));
      if (coefs.every(c => c === 0)) coefs[0] = 1;
      vs[count - 1] = combo(vs.slice(0, count - 1), coefs);
      if (vs[count - 1].every(x => x === 0)) continue;
      // lặp lại y hệt một vector đã có thì đề trông như gõ nhầm — sinh lại
      if (vs.slice(0, count - 1).some(u => u.every((x, i) => x === vs[count - 1][i]))) continue;
    }
    if (isIndependent(vs) === wantIndependent) return vs;
  }
  return wantIndependent
    ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]].slice(0, count)
    : [[1, 0, 0], [2, 0, 0], [3, 0, 0]].slice(0, count);
}

function makeIndependent(rnd) {
  const count = pick([2, 2, 3, 3, 4], rnd);
  // 4 vector trong R³ thì luôn phụ thuộc — vẫn để lọt vào đề, đó là một ý hay gặp
  const want = count > 3 ? false : rnd() < 0.5;
  const vs = vectorSet(count, want, rnd);
  const answer = isIndependent(vs) ? 'yes' : 'no';
  return {
    kind: 'independent',
    textKey: 'c3q.qIndependent',
    textParams: { vs: vs.map(fmtVec).join(', ') },
    answer,
    tol: 0,
    choices: YESNO,
    hintKey: 'c3q.hIndependent',
    hintParams: { count: vs.length },
    meta: { vectors: vs, count: vs.length },
  };
}

function makeSpanKind(rnd) {
  const count = pick([1, 2, 2, 3, 3], rnd);
  const vs = vectorSet(count, rnd() < 0.55, rnd);
  return {
    kind: 'spankind',
    textKey: 'c3q.qSpanKind',
    textParams: { vs: vs.map(fmtVec).join(', ') },
    answer: spanKind(vs),
    tol: 0,
    choices: SPAN_KINDS,
    hintKey: 'c3q.hSpanKind',
    hintParams: {},
    meta: { vectors: vs, count: vs.length },
  };
}

function makeInSpan(rnd) {
  // chỉ lấy 1–2 vector: ba vector độc lập trong R³ phủ hết không gian, lúc đó
  // đáp án luôn là "có" và câu hỏi mất hết ý nghĩa
  const count = pick([1, 2, 2], rnd);
  const vs = vectorSet(count, true, rnd);
  // một nửa số câu cho b nằm hẳn trong span để hai đáp án cân nhau
  const inside = rnd() < 0.5;
  const b = inside
    ? combo(vs, vs.map(() => int(-2, 2, rnd)))
    : randVec(rnd, -4, 4);
  const real = inSpan(vs, b);
  return {
    kind: 'inspan',
    textKey: 'c3q.qInSpan',
    textParams: { vs: vs.map(fmtVec).join(', '), b: fmtVec(b) },
    answer: real.inSpan ? 'yes' : 'no',
    tol: 0,
    choices: YESNO,
    hintKey: 'c3q.hInSpan',
    hintParams: {},
    meta: { vectors: vs, b, count: vs.length },
  };
}

function makeNullDim(rnd) {
  const count = pick([2, 3, 3, 4], rnd);
  const vs = vectorSet(count, rnd() < 0.5, rnd);
  const A = matrixFromColumns(vs);
  return {
    kind: 'nulldim',
    textKey: 'c3q.qNullDim',
    textParams: { vs: vs.map(fmtVec).join(', ') },
    answer: dimensions(A).nullDim,
    tol: 1e-6,
    hintKey: 'c3q.hNullDim',
    hintParams: { cols: vs.length },
    meta: { vectors: vs, count: vs.length },
  };
}

const MAKERS = {
  independent: makeIndependent,
  spankind: makeSpanKind,
  inspan: makeInSpan,
  nulldim: makeNullDim,
};

/** Sinh một câu hỏi; kind = 'mix' thì chọn ngẫu nhiên trong 4 dạng. */
export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) fail('err.badQuizKind', { kind });
  return make(rnd);
}

/** Số liệu cho phần giải thích sau khi chấm (ui/ dịch thành câu). */
export function solutionDetail(q) {
  const vs = q.meta.vectors;
  const A = matrixFromColumns(vs);
  const d = dimensions(A);
  return {
    rank: rankOfVectors(vs),
    count: vs.length,
    nullDim: d.nullDim,
    spanKind: spanKind(vs),
    coefs: q.kind === 'inspan' ? inSpan(vs, q.meta.b).coefs : null,
  };
}
