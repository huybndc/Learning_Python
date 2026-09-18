/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 1 (thuần, không đụng DOM)
   Mỗi câu: { kind, text, answer, hint, meta }. Chấm bằng compareAnswer().
   `meta` giữ tham số sinh đề ở dạng có cấu trúc, để kiểm chứng/chấm lại mà
   không phải bóc tách chuỗi đề bằng regex.
   --------------------------------------------------------------- */

import { convertBase, fromDecimal } from './number-systems.js';
import { radixComplement, subtractByComplement } from './complements.js';
import { encode, range } from './signed-binary.js';

export const KINDS = ['convert', 'complement', 'subtract', 'signed'];

const BASE_NAME = { 2: 'nhị phân', 8: 'bát phân', 10: 'thập phân', 16: 'thập lục phân' };

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Đề đổi cơ số. */
function makeConvert(rnd) {
  const from = pick([2, 8, 10, 16], rnd);
  const to = pick([2, 8, 10, 16].filter(b => b !== from), rnd);
  const v = int(1, 255, rnd);
  const src = fromDecimal(v, from);
  return {
    kind: 'convert',
    text: 'Đổi (' + src + ') từ ' + BASE_NAME[from] + ' sang ' + BASE_NAME[to] + '.',
    answer: convertBase(src, from, to),
    hint: 'Phần nguyên: chia liên tiếp cho ' + to + ', đọc số dư từ dưới lên.',
    meta: { src, from, to },
  };
}

/** Đề tính r's complement. */
function makeComplement(rnd) {
  const r = pick([2, 10], rnd);
  const width = r === 2 ? 7 : 4;
  const v = int(1, Math.pow(r, width) - 2, rnd);
  const src = fromDecimal(v, r).padStart(width, '0');
  return {
    kind: 'complement',
    text: 'Tính ' + r + "'s complement của (" + src + ') ở cơ số ' + r
      + ' (giữ nguyên ' + width + ' chữ số).',
    answer: radixComplement(src, r).digits,
    hint: "Lấy (" + (r - 1) + ")'s complement (trừ từng chữ số) rồi cộng 1.",
    meta: { src, r, width },
  };
}

/** Đề trừ bằng complement. */
function makeSubtract(rnd) {
  const r = pick([2, 10], rnd);
  const width = r === 2 ? 6 : 3;
  const hi = Math.pow(r, width) - 1;
  let a = int(1, hi, rnd), b = int(1, hi, rnd);
  const A = fromDecimal(a, r).padStart(width, '0');
  const B = fromDecimal(b, r).padStart(width, '0');
  const res = subtractByComplement(A, B, r);
  return {
    kind: 'subtract',
    text: 'Dùng ' + r + "'s complement để tính (" + A + ') − (' + B + ') ở cơ số ' + r
      + '. Ghi kết quả ' + width + ' chữ số, thêm dấu − ở đầu nếu âm.',
    answer: (res.negative ? '-' : '') + res.digits,
    meta: { m: A, n: B, r, width },
    hint: 'Cộng M với ' + r + "'s complement của N. Có nhớ ra ngoài ⇒ bỏ nhớ, kết quả dương; "
      + 'không có nhớ ⇒ lấy complement của tổng, kết quả âm.',
  };
}

/** Đề biểu diễn số có dấu. */
function makeSigned(rnd) {
  const w = pick([5, 8], rnd);
  const format = pick(['magnitude', 'ones', 'twos'], rnd);
  const { min, max } = range(format, w);
  const v = int(min, max, rnd);
  const label = { magnitude: 'signed-magnitude', ones: "signed 1's complement", twos: "signed 2's complement" };
  return {
    kind: 'signed',
    text: 'Biểu diễn ' + v + ' ở dạng ' + label[format] + ' trên ' + w + ' bit.',
    answer: encode(v, format, w),
    hint: v >= 0
      ? 'Số dương: cả ba dạng viết giống nhau, chỉ cần đệm 0 cho đủ ' + w + ' bit.'
      : 'Số âm: bit trái nhất là 1. Xem lại quy tắc của dạng ' + label[format] + '.',
    meta: { value: v, format, w },
  };
}

const MAKERS = {
  convert: makeConvert,
  complement: makeComplement,
  subtract: makeSubtract,
  signed: makeSigned,
};

/** Sinh một câu hỏi; kind = 'mix' thì chọn ngẫu nhiên trong 4 dạng. */
export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) throw new Error('dạng bài không hợp lệ: ' + kind);
  return make(rnd);
}

/**
 * So đáp án: bỏ khoảng trắng, không phân biệt hoa thường, và bỏ các số 0 ở
 * đầu (trừ khi đáp án chỉ toàn 0) để người học không bị trừ oan vì đệm 0.
 */
export function compareAnswer(given, expected) {
  const norm = s => {
    let t = String(s).trim().toUpperCase().replace(/\s+/g, '');
    let sign = '';
    if (t.startsWith('-') || t.startsWith('−')) { sign = '-'; t = t.slice(1); }
    t = t.replace(/^0+(?=.)/, '');
    return sign + t;
  };
  return norm(given) === norm(expected);
}
