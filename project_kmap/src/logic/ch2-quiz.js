/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ LUYỆN TẬP CHƯƠNG 2 (thuần, không đụng DOM)
   --------------------------------------------------------------- */

import { allFunctions, STANDARD_GATES, functionAt } from './logic-gates.js';
import { sopToNand } from './nand-conversion.js';
import { complementByDeMorgan } from './boolean-complement.js';
import { exprTruthTable } from './expr-parser.js';import { fail } from './app-error.js';

export const KINDS = ['identify', 'nand', 'complement'];

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

/** Cho bảng chân trị → hỏi đó là hàm Fᵢ nào / cổng gì. */
function makeIdentify(rnd) {
  const gate = pick(STANDARD_GATES.filter(g => g.fi !== 3 && g.fi !== 12), rnd);
  const f = functionAt(gate.fi);
  const rows = f.rows.map(r => `x=${r.x} y=${r.y} → ${r.f}`).join('   ·   ');
  return {
    kind: 'identify',
    textKey: 'c2q.qIdentify',
    textParams: { rows },
    answer: gate.gate,
    accepts: [gate.gate, 'F' + gate.fi, String(gate.fi)],
    hintKey: 'c2q.hIdentify',
    hintParams: { bits: f.bits },
    meta: { fi: gate.fi, gate: gate.gate, bits: f.bits },
  };
}

/** Cho biểu thức SOP → yêu cầu chuyển thành toàn NAND. */
function makeNand(rnd) {
  const exprs = [
    ['wx + yz', 4], ["x'y + xy'", 2], ['xy + z', 3],
    ["x'y'z + xyz", 3], ['xy + yz + zx', 3], ["x + y'z", 3],
  ];
  const [expr, n] = pick(exprs, rnd);
  const r = sopToNand(expr, n);
  return {
    kind: 'nand',
    textKey: 'c2q.qNand',
    textParams: { expr },
    answer: r.result,
    hintKey: 'c2q.hNand',
    hintParams: { n: r.gateCount.level1 },
    meta: { expr, n, result: r.result },
  };
}

/** Cho biểu thức → yêu cầu lấy hàm bù. */
function makeComplement(rnd) {
  const exprs = [["x + y'z", 3], ['wx + yz', 4], ["x'y + xy'", 2], ['x(y + z)', 3], ["x'yz", 3]];
  const [expr, n] = pick(exprs, rnd);
  const r = complementByDeMorgan(expr, n);
  return {
    kind: 'complement',
    textKey: 'c2q.qComplement',
    textParams: { expr },
    answer: r.result,
    hintKey: 'c2q.hComplement',
    hintParams: {},
    meta: { expr, n, result: r.result },
  };
}

const MAKERS = { identify: makeIdentify, nand: makeNand, complement: makeComplement };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  const make = MAKERS[k];
  if (!make) fail('err.badQuizKind', { kind });
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
    return { ok: false, reason: 'parse', error: e };
  }
  const want = exprTruthTable(q.answer, n);
  return { ok: tt.every((v, m) => v === want[m]), reason: 'truthtable' };
}
