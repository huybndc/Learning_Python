import { fail } from './app-error.js';
import { clean, near } from './num-format.js';
import { checkVector } from './vector.js';

/* ---------------------------------------------------------------
   MA TRẬN THUẦN — ma trận là mảng các hàng: [[a, b], [c, d]].
   Mọi hàm trả về ma trận mới, không sửa đầu vào (để bước trung gian của
   phép khử Gauss còn giữ được mà hiển thị từng bước).
   --------------------------------------------------------------- */

const isNum = x => typeof x === 'number' && Number.isFinite(x);

/** Kiểm tra ma trận: mảng hàng, các hàng cùng độ dài, phần tử là số. */
export function checkMatrix(M) {
  if (!Array.isArray(M) || M.length === 0 || !Array.isArray(M[0]) || M[0].length === 0) {
    fail('err.notMatrix', {});
  }
  const cols = M[0].length;
  for (const row of M) {
    if (!Array.isArray(row) || row.length !== cols) fail('err.raggedMatrix', {});
    if (!row.every(isNum)) fail('err.matrixNumbers', {});
  }
  return M;
}

export const shape = M => ({ rows: checkMatrix(M).length, cols: M[0].length });

export const clone = M => checkMatrix(M).map(r => r.slice());

export const isSquare = M => { const s = shape(M); return s.rows === s.cols; };

/** Ma trận 0 cỡ rows×cols. */
export function zeros(rows, cols) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    fail('err.badSize', { rows, cols });
  }
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

/** Ma trận đơn vị I cỡ n×n. */
export function identity(n) {
  const M = zeros(n, n);
  for (let i = 0; i < n; i++) M[i][i] = 1;
  return M;
}

function sameShape(A, B) {
  const a = shape(A), b = shape(B);
  if (a.rows !== b.rows || a.cols !== b.cols) {
    fail('err.shapeMismatch', { ar: a.rows, ac: a.cols, br: b.rows, bc: b.cols });
  }
}

export const add = (A, B) => { sameShape(A, B); return A.map((r, i) => r.map((x, j) => clean(x + B[i][j]))); };
export const sub = (A, B) => { sameShape(A, B); return A.map((r, i) => r.map((x, j) => clean(x - B[i][j]))); };

export function scale(k, M) {
  if (!isNum(k)) fail('err.needNumber', {});
  return checkMatrix(M).map(r => r.map(x => clean(k * x)));
}

/** Chuyển vị Aᵀ: hàng thành cột. */
export function transpose(M) {
  const { rows, cols } = shape(M);
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => M[i][j]));
}

/** Nhân ma trận A·B — số cột của A phải bằng số hàng của B. */
export function multiply(A, B) {
  const a = shape(A), b = shape(B);
  if (a.cols !== b.rows) fail('err.mulMismatch', { ac: a.cols, br: b.rows });
  const out = zeros(a.rows, b.cols);
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < b.cols; j++) {
      let s = 0;
      for (let k = 0; k < a.cols; k++) s += A[i][k] * B[k][j];
      out[i][j] = clean(s);
    }
  }
  return out;
}

/** A·x với x là vector — cách nhìn "hàng nhân cột". */
export function matVec(A, x) {
  const { rows, cols } = shape(A);
  checkVector(x);
  if (x.length !== cols) fail('err.matVecMismatch', { cols, dim: x.length });
  return Array.from({ length: rows }, (_, i) => clean(A[i].reduce((s, v, j) => s + v * x[j], 0)));
}

/** Các cột của A, mỗi cột là một vector — cách nhìn "tổ hợp tuyến tính của cột". */
export const columns = M => transpose(M);

export const rows = M => clone(M);

export const equals = (A, B, eps = 1e-9) => {
  if (!Array.isArray(A) || !Array.isArray(B) || A.length !== B.length) return false;
  return A.every((r, i) => Array.isArray(B[i]) && r.length === B[i].length
    && r.every((x, j) => near(x, B[i][j], eps)));
};

/** Ghép vector b vào bên phải A thành ma trận mở rộng [A | b]. */
export function augment(A, b) {
  const { rows: r } = shape(A);
  checkVector(b);
  if (b.length !== r) fail('err.augmentMismatch', { rows: r, dim: b.length });
  return A.map((row, i) => [...row, b[i]]);
}

/** Tách [A | b] thành { A, b } — nghịch đảo của augment. */
export function splitAugmented(M) {
  const { cols } = shape(M);
  if (cols < 2) fail('err.badSize', { rows: M.length, cols });
  return { A: M.map(r => r.slice(0, cols - 1)), b: M.map(r => r[cols - 1]) };
}

/** Ma trận con bỏ đi hàng i và cột j. */
export function minorMatrix(M, i, j) {
  const { rows: r, cols: c } = shape(M);
  if (r < 2 || c < 2) fail('err.badSize', { rows: r, cols: c });
  return M.filter((_, ri) => ri !== i).map(row => row.filter((_, ci) => ci !== j));
}

/** Định thức bằng khai triển cofactor theo hàng đầu (đủ nhanh với n nhỏ). */
export function determinant(M) {
  if (!isSquare(M)) fail('err.needSquare', { rows: shape(M).rows, cols: shape(M).cols });
  const n = M.length;
  if (n === 1) return clean(M[0][0]);
  if (n === 2) return clean(M[0][0] * M[1][1] - M[0][1] * M[1][0]);
  let s = 0;
  for (let j = 0; j < n; j++) {
    if (M[0][j] === 0) continue;
    s += ((j % 2 === 0) ? 1 : -1) * M[0][j] * determinant(minorMatrix(M, 0, j));
  }
  return clean(s);
}

/** Phần bù đại số Cᵢⱼ = (−1)^(i+j)·det(Mᵢⱼ). */
export function cofactor(M, i, j) {
  if (!isSquare(M)) fail('err.needSquare', { rows: shape(M).rows, cols: shape(M).cols });
  return clean(((i + j) % 2 === 0 ? 1 : -1) * determinant(minorMatrix(M, i, j)));
}

/** Vết: tổng đường chéo chính. */
export function trace(M) {
  if (!isSquare(M)) fail('err.needSquare', { rows: shape(M).rows, cols: shape(M).cols });
  return clean(M.reduce((s, r, i) => s + r[i], 0));
}
