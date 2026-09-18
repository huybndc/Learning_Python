import { fail } from './app-error.js';
import { clean, fmt, fmtCoef } from './num-format.js';
import { checkMatrix, clone, shape } from './matrix.js';

/* ---------------------------------------------------------------
   PHÉP KHỬ GAUSS TỪNG BƯỚC (thuần, không đụng DOM).
   Làm việc trên ma trận mở rộng [A | b]. Mỗi bước trả về:
     - op: phép biến đổi hàng ở dạng dữ liệu
     - formula: công thức đọc được, không phụ thuộc ngôn ngữ ("R2 <- R2 - 2R1")
     - reasonKey/reasonParams: lý do, ui/ dịch sang VI/EN
     - matrix: ma trận SAU khi áp dụng (giữ lại để tua đi tua lại từng bước)
   --------------------------------------------------------------- */

export const EPS = 1e-9;

const isZero = x => Math.abs(x) <= EPS;

/** Ba phép biến đổi hàng sơ cấp — đúng ba phép không làm đổi tập nghiệm. */
export function applyRowOp(M, op) {
  checkMatrix(M);
  const n = M.length;
  const inRange = i => Number.isInteger(i) && i >= 0 && i < n;
  const out = clone(M);

  if (op.type === 'swap') {
    if (!inRange(op.i) || !inRange(op.j)) fail('err.rowRange', { row: (inRange(op.i) ? op.j : op.i) + 1 });
    [out[op.i], out[op.j]] = [out[op.j], out[op.i]];
    return out;
  }
  if (op.type === 'scale') {
    if (!inRange(op.i)) fail('err.rowRange', { row: op.i + 1 });
    if (typeof op.k !== 'number' || isZero(op.k)) fail('err.scaleZero', {});
    out[op.i] = out[op.i].map(x => clean(x * op.k));
    return out;
  }
  if (op.type === 'add') {
    if (!inRange(op.i) || !inRange(op.j)) fail('err.rowRange', { row: (inRange(op.i) ? op.j : op.i) + 1 });
    if (op.i === op.j) fail('err.sameRow', {});
    if (typeof op.k !== 'number' || !Number.isFinite(op.k)) fail('err.needNumber', {});
    out[op.i] = out[op.i].map((x, c) => clean(x + op.k * out[op.j][c]));
    return out;
  }
  return fail('err.badRowOp', { type: String(op && op.type) });
}

/** Công thức của một phép biến đổi hàng, viết theo lối quen thuộc trong sách. */
export function formatRowOp(op) {
  const R = i => 'R' + (i + 1);
  if (op.type === 'swap') return `${R(op.i)} <-> ${R(op.j)}`;
  if (op.type === 'scale') {
    // chia cho số nguyên đọc tự nhiên hơn nhân với nghịch đảo: R3/(-77) thay vì -0.013R3
    const inv = 1 / op.k;
    if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.abs(Math.round(inv)) !== 1) {
      const d = Math.round(inv);
      return `${R(op.i)} <- ${R(op.i)}/${d < 0 ? `(${d})` : d}`;
    }
    return `${R(op.i)} <- ${coefText(op.k)}${R(op.i)}`;
  }
  if (op.type === 'add') {
    const sign = op.k < 0 ? ' - ' : ' + ';
    return `${R(op.i)} <- ${R(op.i)}${sign}${coefText(Math.abs(op.k))}${R(op.j)}`;
  }
  return fail('err.badRowOp', { type: String(op && op.type) });
}

/** Hệ số đứng trước tên hàng: 1 thì bỏ, phân số thì bọc ngoặc cho dễ đọc. */
function coefText(k) {
  const c = fmtCoef(k);
  if (c === '' || c === '-') return c;
  return c.includes('/') ? `(${c})` : c;
}

/**
 * Chọn hàng làm trụ (pivot) trong cột `col`, tính từ hàng `from` trở xuống.
 * Ưu tiên hệ số ±1 để các bước sau ra số nguyên, dễ nhìn — đúng cách người ta
 * làm bằng tay, khác với chọn trị tuyệt đối lớn nhất của tính toán số.
 */
