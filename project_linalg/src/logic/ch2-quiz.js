import { fail } from './app-error.js';
import { matVec, determinant } from './matrix.js';
import { solve, solveSystem, varNames } from './linear-system.js';

/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 2 (thuần, không đụng DOM)
   Đề luôn kèm meta.A và meta.b để ui/ tự dựng lại hệ phương trình mà hiển
   thị, và để test kiểm chứng đáp án bằng chính bộ giải.
   --------------------------------------------------------------- */

export const KINDS = ['solve2', 'solve3', 'classify', 'rank'];
export const TYPES = ['unique', 'infinite', 'none'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));
const row = (n, rnd, lo = -4, hi = 4) => Array.from({ length: n }, () => int(lo, hi, rnd));

/** Ma trận vuông khả nghịch, hệ số nhỏ để khử bằng tay còn dễ chịu. */
function invertibleMatrix(n, rnd) {
  for (let guard = 0; guard < 200; guard++) {
    const A = Array.from({ length: n }, () => row(n, rnd));
    const d = determinant(A);
    if (d !== 0 && Math.abs(d) <= 40) return A;
  }
  return n === 2 ? [[1, 0], [0, 1]] : [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
}

/** Hệ có nghiệm duy nhất, nghiệm nguyên — dựng ngược từ nghiệm để b đẹp. */
function uniqueSystem(n, rnd) {
  const A = invertibleMatrix(n, rnd);
  const x = row(n, rnd, -3, 3);
  return { A, b: matVec(A, x), x };
}

/** Hệ suy biến: một hàng là bội của hàng khác. Consistent quyết định vô số hay vô nghiệm. */
function degenerateSystem(n, rnd, consistent) {
  for (let guard = 0; guard < 200; guard++) {
    const A = Array.from({ length: n }, () => row(n, rnd));
    if (A[0].every(v => v === 0)) continue;
    const k = pick([2, -2, 3, -1], rnd);
    A[1] = A[0].map(v => v * k);
    const x = row(n, rnd, -3, 3);
    const b = matVec(A, x);
    if (!consistent) b[1] += pick([1, -1, 2], rnd);          // phá vỡ tính tương thích
    const got = solveSystem(A, b).type;
    if (got === (consistent ? 'infinite' : 'none')) return { A, b };
  }
  return consistent
    ? { A: [[1, 1], [2, 2]].map(r => r.slice(0, n).concat(new Array(Math.max(0, n - 2)).fill(0))), b: new Array(n).fill(0) }
    : { A: [[1, 1], [2, 2]].map(r => r.slice(0, n).concat(new Array(Math.max(0, n - 2)).fill(0))), b: [0, 1, 0].slice(0, n) };
}

/** Hệ theo loại nghiệm mong muốn. */
export function systemOfType(type, n, rnd) {
  if (type === 'unique') return uniqueSystem(n, rnd);
  if (type === 'infinite') return degenerateSystem(n, rnd, true);
  if (type === 'none') return degenerateSystem(n, rnd, false);
  return fail('err.badQuizKind', { kind: type });
}

function makeSolve(n, rnd) {
  const { A, b, x } = uniqueSystem(n, rnd);
  return {
    kind: n === 2 ? 'solve2' : 'solve3',
    textKey: 'c2q.qSolve',
    textParams: { names: varNames(n).join(', ') },
    answer: x,
    tol: 1e-6,
    hintKey: 'c2q.hSolve',
    hintParams: {},
    meta: { A, b, n, type: 'unique' },
  };
}

function makeClassify(rnd) {
  const n = pick([2, 2, 3], rnd);
  const type = pick(TYPES, rnd);
  const { A, b } = systemOfType(type, n, rnd);
  return {
    kind: 'classify',
    textKey: 'c2q.qClassify',
    textParams: {},
    answer: solveSystem(A, b).type,          // lấy từ bộ giải, không tin vào ý định sinh đề
    tol: 0,
    choices: TYPES,
    hintKey: 'c2q.hClassify',
    hintParams: {},
    meta: { A, b, n, type },
  };
}

function makeRank(rnd) {
  const n = pick([2, 3], rnd);
  const type = pick(TYPES, rnd);
  const { A, b } = systemOfType(type, n, rnd);
  return {
    kind: 'rank',
    textKey: 'c2q.qRank',
    textParams: {},
    answer: solveSystem(A, b).rank,
    tol: 1e-6,
    hintKey: 'c2q.hRank',
    hintParams: {},
    meta: { A, b, n, type },
  };
}

const MAKERS = {
  solve2: rnd => makeSolve(2, rnd),
  solve3: rnd => makeSolve(3, rnd),
  classify: makeClassify,
  rank: makeRank,
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
  const r = solve(q.meta.A, q.meta.b);
  return {
    type: r.type, rank: r.rankA, rankAug: r.rankAug, nVars: q.meta.n,
    solution: r.solution, particular: r.particular, special: r.special,
  };
}
