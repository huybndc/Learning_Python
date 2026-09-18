/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 2 (thuần, không đụng DOM)
   --------------------------------------------------------------- */

import { allFunctions, STANDARD_GATES, functionAt } from './logic-gates.js';
import { sopToNand } from './nand-conversion.js';
import { complementByDeMorgan } from './boolean-complement.js';
import { exprTruthTable } from './expr-parser.js';

export const KINDS = ['identify', 'nand', 'complement'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

/** Cho bảng chân trị → hỏi đó là hàm Fᵢ nào / cổng gì. */
function makeIdentify(rnd) {
  const gate = pick(STANDARD_GATES.filter(g => g.fi !== 3 && g.fi !== 12), rnd);
  const f = functionAt(gate.fi);
  const rows = f.rows.map(r => `x=${r.x} y=${r.y} → ${r.f}`).join('   ·   ');
  return {
    kind: 'identify',
    text: 'Bảng chân trị sau ứng với cổng logic nào?   ' + rows,
    answer: gate.gate,
    accepts: [gate.gate, 'F' + gate.fi, String(gate.fi)],
    hint: 'Đọc cột kết quả từ trên xuống thành chuỗi 4 bit: ' + f.bits
      + '. Chuỗi đó chính là số hiệu Fᵢ ở dạng nhị phân.',
    meta: { fi: gate.fi, gate: gate.gate, bits: f.bits },
  };
}

/** Cho biểu thức SOP → yêu cầu chuyển thành toàn NAND. */
function makeNand(rnd) {
  const exprs = [
    ['AB + CD', 4], ["A'B + AB'", 2], ['AB + C', 3],
    ["A'B'C + ABC", 3], ['AB + BC + CA', 3], ["A + B'C", 3],
  ];
  const [expr, n] = pick(exprs, rnd);
  const r = sopToNand(expr, n);
  return {
    kind: 'nand',
    text: 'Chuyển F = ' + expr + ' thành mạch chỉ dùng cổng NAND (viết biểu thức tương đương).',
    answer: r.result,
    hint: 'Bù hai lần rồi áp DeMorgan: t₁ + t₂ = (t₁′ · t₂′)′. '
      + 'Cần ' + r.gateCount.level1 + ' NAND ở tầng 1 và 1 NAND ở tầng 2.',
    meta: { expr, n, result: r.result },
  };
}

/** Cho biểu thức → yêu cầu lấy hàm bù. */
function makeComplement(rnd) {
  const exprs = [["A + B'C", 3], ['AB + CD', 4], ["A'B + AB'", 2], ['A(B + C)', 3], ["A'BC", 3]];
  const [expr, n] = pick(exprs, rnd);
  const r = complementByDeMorgan(expr, n);
  return {
    kind: 'complement',
    text: 'Cho F = ' + expr + '. Tìm F′ (dùng DeMorgan mở rộng).',
    answer: r.result,
    hint: 'Đổi mọi + thành ·, mọi · thành +, rồi bù từng literal. Nhớ giữ đúng thứ tự ưu tiên.',
    meta: { expr, n, result: r.result },
  };
}

const MAKERS = { identify: makeIdentify, nand: makeNand, complement: makeComplement };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) throw new Error('dạng bài không hợp lệ: ' + kind);
  return make(rnd);
}

/**
 * Chấm bài. Với câu 'identify' chỉ so tên (không phân biệt hoa thường).
 * Với câu biểu thức thì chấm theo **bảng chân trị**, nên người học viết cách
 * khác mà vẫn tương đương thì vẫn được tính đúng.
 */
export function checkAnswer(q, given) {
  const g = String(given).trim();
  if (!g) return { ok: false, reason: 'empty' };

  if (q.accepts) {
    const norm = s => s.trim().toUpperCase().replace(/\s+/g, '');
    return { ok: q.accepts.some(a => norm(a) === norm(g)), reason: 'name' };
  }
  const n = q.meta.n;
  let tt;
  try {
    tt = exprTruthTable(g, n);
  } catch (e) {
    return { ok: false, reason: 'parse', message: e.message };
  }
  const want = exprTruthTable(q.answer, n);
  return { ok: tt.every((v, m) => v === want[m]), reason: 'truthtable' };
}
