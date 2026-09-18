/* ---------------------------------------------------------------
   ĐẠI SỐ BOOLEAN — định lý & rút gọn từng bước (Chương 2, §2.2–2.5)
   Biểu thức được mô tả bằng chuỗi; mỗi bước rút gọn ghi rõ định lý đã dùng.
   --------------------------------------------------------------- */

import { varNames } from './quine-mccluskey.js';
import { exprTruthTable, sopStats } from './expr-parser.js';
import { parseAst, formatAst, dualAst } from './bool-ast.js';

/** Tiên đề Huntington & các định lý cơ bản của đại số Boolean (§2.2–2.3). */
export const THEOREMS = [
  { id: 'P2a', name: 'Phần tử trung hoà', law: 'x + 0 = x' },
  { id: 'P2b', name: 'Phần tử trung hoà', law: 'x · 1 = x' },
  { id: 'P5a', name: 'Phần tử bù', law: "x + x' = 1" },
  { id: 'P5b', name: 'Phần tử bù', law: "x · x' = 0" },
  { id: 'T1a', name: 'Luỹ đẳng (idempotent)', law: 'x + x = x' },
  { id: 'T1b', name: 'Luỹ đẳng (idempotent)', law: 'x · x = x' },
  { id: 'T2a', name: 'Phần tử nuốt', law: 'x + 1 = 1' },
  { id: 'T2b', name: 'Phần tử nuốt', law: 'x · 0 = 0' },
  { id: 'T3', name: 'Phủ định hai lần (involution)', law: "(x')' = x" },
  { id: 'T4a', name: 'Kết hợp (associative)', law: 'x + (y + z) = (x + y) + z' },
  { id: 'T4b', name: 'Kết hợp (associative)', law: 'x(yz) = (xy)z' },
  { id: 'T5a', name: 'DeMorgan', law: "(x + y)' = x'y'" },
  { id: 'T5b', name: 'DeMorgan', law: "(xy)' = x' + y'" },
  { id: 'T6a', name: 'Hấp thụ (absorption)', law: 'x + xy = x' },
  { id: 'T6b', name: 'Hấp thụ (absorption)', law: 'x(x + y) = x' },
  { id: 'P4a', name: 'Phân phối (distributive)', law: 'x(y + z) = xy + xz' },
  { id: 'P4b', name: 'Phân phối (distributive)', law: 'x + yz = (x + y)(x + z)' },
  { id: 'P3a', name: 'Giao hoán (commutative)', law: 'x + y = y + x' },
  { id: 'P3b', name: 'Giao hoán (commutative)', law: 'xy = yx' },
  { id: 'C1', name: 'Consensus', law: "xy + x'z + yz = xy + x'z" },
];

/** Tra một định lý theo id, vd theorem('T6a'). */
export function theorem(id) {
  const t = THEOREMS.find(x => x.id === id);
  if (!t) throw new Error('không có định lý "' + id + '"');
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
      errors.push('bước ' + (i + 1) + ': không đọc được "' + st.expr + '" — ' + e.message);
    }
    if (tt && !tt.every((v, m) => v === base[m])) {
      errors.push('bước ' + (i + 1) + ': "' + st.expr + '" không tương đương với biểu thức ban đầu');
    }
    steps.push({ expr: st.expr, by: st.by, law: t.law, name: t.name, noteKey: st.noteKey || '' });
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
