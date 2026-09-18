/* ---------------------------------------------------------------
   SỐ NHỊ PHÂN CÓ DẤU — Chương 1, §1.6
   Ba cách biểu diễn: signed-magnitude, signed 1's complement,
   signed 2's complement. Bit trái nhất là bit dấu (0 = dương, 1 = âm).
   --------------------------------------------------------------- */

import { fail } from './app-error.js';

export const FORMATS = ['magnitude', 'ones', 'twos'];

const pad = (v, w) => v.toString(2).padStart(w, '0');

/** Khoảng biểu diễn được của mỗi dạng với w bit (kể cả bit dấu). */
export function range(format, w) {
  const half = 1 << (w - 1);
  return format === 'twos'
    ? { min: -half, max: half - 1 }
    : { min: -(half - 1), max: half - 1 };
}

/** Số thập phân có dấu → chuỗi w bit theo một trong ba dạng. */
export function encode(value, format, w) {
  if (!FORMATS.includes(format)) fail('err.badFormat', { format });
  const { min, max } = range(format, w);
  if (!Number.isInteger(value)) fail('err.needInt');
  if (value < min || value > max) fail('err.outOfRange', { value, min, max, w });
  const mag = Math.abs(value);
  if (value >= 0) return pad(mag, w);
  switch (format) {
    case 'magnitude': return '1' + pad(mag, w - 1);
    case 'ones': return [...pad(mag, w)].map(b => (b === '0' ? '1' : '0')).join('');
    case 'twos': return pad((1 << w) + value, w);      // value âm ⇒ 2^w + value
    default: return fail('err.badFormat', { format });
  }
}

/** Chuỗi bit → số thập phân có dấu theo một trong ba dạng. */
export function decode(bits, format) {
  if (!/^[01]+$/.test(bits)) fail('err.bitsOnly');
  const w = bits.length;
  const neg = bits[0] === '1';
  if (!neg) return parseInt(bits, 2);
  // "|| 0" biến -0 thành 0: magnitude và ones đều có cách viết "âm không",
  // nhưng giá trị của nó vẫn là 0 (nếu để -0 thì giao diện hiện ra "−0").
  switch (format) {
    case 'magnitude': return -parseInt(bits.slice(1) || '0', 2) || 0;
    case 'ones': return -parseInt([...bits].map(b => (b === '0' ? '1' : '0')).join(''), 2) || 0;
    case 'twos': return parseInt(bits, 2) - (1 << w);
    default: return fail('err.badFormat', { format });
  }
}

/**
 * Cộng hai số signed 2's complement w bit (§1.6).
 * Bit nhớ ra ngoài bị **bỏ đi**; tràn số (overflow) phát hiện bằng quy tắc
 * "hai toán hạng cùng dấu mà kết quả khác dấu".
 * Trả về { bits, value, carryOut, overflow, steps }.
 */
export function addTwos(aBits, bBits) {
  if (aBits.length !== bBits.length) fail('err.sameWidth');
  const w = aBits.length;
  let carry = 0;
  const out = [];
  const carries = [];
  for (let i = w - 1; i >= 0; i--) {
    const s = (+aBits[i]) + (+bBits[i]) + carry;
    out.unshift(String(s & 1));
    carries.unshift(carry);
    carry = s >= 2 ? 1 : 0;
  }
  const bits = out.join('');
  const sa = aBits[0] === '1', sb = bBits[0] === '1', sr = bits[0] === '1';
  const overflow = (sa === sb) && (sr !== sa);
  return {
    bits,
    value: decode(bits, 'twos'),
    carryOut: carry,
    overflow,
    carries,
    steps: [
      { labelKey: 'add.a', value: aBits + '  (' + decode(aBits, 'twos') + ')' },
      { labelKey: 'add.b', value: bBits + '  (' + decode(bBits, 'twos') + ')' },
      { labelKey: 'add.sum', value: bits + '  (' + decode(bits, 'twos') + ')' },
    ],
  };
}

/** Trừ A − B bằng 2's complement: cộng A với 2's complement của B. */
export function subTwos(aBits, bBits) {
  if (aBits.length !== bBits.length) fail('err.sameWidth');
  const negB = encode(-decode(bBits, 'twos'), 'twos', bBits.length);
  const r = addTwos(aBits, negB);
  return { ...r, negB };
}

/** Bảng đối chiếu 3 dạng cho một giá trị (giá trị nào không biểu diễn được thì null). */
export function compareFormats(value, w) {
  return FORMATS.map(f => {
    try {
      return { format: f, bits: encode(value, f, w) };
    } catch {
      return { format: f, bits: null };
    }
  });
}
