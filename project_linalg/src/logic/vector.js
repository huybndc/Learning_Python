import { fail } from './app-error.js';
import { clean, near } from './num-format.js';

/* ---------------------------------------------------------------
   VECTOR THUẦN — vector là mảng số: [x, y] trong R², [x, y, z] trong R³.
   Mọi hàm ở đây nhận vào mảng và trả ra mảng/số mới, không sửa đầu vào.
   --------------------------------------------------------------- */

const isNum = x => typeof x === 'number' && Number.isFinite(x);

/** Kiểm tra một giá trị có đúng là vector hợp lệ không. */
export function checkVector(v) {
  if (!Array.isArray(v) || v.length === 0) fail('err.notVector', {});
  if (!v.every(isNum)) fail('err.vectorNumbers', {});
  return v;
}

/** Hai vector phải cùng số chiều mới cộng/trừ/nhân vô hướng được. */
export function sameDim(a, b) {
  checkVector(a); checkVector(b);
  if (a.length !== b.length) fail('err.dimMismatch', { a: a.length, b: b.length });
}

export const dim = v => checkVector(v).length;

export const add = (a, b) => { sameDim(a, b); return a.map((x, i) => clean(x + b[i])); };
export const sub = (a, b) => { sameDim(a, b); return a.map((x, i) => clean(x - b[i])); };
export const neg = a => checkVector(a).map(x => clean(-x));

/** Nhân vô hướng k·v. */
export function scale(k, v) {
  if (!isNum(k)) fail('err.needNumber', {});
  return checkVector(v).map(x => clean(k * x));
}

/** Tích vô hướng a·b = Σ aᵢbᵢ. */
export function dot(a, b) {
  sameDim(a, b);
  return clean(a.reduce((s, x, i) => s + x * b[i], 0));
}

/** Bình phương độ dài — dùng khi chỉ cần so sánh, khỏi lấy căn. */
export const norm2 = v => dot(v, v);

/** Độ dài ‖v‖ = √(v·v). */
export const norm = v => clean(Math.sqrt(norm2(v)));

/** Khoảng cách giữa hai điểm ‖a − b‖. */
export const distance = (a, b) => norm(sub(a, b));

export const isZero = (v, eps = 1e-9) => checkVector(v).every(x => Math.abs(x) <= eps);

export const equals = (a, b, eps = 1e-9) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((x, i) => near(x, b[i], eps));
};

/** Vector đơn vị cùng hướng: v/‖v‖. Vector 0 không có hướng nên báo lỗi. */
export function normalize(v) {
  const n = norm(v);
  if (near(n, 0)) fail('err.zeroVector', {});
  return scale(1 / n, v);
}

/** Góc giữa hai vector (radian), từ cos θ = (a·b)/(‖a‖‖b‖). */
export function angle(a, b) {
  const na = norm(a), nb = norm(b);
  if (near(na, 0) || near(nb, 0)) fail('err.zeroVector', {});
  // kẹp về [-1, 1] vì sai số làm tròn có thể đẩy cos ra ngoài miền của acos
  const c = Math.min(1, Math.max(-1, dot(a, b) / (na * nb)));
  return Math.acos(c);
}

/** Góc giữa hai vector, tính bằng độ. */
export const angleDeg = (a, b) => clean(angle(a, b) * 180 / Math.PI);

/** Tích có hướng trong R³. */
export function cross(a, b) {
  sameDim(a, b);
  if (a.length !== 3) fail('err.needDim3', { dim: a.length });
  return [
    clean(a[1] * b[2] - a[2] * b[1]),
    clean(a[2] * b[0] - a[0] * b[2]),
    clean(a[0] * b[1] - a[1] * b[0]),
  ];
}

/** "Tích có hướng" 2D trả về số: a×b = a₁b₂ − a₂b₁ (chính là định thức 2×2). */
export function cross2(a, b) {
  sameDim(a, b);
  if (a.length !== 2) fail('err.needDim2', { dim: a.length });
  return clean(a[0] * b[1] - a[1] * b[0]);
}

/** Tổ hợp tuyến tính c₁v₁ + c₂v₂ + … */
export function combine(coefs, vectors) {
  if (!Array.isArray(coefs) || !Array.isArray(vectors) || coefs.length !== vectors.length) {
    fail('err.combineLength', { c: (coefs || []).length, v: (vectors || []).length });
  }
  if (vectors.length === 0) fail('err.notVector', {});
  vectors.forEach(v => sameDim(vectors[0], v));
  return vectors[0].map((_, i) => clean(coefs.reduce((s, c, k) => s + c * vectors[k][i], 0)));
}

/** Độ dài hình chiếu của a lên b (có dấu): (a·b)/‖b‖. */
export function scalarProjection(a, b) {
  const nb = norm(b);
  if (near(nb, 0)) fail('err.zeroVector', {});
  return clean(dot(a, b) / nb);
}

/** Hình chiếu vuông góc của a lên b: ((a·b)/(b·b))·b. */
export function projection(a, b) {
  const d = norm2(b);
  if (near(d, 0)) fail('err.zeroVector', {});
  return scale(dot(a, b) / d, b);
}

/** Phần vuông góc còn lại: a − proj_b(a). Luôn trực giao với b. */
export const perpendicular = (a, b) => sub(a, projection(a, b));

export const isOrthogonal = (a, b, eps = 1e-9) => Math.abs(dot(a, b)) <= eps;

/** Hai vector cùng phương (một cái là bội của cái kia). Vector 0 cùng phương với mọi vector. */
export function isParallel(a, b, eps = 1e-9) {
  sameDim(a, b);
  if (isZero(a, eps) || isZero(b, eps)) return true;
  // cùng phương ⇔ mọi định thức 2×2 của cặp toạ độ đều bằng 0
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (Math.abs(a[i] * b[j] - a[j] * b[i]) > eps) return false;
    }
  }
  return true;
}
