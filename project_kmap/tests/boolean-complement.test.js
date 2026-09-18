import { describe, it, expect } from 'vitest';
import {
  complementByDeMorgan, complementByDual, verifyComplement,
} from '../src/logic/boolean-complement.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';

/* Example 2.2–2.3 trong sách. */

const CASES = [
  ["A + B'C", 3],
  ["A'BC' + A'B'C", 3],
  ["A'BC' + A'B'C + AC", 3],
  ['A(B + C)', 3],
  ["(A + B)(A' + B')", 2],
  ['A', 1],
  ['AB + CD', 4],
];

describe('complementByDeMorgan (Example 2.2)', () => {
  it('kết quả đúng bằng phủ định của hàm gốc', () => {
    for (const [e, n] of CASES) {
      const r = complementByDeMorgan(e, n);
      expect(verifyComplement(e, r.result, n), `${e} → ${r.result}`).toBe(true);
    }
  });

  it("F = A + B'C  ⇒  F' = A'(B + C')", () => {
    expect(complementByDeMorgan("A + B'C", 3).result).toBe("A'(B + C')");
  });

  it('có đủ các bước giải thích', () => {
    const r = complementByDeMorgan("A + B'C", 3);
    expect(r.steps.length).toBe(2);
    expect(r.steps[0].expr).toBe("(A + B'C)'");
    expect(r.steps.every(s => s.note.length > 0)).toBe(true);
  });
});

describe('complementByDual (Example 2.3)', () => {
  it('cho đúng cùng kết quả với cách DeMorgan', () => {
    for (const [e, n] of CASES) {
      expect(complementByDual(e, n).result, e).toBe(complementByDeMorgan(e, n).result);
    }
  });

  it('bước giữa đúng là dual của biểu thức', () => {
    const r = complementByDual("A + B'C", 3);
    expect(r.steps.length).toBe(3);
    expect(r.steps[1].expr).toBe("A(B' + C)");
    expect(r.steps[2].expr).toBe("A'(B + C')");
  });
});

describe('verifyComplement', () => {
  it('phát hiện được biểu thức bù sai', () => {
    expect(verifyComplement('A + B', "A' + B'", 2)).toBe(false);
    expect(verifyComplement('A + B', "A'B'", 2)).toBe(true);
  });

  it('bù của bù là chính hàm ban đầu', () => {
    for (const [e, n] of CASES) {
      const once = complementByDeMorgan(e, n).result;
      const twice = complementByDeMorgan(once, n).result;
      expect(exprTruthTable(twice, n), e).toEqual(exprTruthTable(e, n));
    }
  });
});
