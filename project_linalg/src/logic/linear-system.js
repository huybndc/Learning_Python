import { fail } from './app-error.js';
import { clean, fmt, fmtCoef } from './num-format.js';
import { shape, augment, splitAugmented } from './matrix.js';
import { forward, backward, nonZeroRows, EPS } from './elimination.js';

/* ---------------------------------------------------------------
   ĐỌC NGHIỆM TỪ MA TRẬN BẬC THANG.
   Ba trường hợp của Ax = b — đúng phần Strang Ch.2:
     rank(A) < rank([A|b])          -> vô nghiệm (xuất hiện hàng 0 = số khác 0)
     rank(A) = rank([A|b]) = số ẩn  -> nghiệm duy nhất
     rank(A) = rank([A|b]) < số ẩn  -> vô số nghiệm (có biến tự do)
   --------------------------------------------------------------- */

const isZero = x => Math.abs(x) <= EPS;

/** Tên ẩn theo thói quen: 2–3 ẩn dùng x, y, z; nhiều hơn thì x1, x2, … */
export function varNames(n) {
  if (!Number.isInteger(n) || n < 1) fail('err.badSize', { rows: 1, cols: n });
  if (n <= 3) return ['x', 'y', 'z'].slice(0, n);
  return Array.from({ length: n }, (_, i) => 'x' + (i + 1));
}

/** Một phương trình viết thành chuỗi: "2x + 3y = 5" (không phụ thuộc ngôn ngữ). */
export function equationString(coefs, rhs, names = varNames(coefs.length)) {
  let s = '';
  coefs.forEach((c, i) => {
    if (isZero(c)) return;
    const sign = c < 0 ? ' - ' : ' + ';
    const head = s === '' ? (c < 0 ? '-' : '') : sign;
    s += head + fmtCoef(Math.abs(c)) + names[i];
  });
  return (s === '' ? '0' : s) + ' = ' + fmt(rhs);
}

/** Cả hệ Ax = b viết thành danh sách chuỗi phương trình. */
export function systemStrings(A, b) {
  const names = varNames(shape(A).cols);
  return A.map((row, i) => equationString(row, b[i], names));
}

/** Hàng "0 = số khác 0" — dấu hiệu hệ vô nghiệm. */
export function findInconsistentRow(M, varCols) {
  for (let i = 0; i < M.length; i++) {
    if (M[i].slice(0, varCols).every(isZero) && !isZero(M[i][varCols])) return i;
  }
  return -1;
}

/**
 * Phân loại nghiệm từ ma trận đã khử.
 * Trả { type, rankA, rankAug, nVars, freeCount, badRow }.
 */
export function classifyFrom(ref, nVars) {
  const rankAug = nonZeroRows(ref);
  const rankA = nonZeroRows(ref.map(r => r.slice(0, nVars)));
  const badRow = findInconsistentRow(ref, nVars);
  const type = badRow >= 0 || rankA < rankAug ? 'none'
    : rankA === nVars ? 'unique' : 'infinite';
  return { type, rankA, rankAug, nVars, freeCount: nVars - rankA, badRow };
}

/**
 * Giải Ax = b: khử xuôi rồi khử ngược, đọc nghiệm từ RREF.
 * Trả về cả các bước để ui/ hiển thị từng bước một.
 */
export function solve(A, b) {
  const { cols: nVars } = shape(A);
  const M0 = augment(A, b);
  const fw = forward(M0);
  const cls = classifyFrom(fw.matrix, nVars);

  const out = {
    ...cls,
    start: M0,
    forwardSteps: fw.steps,
    ref: fw.matrix,
    pivots: fw.pivots,
    pivotCols: fw.pivots.map(p => p.col),
    freeCols: Array.from({ length: nVars }, (_, i) => i).filter(i => !fw.pivots.some(p => p.col === i)),
    backwardSteps: [],
    rref: fw.matrix,
    solution: null,
    particular: null,
    special: [],
  };
  if (cls.type === 'none') return out;

  const bw = backward(fw.matrix, fw.pivots);
  out.backwardSteps = bw.steps;
  out.rref = bw.matrix;

  // nghiệm riêng: cho mọi biến tự do bằng 0, biến trụ lấy thẳng từ cột cuối
  const particular = new Array(nVars).fill(0);
  fw.pivots.forEach(({ row, col }) => { particular[col] = clean(bw.matrix[row][nVars]); });
  out.particular = particular;
  if (cls.type === 'unique') {
    out.solution = particular;
    return out;
  }

  // mỗi biến tự do cho một nghiệm đặc biệt của Ax = 0
  out.special = out.freeCols.map(free => {
    const s = new Array(nVars).fill(0);
    s[free] = 1;
    fw.pivots.forEach(({ row, col }) => { s[col] = clean(-bw.matrix[row][free]); });
    return s;
  });
  return out;
}

/** Giải nhanh, chỉ lấy kết quả — dùng khi chấm bài. */
export function solveSystem(A, b) {
  const r = solve(A, b);
  return { type: r.type, solution: r.solution, particular: r.particular, special: r.special, rank: r.rankA };
}

/** Thay nghiệm ngược vào hệ để kiểm chứng: trả về sai lệch lớn nhất. */
export function residual(A, x, b) {
  return Math.max(...A.map((row, i) =>
    Math.abs(row.reduce((s, c, j) => s + c * x[j], 0) - b[i])));
}

/** Nghiệm tổng quát viết thành chuỗi: "(1, 0, 2) + t·(2, 1, 0)". */
export function generalSolutionString(r) {
  if (r.type === 'none') return '';
  const vec = v => '(' + v.map(x => fmt(x)).join(', ') + ')';
  if (r.type === 'unique') return vec(r.solution);
  const letters = ['t', 's', 'u', 'r'];
  return vec(r.particular) + r.special
    .map((sv, i) => ' + ' + (letters[i] || 'k' + i) + '·' + vec(sv)).join('');
}

/** Tách [A | b] — tiện cho ui/ khi chỉ giữ ma trận mở rộng trong state. */
export const split = splitAugmented;