export function choosePivotRow(M, col, from) {
  let best = -1;
  for (let r = from; r < M.length; r++) {
    if (isZero(M[r][col])) continue;
    if (Math.abs(Math.abs(M[r][col]) - 1) <= EPS) return r;
    if (best < 0) best = r;
  }
  return best;
}

const step = (op, matrix, reasonKey, reasonParams, extra = {}) => ({
  op, matrix, formula: formatRowOp(op), reasonKey, reasonParams, ...extra,
});

/**
 * Khử xuôi: đưa [A | b] về dạng bậc thang (row echelon form).
 * Trả { steps, matrix, pivots } với pivots = [{ row, col }] theo thứ tự.
 */
export function forward(M0) {
  checkMatrix(M0);
  const { rows, cols } = shape(M0);
  const varCols = cols - 1;                        // cột cuối là vế phải b
  let M = clone(M0);
  const steps = [];
  const pivots = [];
  let row = 0;

  for (let col = 0; col < varCols && row < rows; col++) {
    const r = choosePivotRow(M, col, row);
    if (r < 0) {
      // cả cột từ đây xuống đều bằng 0 → biến này không có trụ, thành biến tự do
      steps.push({
        op: null, matrix: clone(M), formula: '',
        reasonKey: 'c2.whyFreeCol', reasonParams: { col: col + 1 }, freeCol: col,
      });
      continue;
    }
    if (r !== row) {
      const op = { type: 'swap', i: row, j: r };
      M = applyRowOp(M, op);
      steps.push(step(op, clone(M), 'c2.whySwap', { row: r + 1, col: col + 1 }, { pivot: { row, col } }));
    }
    for (let r2 = row + 1; r2 < rows; r2++) {
      if (isZero(M[r2][col])) continue;
      const k = clean(-M[r2][col] / M[row][col]);
      const op = { type: 'add', i: r2, j: row, k };
      M = applyRowOp(M, op);
      M[r2][col] = 0;                              // chốt số 0 đúng vị trí vừa khử
      steps.push(step(op, clone(M), 'c2.whyEliminate', { target: r2 + 1, col: col + 1 },
        { pivot: { row, col } }));
    }
    pivots.push({ row, col });
    row++;
  }
  return { steps, matrix: M, pivots };
}

/**
 * Khử ngược: từ dạng bậc thang đưa tiếp về bậc thang rút gọn (RREF) —
 * chia hàng cho trụ để trụ bằng 1, rồi khử các số phía trên trụ.
 */
export function backward(M0, pivots) {
  checkMatrix(M0);
  let M = clone(M0);
  const steps = [];

  for (let p = pivots.length - 1; p >= 0; p--) {
    const { row, col } = pivots[p];
    const val = M[row][col];
    if (isZero(val)) continue;
    if (Math.abs(val - 1) > EPS) {
      const op = { type: 'scale', i: row, k: clean(1 / val) };
      M = applyRowOp(M, op);
      M[row][col] = 1;
      steps.push(step(op, clone(M), 'c2.whyNormalize', { row: row + 1, col: col + 1 },
        { pivot: { row, col } }));
    }
    for (let r = row - 1; r >= 0; r--) {
      if (isZero(M[r][col])) continue;
      const op = { type: 'add', i: r, j: row, k: clean(-M[r][col]) };
      M = applyRowOp(M, op);
      M[r][col] = 0;
      steps.push(step(op, clone(M), 'c2.whyClearAbove', { target: r + 1, col: col + 1 },
        { pivot: { row, col } }));
    }
  }
  return { steps, matrix: M };
}

/** Ma trận đã ở dạng bậc thang chưa (mỗi trụ nằm bên phải trụ của hàng trên)? */
export function isEchelon(M, varCols) {
  checkMatrix(M);
  const limit = varCols ?? M[0].length - 1;
  let last = -1;
  for (const row of M) {
    const lead = row.slice(0, limit).findIndex(x => !isZero(x));
    if (lead === -1) { last = limit; continue; }    // hàng 0 phải nằm dưới cùng
    if (lead <= last) return false;
    last = lead;
  }
  return true;
}

/** Số hàng khác 0 — dùng để tính hạng. */
export const nonZeroRows = (M, limit) =>
  M.filter(row => row.slice(0, limit ?? row.length).some(x => !isZero(x))).length;

export { isZero, fmt };
