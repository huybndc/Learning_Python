/* ---------------------------------------------------------------
   CHẤM BÀI THEO GIÁ TRỊ SỐ, KHÔNG SO CHUỖI.
   Đại số tuyến tính hay ra đáp án lẻ (√5, góc 63.43°), nên chấm bằng
   sai số cho phép. Người học viết "3, -2" hay "(3; -2)" hay "3 -2" đều
   phải được chấp nhận — cách viết không phải cái đang kiểm tra.
   --------------------------------------------------------------- */

/** Đổi một mẩu chữ thành số: chấp nhận "3", "-1.5", "3/4", dấu trừ Unicode. */
export function parseNumber(piece) {
  const s = String(piece).trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
  if (!s) return null;
  const frac = s.match(/^([+-]?\d*\.?\d+)\/([+-]?\d*\.?\d+)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return Number(frac[1]) / den;
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

/**
 * Bóc danh sách số từ câu trả lời: bỏ ngoặc, tách theo dấu phẩy/chấm phẩy/
 * khoảng trắng. Trả null nếu có mẩu nào không phải số.
 */
export function parseNumbers(text) {
  const cleaned = String(text).trim()
    .replace(/[()[\]{}<>]/g, ' ')
    .replace(/[,;|]/g, ' ')
    .replace(/(\d)\s*-\s*(?=[\d.])/g, '$1 -')   // "3 - 2" là hai số, không phải phép trừ
    .trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  const nums = parts.map(parseNumber);
  return nums.some(n => n === null) ? null : nums;
}

/** So một số với sai số cho phép. */
export function checkNumber(given, expected, tol = 1e-6) {
  const nums = parseNumbers(given);
  if (!nums || nums.length !== 1) return false;
  return Math.abs(nums[0] - expected) <= tol;
}

/** So một vector theo từng toạ độ, sai số cho phép. */
export function checkVector(given, expected, tol = 1e-6) {
  const nums = parseNumbers(given);
  if (!nums || nums.length !== expected.length) return false;
  return nums.every((x, i) => Math.abs(x - expected[i]) <= tol);
}

/** So một lựa chọn (phân loại nghiệm…): bỏ hoa thường và khoảng trắng thừa. */
export function checkChoice(given, expected) {
  const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(given) === norm(expected);
}

/**
 * Chấm một câu bất kỳ dựa vào dạng đáp án của nó.
 * answer là mảng → chấm theo vector; là số → chấm theo số; còn lại → lựa chọn.
 */
export function checkAnswer(given, answer, tol = 1e-6) {
  if (Array.isArray(answer)) return checkVector(given, answer, tol);
  if (typeof answer === 'number') return checkNumber(given, answer, tol);
  return checkChoice(given, answer);
}
