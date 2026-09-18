/* ---------------------------------------------------------------
   COMPLEMENT CỦA SỐ — Chương 1, §1.5
   Hai loại: diminished radix complement (r−1)'s và radix complement r's.
   Dùng để thay phép trừ bằng phép cộng.
   --------------------------------------------------------------- */

import { DIGITS, digitValue, toDecimal, fromDecimal } from './number-systems.js';

/**
 * (r−1)'s complement: lấy (r−1) trừ từng chữ số.
 * Ví dụ 1's complement của 1011 là 0100; 9's complement của 546700 là 453299.
 * Trả về { digits, perDigit:[{ digit, sub, result }] } — giữ nguyên số chữ số.
 */
export function diminishedComplement(text, r) {
  if (r < 2 || r > 16) throw new Error('cơ số phải trong khoảng 2..16');
  const s = text.trim().toUpperCase();
  if (!s.length) throw new Error('chuỗi rỗng');
  const perDigit = [...s].map(ch => {
    const v = digitValue(ch, r);
    return { digit: ch, sub: r - 1, result: DIGITS[r - 1 - v] };
  });
  return { digits: perDigit.map(d => d.result).join(''), perDigit };
}

/**
 * r's complement = (r−1)'s complement + 1 (ở cùng số chữ số).
 * Riêng số toàn 0 thì r's complement vẫn là 0 (giữ nguyên số chữ số).
 * Trả về { digits, diminished, carryOut }.
 */
export function radixComplement(text, r) {
  const dim = diminishedComplement(text, r);
  const n = dim.digits.length;
  // cộng 1 vào chuỗi dim.digits ở cơ số r
  let carry = 1;
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const v = digitValue(dim.digits[i], r) + carry;
    out.unshift(DIGITS[v % r]);
    carry = v >= r ? 1 : 0;
  }
  return { digits: out.join(''), diminished: dim.digits, carryOut: carry };
}

/**
 * Trừ M − N bằng r's complement (§1.5.3), giữ nguyên số chữ số.
 * Quy tắc: cộng M với r's complement của N.
 *   - Có nhớ ra ngoài (end carry) ⇒ kết quả dương, bỏ nhớ đi.
 *   - Không có nhớ ⇒ kết quả âm, lấy r's complement của tổng rồi thêm dấu trừ.
 * Trả về { digits, negative, endCarry, compN, sum, steps }.
 */
export function subtractByComplement(mText, nText, r) {
  const width = Math.max(mText.trim().length, nText.trim().length);
  const M = mText.trim().toUpperCase().padStart(width, '0');
  const N = nText.trim().toUpperCase().padStart(width, '0');
  for (const ch of M + N) digitValue(ch, r);

  const comp = radixComplement(N, r);
  const compN = comp.digits;

  // cộng M + compN ở cơ số r
  let carry = 0;
  const sumDigits = [];
  for (let i = width - 1; i >= 0; i--) {
    const v = digitValue(M[i], r) + digitValue(compN[i], r) + carry;
    sumDigits.unshift(DIGITS[v % r]);
    carry = v >= r ? 1 : 0;
  }
  const sum = sumDigits.join('');
  // N = 0 là ca riêng: r's complement của 0 là r^n, tức là 0 kèm một bit nhớ
  // tràn ra ngoài. Bit nhớ đó chính là end carry, phải cộng vào chứ không bỏ,
  // nếu không M − 0 sẽ bị chấm nhầm thành số âm.
  const endCarry = carry === 1 || comp.carryOut === 1;

  const steps = [
    { label: 'M', value: M },
    { label: "r's complement của N", value: compN },
    { label: 'M + comp(N)', value: (endCarry ? '1' : '') + sum },
  ];

  if (endCarry) {
    steps.push({ label: 'Có nhớ ra ngoài ⇒ bỏ nhớ, kết quả dương', value: sum });
    return { digits: sum, negative: false, endCarry, compN, sum, steps };
  }
  const back = radixComplement(sum, r).digits;
  steps.push({ label: "Không có nhớ ⇒ lấy r's complement của tổng, kết quả âm", value: '−' + back });
  return { digits: back, negative: true, endCarry, compN, sum, steps };
}

/** Kiểm chứng bằng số học thập phân: giá trị thực của M − N. */
export function subtractValue(mText, nText, r) {
  return toDecimal(mText, r) - toDecimal(nText, r);
}

/** Đổi kết quả của subtractByComplement về số thập phân có dấu. */
export function complementResultValue(res, r) {
  const v = toDecimal(res.digits, r);
  return (res.negative ? -v : v) || 0;    // tránh trả về -0 khi hiệu bằng 0
}

/** Tiện ích: r's complement của một số thập phân, biểu diễn ở cơ số r. */
export function radixComplementOfDecimal(value, r, width) {
  const s = fromDecimal(value, r).padStart(width, '0');
  return radixComplement(s, r).digits;
}
