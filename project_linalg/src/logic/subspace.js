import { fail } from './app-error.js';
import { shape, columns, transpose } from './matrix.js';
import { forward, nonZeroRows } from './elimination.js';
import { solve } from './linear-system.js';
import { checkVector } from './vector.js';

/* ---------------------------------------------------------------
   KHÔNG GIAN CON — độc lập tuyến tính, cơ sở, số chiều, column space,
   null space. Tất cả quy về một việc quen thuộc từ Chương 2: khử Gauss rồi
   đếm trụ. Chương 3 chỉ đổi cách đọc kết quả, không đổi thuật toán.
   --------------------------------------------------------------- */

/** Dựng ma trận nhận các vector làm CỘT. */
export function matrixFromColumns(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) fail('err.noVectors', {});
  vectors.forEach(checkVector);
  const d = vectors[0].length;
  if (vectors.some(v => v.length !== d)) fail('err.dimMismatch', { a: d, b: vectors.find(v => v.length !== d).length });
  return transpose(vectors);
}

/** Hạng của một ma trận bất kỳ: số trụ sau khi khử. */
export function rankOf(A) {
  const { cols } = shape(A);
  // forward() coi cột cuối là vế phải, nên thêm một cột 0 để mọi cột của A
  // đều được xét làm trụ
  const { pivots } = forward(A.map(row => [...row, 0]));
  return Math.min(pivots.length, cols);
}

/** Hạng của một bộ vector (xếp thành các cột). */
export const rankOfVectors = vectors => rankOf(matrixFromColumns(vectors));

/** Bộ vector độc lập tuyến tính ⇔ hạng bằng số vector. */
export const isIndependent = vectors => rankOfVectors(vectors) === vectors.length;

/**
 * Span của một bộ vector trong R³ trông như thế nào.
 * Số chiều 0/1/2/3 tương ứng điểm / đường thẳng / mặt phẳng / cả không gian.
 */
export function spanKind(vectors) {
  const dim = rankOfVectors(vectors);
  return ['point', 'line', 'plane', 'space'][Math.min(dim, 3)];
}

/**
 * b có nằm trong span của các vector không?
 * Đây đúng là câu hỏi "hệ c₁v₁ + … + cₖvₖ = b có nghiệm không" của Chương 2.
 */
export function inSpan(vectors, b) {
  const A = matrixFromColumns(vectors);
  checkVector(b);
  if (b.length !== A.length) fail('err.dimMismatch', { a: A.length, b: b.length });
  const r = solve(A, b);
  return {
    inSpan: r.type !== 'none',
    unique: r.type === 'unique',
    coefs: r.type === 'unique' ? r.solution : r.particular,
    type: r.type,
  };
}

/** Cơ sở của column space: chính các CỘT TRỤ của A (giữ nguyên, không rút gọn). */
export function columnSpaceBasis(A) {
  const { pivots } = forward(A.map(row => [...row, 0]));
  const cols = columns(A);
  return pivots.filter(p => p.col < cols.length).map(p => cols[p.col]);
}

/** Cơ sở của null space: các nghiệm đặc biệt của Ax = 0. */
export function nullSpaceBasis(A) {
  const { rows } = shape(A);
  const r = solve(A, new Array(rows).fill(0));
  return r.special;
}

/** Cơ sở của row space: các hàng khác 0 sau khi khử. */
export function rowSpaceBasis(A) {
  const { cols } = shape(A);
  const { matrix } = forward(A.map(row => [...row, 0]));
  return matrix.map(row => row.slice(0, cols)).filter(row => row.some(x => Math.abs(x) > 1e-9));
}

/**
 * Các số chiều của một ma trận, gói lại một chỗ.
 * Định lý hạng: rank + dim(null space) = số cột.
 */
export function dimensions(A) {
  const { rows, cols } = shape(A);
  const rank = rankOf(A);
  return {
    rows, cols, rank,
    colDim: rank,                  // dim của column space
    rowDim: rank,                  // dim của row space — luôn bằng nhau
    nullDim: cols - rank,
    leftNullDim: rows - rank,
  };
}

/** Bộ vector có phủ hết R^n không (span = toàn không gian)? */
export const spansSpace = (vectors, n) => rankOfVectors(vectors) === n;

/** Bộ vector có phải cơ sở của R^n không: vừa độc lập, vừa phủ hết. */
export function isBasis(vectors, n) {
  if (vectors.length !== n) return false;
  return rankOfVectors(vectors) === n;
}

/**
 * Chọn ra một cơ sở từ bộ vector đã cho (bỏ các vector phụ thuộc).
 * Trả về { basis, keptIndex, dropped } để ui/ chỉ rõ vector nào bị loại.
 */
export function extractBasis(vectors) {
  const A = matrixFromColumns(vectors);
  const { pivots } = forward(A.map(row => [...row, 0]));
  const kept = pivots.map(p => p.col).filter(c => c < vectors.length);
  return {
    basis: kept.map(i => vectors[i]),
    keptIndex: kept,
    dropped: vectors.map((_, i) => i).filter(i => !kept.includes(i)),
  };
}

/** Số hàng khác 0 sau khi khử — để ui/ hiện lại cho khớp phần Chương 2. */
export const nonZeroRowCount = nonZeroRows;
