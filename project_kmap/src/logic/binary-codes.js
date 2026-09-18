/* ---------------------------------------------------------------
   MÃ NHỊ PHÂN — Chương 1, §1.7–1.9
   BCD (và phép cộng BCD có hiệu chỉnh +6), 2421, Excess-3, parity.
   --------------------------------------------------------------- */

/** Bảng mã cho 10 chữ số thập phân. */
export const CODE_TABLES = {
  bcd: { name: 'BCD (8421)', bits: 4, of: d => d.toString(2).padStart(4, '0') },
  '2421': {
    name: '2421 (tự bù)',
    bits: 4,
    // 0..4 dùng như BCD; 5..9 lấy mã của (d+6) để bảng tự bù (self-complementing)
    of: d => (d <= 4 ? d : d + 6).toString(2).padStart(4, '0'),
  },
  excess3: { name: 'Excess-3 (tự bù)', bits: 4, of: d => (d + 3).toString(2).padStart(4, '0') },
};

/** Mã của một chữ số 0..9 theo một bảng mã. */
export function encodeDigit(d, table) {
  const t = CODE_TABLES[table];
  if (!t) throw new Error('không có bảng mã "' + table + '"');
  if (!Number.isInteger(d) || d < 0 || d > 9) throw new Error('chữ số phải trong 0..9');
  return t.of(d);
}

/** Mã hoá cả một số thập phân (mỗi chữ số thành một nhóm bit). */
export function encodeDecimal(text, table) {
  const s = String(text).trim();
  if (!/^\d+$/.test(s)) throw new Error('chỉ nhận chữ số thập phân 0..9');
  return [...s].map(ch => ({ digit: +ch, bits: encodeDigit(+ch, table) }));
}

/** Giải mã một nhóm bit về chữ số; trả về null nếu là tổ hợp không dùng. */
export function decodeGroup(bits, table) {
  for (let d = 0; d <= 9; d++) if (encodeDigit(d, table) === bits) return d;
  return null;
}

/** Bảng đối chiếu 0..9 của cả ba bảng mã. */
export function codeTable() {
  return [...Array(10).keys()].map(d => ({
    digit: d,
    bcd: encodeDigit(d, 'bcd'),
    '2421': encodeDigit(d, '2421'),
    excess3: encodeDigit(d, 'excess3'),
  }));
}

/**
 * Một bảng mã là "tự bù" (self-complementing) khi mã của d và mã của 9−d
 * là bù 1 của nhau. 2421 và Excess-3 tự bù, BCD thì không.
 */
export function isSelfComplementing(table) {
  for (let d = 0; d <= 9; d++) {
    const a = encodeDigit(d, table);
    const b = encodeDigit(9 - d, table);
    const flipped = [...a].map(c => (c === '0' ? '1' : '0')).join('');
    if (flipped !== b) return false;
  }
  return true;
}

/**
 * Cộng hai chữ số BCD với hiệu chỉnh +6 (§1.7).
 * Nếu tổng nhị phân > 9 hoặc có nhớ thì phải cộng thêm 0110.
 * Trả về { raw, needsFix, fixed, digit, carry, steps }.
 */
export function addBcdDigits(a, b, carryIn = 0) {
  if ([a, b].some(d => !Number.isInteger(d) || d < 0 || d > 9)) {
    throw new Error('mỗi chữ số phải trong 0..9');
  }
  const sum = a + b + carryIn;
  const raw = sum.toString(2).padStart(5, '0');
  const needsFix = sum > 9;
  const digit = needsFix ? sum - 10 : sum;
  const carry = needsFix ? 1 : 0;

  const steps = [
    { label: 'Cộng nhị phân', value: raw + '  (' + sum + ')' },
    needsFix
      ? { label: 'Tổng > 9 ⇒ cộng hiệu chỉnh 0110 (+6)', value: '+ 00110' }
      : { label: 'Tổng ≤ 9 ⇒ không cần hiệu chỉnh', value: '—' },
    { label: 'Kết quả', value: (carry ? '1 ' : '') + digit.toString(2).padStart(4, '0') + '  (' + digit + ')' },
  ];
  return { raw, needsFix, fixed: digit.toString(2).padStart(4, '0'), digit, carry, steps };
}

/** Cộng hai số BCD nhiều chữ số, trả về từng cột. */
export function addBcd(aText, bText) {
  const A = String(aText).trim(), B = String(bText).trim();
  if (!/^\d+$/.test(A) || !/^\d+$/.test(B)) throw new Error('chỉ nhận chữ số thập phân 0..9');
  const w = Math.max(A.length, B.length);
  const a = A.padStart(w, '0'), b = B.padStart(w, '0');
  const cols = [];
  let carry = 0;
  for (let i = w - 1; i >= 0; i--) {
    const r = addBcdDigits(+a[i], +b[i], carry);
    cols.unshift({ a: +a[i], b: +b[i], carryIn: carry, ...r });
    carry = r.carry;
  }
  const digits = (carry ? '1' : '') + cols.map(c => c.digit).join('');
  return { digits, cols, carryOut: carry };
}

/* ---------------- Parity (§1.9) ---------------- */

/** Bit parity cho một chuỗi bit. kind = 'even' | 'odd'. */
export function parityBit(bits, kind = 'even') {
  if (!/^[01]+$/.test(bits)) throw new Error('chỉ được dùng ký tự 0 và 1');
  const ones = [...bits].filter(b => b === '1').length;
  const even = ones % 2 === 0;
  return kind === 'even' ? (even ? '0' : '1') : (even ? '1' : '0');
}

/** Gắn bit parity vào cuối chuỗi. */
export function withParity(bits, kind = 'even') {
  return bits + parityBit(bits, kind);
}

/** Kiểm tra một chuỗi đã gắn parity có lỗi 1 bit hay không. */
export function checkParity(bitsWithParity, kind = 'even') {
  if (!/^[01]+$/.test(bitsWithParity)) throw new Error('chỉ được dùng ký tự 0 và 1');
  const ones = [...bitsWithParity].filter(b => b === '1').length;
  return kind === 'even' ? ones % 2 === 0 : ones % 2 === 1;
}

/** Mã ASCII 7 bit của một ký tự. */
export function asciiBits(ch) {
  const code = String(ch).charCodeAt(0);
  if (!(code >= 0 && code <= 127)) throw new Error('chỉ hỗ trợ ký tự ASCII 7 bit');
  return code.toString(2).padStart(7, '0');
}
