/* ---------------------------------------------------------------
   CHUYỂN MẠCH AND-OR THÀNH TOÀN NAND — Chương 2, Fig 2.7(c)
   F = t₁ + t₂ + … + tₖ  (SOP hai tầng)
     = (t₁′ · t₂′ · … · tₖ′)′        (DeMorgan)
     = NAND( NAND(t₁), NAND(t₂), … )
   Tầng 1 là các NAND tạo tᵢ′, tầng 2 là một NAND gộp lại.
   --------------------------------------------------------------- */

import { parseAst, formatAst } from './bool-ast.js';

/** Lấy danh sách term của một biểu thức SOP phẳng; ném lỗi nếu không phải SOP. */
export function sopTerms(expr, n) {
  const ast = parseAst(expr, n);
  const terms = ast.t === 'or' ? ast.parts : [ast];
  for (const t of terms) {
    const factors = t.t === 'and' ? t.parts : [t];
    for (const f of factors) {
      const leaf = f.t === 'not' ? f.x : f;
      if (leaf.t !== 'var' && leaf.t !== 'const') {
        throw new Error('chưa phải SOP hai tầng — còn ngoặc lồng bên trong');
      }
    }
  }
  return terms.map(t => formatAst(t, n));
}

/**
 * Chuyển F (dạng SOP) thành biểu thức chỉ dùng NAND.
 * Trả về { result, terms, steps } — result là chuỗi kiểm chứng được bằng
 * exprTruthTable, dùng dấu ' để biểu diễn phép đảo của mỗi NAND.
 */
export function sopToNand(expr, n) {
  const terms = sopTerms(expr, n);
  const inverted = terms.map(t => (t.length === 1 || /^[A-E]'$/.test(t) ? t + "'" : '(' + t + ")'"));
  const result = '(' + inverted.join('') + ")'";

  return {
    result,
    terms,
    steps: [
      { expr: terms.join(' + '), note: 'Dạng SOP ban đầu (mạch AND-OR hai tầng).' },
      {
        expr: terms.map((t, i) => 't' + (i + 1) + ' = ' + t).join(',  '),
        note: 'Đặt tên cho ngõ ra của từng cổng AND ở tầng 1.',
      },
      {
        expr: 'F = (' + terms.map((_, i) => 't' + (i + 1) + "'").join(' · ') + ")'",
        note: 'Bù hai lần rồi áp DeMorgan cho tầng OR: t₁ + t₂ + … = (t₁′ · t₂′ · …)′.',
      },
      {
        expr: result,
        note: 'Thay tᵢ′ bằng biểu thức của nó: mỗi tᵢ′ chính là một cổng NAND ở '
          + 'tầng 1, còn dấu ngoặc ngoài cùng là cổng NAND tầng 2.',
      },
    ],
    gateCount: { level1: terms.length, level2: 1 },
  };
}
