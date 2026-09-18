/* ---------------------------------------------------------------
   ĐẠI SỐ BOOLEAN — định lý & rút gọn từng bước (Chương 2, §2.2–2.5)
   Biểu thức được mô tả bằng chuỗi; mỗi bước rút gọn ghi rõ định lý đã dùng.
   --------------------------------------------------------------- */

import { varNames } from './quine-mccluskey.js';
import { exprTruthTable, sopStats } from './expr-parser.js';
import { parseAst, formatAst, dualAst } from './bool-ast.js';import { fail } from './app-error.js';

/** Tiên đề Huntington & các định lý cơ bản của đại số Boolean (§2.2–2.3). */
export const THEOREMS = [
  { id: 'P2a', nameKey: 'law.identity', law: 'x + 0 = x' },
  { id: 'P2b', nameKey: 'law.identity', law: 'x · 1 = x' },
  { id: 'P5a', nameKey: 'law.complement', law: "x + x' = 1" },
  { id: 'P5b', nameKey: 'law.complement', law: "x · x' = 0" },
  { id: 'T1a', nameKey: 'law.idempotent', law: 'x + x = x' },
  { id: 'T1b', nameKey: 'law.idempotent', law: 'x · x = x' },
  { id: 'T2a', nameKey: 'law.absorbing', law: 'x + 1 = 1' },
  { id: 'T2b', nameKey: 'law.absorbing', law: 'x · 0 = 0' },
  { id: 'T3', nameKey: 'law.involution', law: "(x')' = x" },
  { id: 'T4a', nameKey: 'law.associative', law: 'x + (y + z) = (x + y) + z' },
  { id: 'T4b', nameKey: 'law.associative', law: 'x(yz) = (xy)z' },
  { id: 'T5a', nameKey: 'law.demorgan', law: "(x + y)' = x'y'" },
  { id: 'T5b', nameKey: 'law.demorgan', law: "(xy)' = x' + y'" },
  { id: 'T6a', nameKey: 'law.absorption', law: 'x + xy = x' },
  { id: 'T6b', nameKey: 'law.absorption', law: 'x(x + y) = x' },
  { id: 'P4a', nameKey: 'law.distributive', law: 'x(y + z) = xy + xz' },
  { id: 'P4b', nameKey: 'law.distributive', law: 'x + yz = (x + y)(x + z)' },
  { id: 'P3a', nameKey: 'law.commutative', law: 'x + y = y + x' },
  { id: 'P3b', nameKey: 'law.commutative', law: 'xy = yx' },
  { id: 'C1', nameKey: 'law.consensus', law: "xy + x'z + yz = xy + x'z" },
];

/** Tra một định lý theo id, vd theorem('T6a'). */
export function theorem(id) {
  const t = THEOREMS.find(x => x.id === id);
  if (!t) fail('err.noTheorem', { id });
  return t;
}

/**
 * Một lời giải rút gọn viết sẵn: danh sách bước, mỗi bước là biểu thức mới
 * kèm định lý biện minh. Hàm này KIỂM CHỨNG lời giải chứ không tự tìm ra nó —
 * mọi bước phải cùng bảng chân trị với biểu thức đầu.
 * Trả về { ok, steps:[{expr, by, law, name}], from, to, statsFrom, statsTo, errors }.
 */
export function checkDerivation(from, stepList, n) {
  const base = exprTruthTable(from, n);
  const errors = [];
  const steps = [];

  stepList.forEach((st, i) => {
    const t = theorem(st.by);
    let tt = null;
    try {
      tt = exprTruthTable(st.expr, n);
    } catch (e) {
      errors.push({ key: 'c2.stepParseFail', params: { i: i + 1, expr: st.expr } });
    }
    if (tt && !tt.every((v, m) => v === base[m])) {
      errors.push({ key: 'c2.stepNotEquiv', params: { i: i + 1, expr: st.expr } });
    }
    steps.push({ expr: st.expr, by: st.by, law: t.law, nameKey: t.nameKey, noteKey: st.noteKey || '' });
  });

  const to = stepList.length ? stepList[stepList.length - 1].expr : from;
  return {
    ok: errors.length === 0,
    steps, from, to, errors,
    statsFrom: sopStats(from, n),
    statsTo: sopStats(to, n),
  };
}

/** Hai biểu thức có cùng bảng chân trị không? */
export function equivalent(a, b, n) {
  const ta = exprTruthTable(a, n), tb = exprTruthTable(b, n);
  return ta.every((v, m) => v === tb[m]);
}

/** Dual của một biểu thức (§2.2): đổi + ↔ ·, 0 ↔ 1, giữ nguyên biến. */
export function dual(expr, n) {
  return formatAst(dualAst(parseAst(expr, n)), n);
}

/** Chuẩn hoá cách viết một biểu thức (parse rồi in lại). */
export function normalize(expr, n) {
  return formatAst(parseAst(expr, n), n);
}

/** Số term và literal của một biểu thức SOP phẳng (null nếu có ngoặc). */
export function cost(expr, n) {
  return sopStats(expr, n);
}

/** Danh sách biến thực sự xuất hiện trong biểu thức, theo thứ tự A, B, C… */
export function usedVars(expr, n) {
  const names = varNames(n);
  const low = expr.toLowerCase();
  return names.filter(v => low.includes(v));
}
