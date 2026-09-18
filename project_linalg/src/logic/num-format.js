/* ---------------------------------------------------------------
   ĐỊNH DẠNG SỐ — không phụ thuộc ngôn ngữ, dùng chung cho mọi chương.
   Đại số tuyến tính hay sinh ra hệ số kiểu 2/3; hiện "0.667" thì khó đọc,
   nên ưu tiên viết dạng phân số khi mẫu số còn nhỏ.
   --------------------------------------------------------------- */

export const EPS = 1e-9;

/** So sánh số thực có sai số cho phép. */
export const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/**
 * Làm sạch -0 và bụi dấu phẩy động kiểu 0.30000000000000004 hay
 * 0.6000000000000001: gần số nguyên thì lấy số nguyên, còn lại cắt về 12 chữ
 * số có nghĩa — vẫn thừa chính xác cho bài học, mà hiện ra thì sạch.
 */
export function clean(x, eps = 1e-9) {
  if (!Number.isFinite(x)) return x;
  const r = Math.round(x);
  if (Math.abs(x - r) <= eps) return r === 0 ? 0 : r;
  return Number(x.toPrecision(12));
}

/**
 * Tìm phân số đơn giản xấp xỉ x (mẫu số <= maxDen) bằng liên phân số.
 * Trả về null nếu không có phân số nào đủ sát.
 */
export function toFraction(x, maxDen = 64, eps = 1e-9) {
  if (!Number.isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  let v = Math.abs(x);
  let [p0, q0, p1, q1] = [0, 1, 1, 0];
  let r = v;
  for (let i = 0; i < 32; i++) {
    const a = Math.floor(r);
    const p2 = a * p1 + p0, q2 = a * q1 + q0;
    if (q2 > maxDen) break;
    [p0, q0, p1, q1] = [p1, q1, p2, q2];
    if (Math.abs(p1 / q1 - v) <= eps) return { num: sign * p1, den: q1 };
    const frac = r - a;
    if (frac <= eps) break;
    r = 1 / frac;
  }
  return Math.abs(p1 / q1 - v) <= eps ? { num: sign * p1, den: q1 } : null;
}

/**
 * Số → chuỗi gọn theo thứ tự ưu tiên:
 *   nguyên → để nguyên (3)
 *   thập phân ngắn → giữ thập phân (3.2, 1.25) vì đọc tự nhiên hơn 16/5
 *   còn lại → thử phân số mẫu nhỏ (2/3, -1/6), không được thì làm tròn (3.142)
 */
export function fmt(x, digits = 3) {
  const c = clean(x);
  if (Number.isInteger(c)) return String(c);
  if (Number(c.toFixed(2)) === c) return String(c);
  const f = toFraction(c);
  if (f && f.den !== 1 && f.den <= 64) return f.num + '/' + f.den;
  return String(Number(c.toFixed(digits)));
}

/** Hệ số đứng trước tên: 1 → "", -1 → "-", còn lại → "k·". */
export function fmtCoef(x) {
  const c = clean(x);
  if (near(c, 1)) return '';
  if (near(c, -1)) return '-';
  return fmt(c);
}

/** Số đứng trong một tích hay luỹ thừa: số âm phải có ngoặc, vì -5² đọc thành -(5²). */
export const fmtParen = x => {
  const s = fmt(x);
  return s.startsWith('-') ? '(' + s + ')' : s;
};

/** Vector → "(1, 2, 3)". */
export const fmtVec = v => '(' + v.map(x => fmt(x)).join(', ') + ')';

/** Dấu + hoặc - đứng giữa hai hạng tử, kèm trị tuyệt đối của hệ số. */
export function signPart(x) {
  const c = clean(x);
  return { sign: c < 0 ? '-' : '+', abs: Math.abs(c) };
}
