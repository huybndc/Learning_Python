/* ---------------------------------------------------------------
   HỆ ĐẾM & CHUYỂN ĐỔI CƠ SỐ (Chương 1, §1.2–1.4)
   Số được biểu diễn bằng chuỗi chữ số; cơ số r từ 2 đến 16.
   --------------------------------------------------------------- */

import { fail } from './app-error.js';

export const DIGITS = '0123456789ABCDEF';
export const MAX_FRAC_STEPS = 12;          // số bước tối đa khi đổi phần lẻ

/** Giá trị của một chữ số trong hệ cơ số r; ném lỗi nếu không hợp lệ. */
export function digitValue(ch, r) {
  const v = DIGITS.indexOf(ch.toUpperCase());
  if (v < 0 || v >= r) fail('err.badDigit', { digit: ch, radix: r });
  return v;
}

/** Tách chuỗi số thành { intPart, fracPart } (phần lẻ có thể là ''). */
export function splitNumber(text) {
  const s = text.trim().replace(/\s+/g, '');
  const dot = s.indexOf('.');
  if (dot < 0) return { intPart: s, fracPart: '' };
  if (s.indexOf('.', dot + 1) >= 0) fail('err.manyDots');
  return { intPart: s.slice(0, dot), fracPart: s.slice(dot + 1) };
}

/** Chuỗi ở cơ số r → số thập phân (Number). Chấp nhận phần lẻ. */
export function toDecimal(text, r) {
  if (r < 2 || r > 16) fail('err.radixRange');
  const { intPart, fracPart } = splitNumber(text);
  if (intPart === '' && fracPart === '') fail('err.emptyString');
  let v = 0;
  for (const ch of intPart) v = v * r + digitValue(ch, r);
  let f = 0, w = 1 / r;
  for (const ch of fracPart) { f += digitValue(ch, r) * w; w /= r; }
  return v + f;
}

/**
 * Các bước "chia lấy dư" khi đổi phần nguyên sang cơ số r (Example 1.1–1.2).
 * Trả về { digits, steps:[{ value, quotient, remainder, digit }] } — đọc dư
 * từ dưới lên sẽ ra kết quả.
 */
export function intToBaseSteps(n, r) {
  if (!Number.isInteger(n) || n < 0) fail('err.needNonNegInt');
  if (r < 2 || r > 16) fail('err.radixRange');
  const steps = [];
  if (n === 0) return { digits: '0', steps: [{ value: 0, quotient: 0, remainder: 0, digit: '0' }] };
  let v = n;
  while (v > 0) {
    const q = Math.floor(v / r), rem = v % r;
    steps.push({ value: v, quotient: q, remainder: rem, digit: DIGITS[rem] });
    v = q;
  }
  // chữ số đọc ngược từ dưới lên
  const digits = steps.map(s => s.digit).reverse().join('');
  return { digits, steps };
}

/**
 * Các bước "nhân lấy phần nguyên" khi đổi phần lẻ sang cơ số r (Example 1.3).
 * Dừng khi phần lẻ về 0 hoặc đủ maxSteps chữ số.
 * Trả về { digits, steps:[{ value, product, digit, rest }], exact }.
 */
export function fracToBaseSteps(f, r, maxSteps = MAX_FRAC_STEPS) {
  if (!(f >= 0 && f < 1)) fail('err.fracRange');
  if (r < 2 || r > 16) fail('err.radixRange');
  const steps = [];
  let v = f;
  while (v > 0 && steps.length < maxSteps) {
    const p = v * r;
    const d = Math.floor(p + 1e-12);        // bù sai số dấu phẩy động
    const rest = p - d;
    steps.push({ value: v, product: p, digit: DIGITS[d], rest });
    v = rest < 1e-12 ? 0 : rest;
  }
  return { digits: steps.map(s => s.digit).join(''), steps, exact: v === 0 };
}

/** Số thập phân → chuỗi ở cơ số r (gộp phần nguyên + phần lẻ). */
export function fromDecimal(x, r, maxFrac = MAX_FRAC_STEPS) {
  if (x < 0) fail('err.needNonNeg');
  const i = Math.floor(x);
  const { digits: intDigits } = intToBaseSteps(i, r);
  const { digits: fracDigits } = fracToBaseSteps(x - i, r, maxFrac);
  return fracDigits ? intDigits + '.' + fracDigits : intDigits;
}

/** Đổi trực tiếp giữa hai cơ số bất kỳ (đi qua thập phân). */
export function convertBase(text, from, to, maxFrac = MAX_FRAC_STEPS) {
  return fromDecimal(toDecimal(text, from), to, maxFrac);
}

/**
 * Nhị phân ↔ bát/thập lục phân bằng cách gộp nhóm bit (§1.4) — không đi qua
 * thập phân nên luôn chính xác. k = 3 cho octal, k = 4 cho hex.
 * Trả về { digits, groups:[{ bits, digit }] } cho cả hai phần.
 */
export function binaryToGrouped(text, k) {
  if (k !== 3 && k !== 4) fail('err.groupSize');
  const { intPart, fracPart } = splitNumber(text);
  for (const ch of intPart + fracPart) digitValue(ch, 2);

  const padLeft = s => s.padStart(Math.ceil((s.length || 1) / k) * k, '0');
  const padRight = s => s.padEnd(Math.ceil(s.length / k) * k, '0');
  const cut = s => s.match(new RegExp('.{' + k + '}', 'g')) || [];

  const intGroups = cut(padLeft(intPart || '0'));
  const fracGroups = fracPart ? cut(padRight(fracPart)) : [];
  const toDigit = bits => ({ bits, digit: DIGITS[parseInt(bits, 2)] });

  const groups = { int: intGroups.map(toDigit), frac: fracGroups.map(toDigit) };
  const intDigits = groups.int.map(g => g.digit).join('');
  const fracDigits = groups.frac.map(g => g.digit).join('');
  return { digits: fracDigits ? intDigits + '.' + fracDigits : intDigits, groups };
}

/** Bát/thập lục phân → nhị phân: mỗi chữ số bung thành k bit. */
export function groupedToBinary(text, k) {
  if (k !== 3 && k !== 4) fail('err.groupSize');
  const r = 1 << k;
  const { intPart, fracPart } = splitNumber(text);
  const expand = s => [...s].map(ch => ({
    digit: ch.toUpperCase(),
    bits: digitValue(ch, r).toString(2).padStart(k, '0'),
  }));
  const groups = { int: expand(intPart), frac: expand(fracPart) };
  const intBits = groups.int.map(g => g.bits).join('').replace(/^0+(?=\d)/, '') || '0';
  const fracBits = groups.frac.map(g => g.bits).join('').replace(/0+$/, '');
  return { digits: fracBits ? intBits + '.' + fracBits : intBits, groups };
}
