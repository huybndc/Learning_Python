/* ---------------------------------------------------------------
   HÀM BÙ (COMPLEMENT) — Chương 2, §2.5, Example 2.2–2.3
   Hai cách lấy bù của một hàm: DeMorgan mở rộng, hoặc qua dual.
   Mọi biến đổi làm trên cây cú pháp (bool-ast.js), không trên chuỗi.
   --------------------------------------------------------------- */

import {
  parseAst, formatAst, dualAst, pushNot, complementLiteralsAst, evalAst,
} from './bool-ast.js';

/**
 * Lấy bù bằng DeMorgan mở rộng (Example 2.2):
 * (A + B + C…)′ = A′B′C′…   và   (ABC…)′ = A′ + B′ + C′…
 * Trả về { result, steps } — mỗi bước là một chuỗi kèm lời giải thích.
 */
export function complementByDeMorgan(expr, n) {
  const ast = parseAst(expr, n);
  const out = pushNot(ast);
  return {
    result: formatAst(out, n),
    steps: [
      { expr: '(' + formatAst(ast, n) + ")'", noteKey: 'c2.dmStart' },
      { expr: formatAst(out, n), noteKey: 'c2.dmApply' },
    ],
  };
}

/**
 * Lấy bù qua dual (Example 2.3): lấy dual rồi bù từng literal.
 * Cho đúng cùng kết quả với DeMorgan — hai cách nhìn của một quy tắc.
 */
export function complementByDual(expr, n) {
  const ast = parseAst(expr, n);
  const d = dualAst(ast);
  const out = complementLiteralsAst(d);
  return {
    result: formatAst(out, n),
    steps: [
      { expr: formatAst(ast, n), noteKey: 'c2.duStart' },
      { expr: formatAst(d, n), noteKey: 'c2.duDual' },
      { expr: formatAst(out, n), noteKey: 'c2.duCompl' },
    ],
  };
}

/** Kiểm chứng: F′ phải bằng NOT F tại mọi dòng bảng chân trị. */
export function verifyComplement(expr, complementExpr, n) {
  const f = parseAst(expr, n), g = parseAst(complementExpr, n);
  for (let m = 0; m < (1 << n); m++) {
    if (evalAst(g, m, n) !== (evalAst(f, m, n) ^ 1)) return false;
  }
  return true;
}
