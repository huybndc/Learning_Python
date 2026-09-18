import { describe, it, expect } from 'vitest';
import {
  complementByDeMorgan, complementByDual, verifyComplement,
} from '../src/logic/boolean-complement.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';

/* Example 2.2–2.3 trong sách. */

const CASES = [
  ["x + y'z", 3],
  ["x'yz' + x'y'z", 3],
  ["x'yz' + x'y'z + xz", 3],
  ['x(y + z)', 3],
  ["(x + y)(x' + y')", 2],
  ['z', 1],
  ['wx + yz', 4],
];

describe('complementByDeMorgan (Example 2.2)', () => {
  it('kết quả đúng bằng phủ định của hàm gốc', () => {
    for (const [e, n] of CASES) {
      const r = complementByDeMorgan(e, n);
      expect(verifyComplement(e, r.result, n), `${e} → ${r.result}`).toBe(true);
    }
  });

  it("F = x + y'z  ⇒  F' = x'(y + z')", () => {
    expect(complementByDeMorgan("x + y'z", 3).result).toBe("x'(y + z')");
  });

  it('có đủ các bước giải thích', () => {
    const r = complementByDeMorgan("x + y'z", 3);
    expect(r.steps.length).toBe(2);
    expect(r.steps[0].expr).toBe("(x + y'z)'");
    expect(r.steps.every(s => s.noteKey.length > 0)).toBe(true);
  });
});

describe('complementByDual (Example 2.3)', () => {
  it('cho đúng cùng kết quả với cách DeMorgan', () => {
    for (const [e, n] of CASES) {
      expect(complementByDual(e, n).result, e).toBe(complementByDeMorgan(e, n).result);
    }
  });

  it('bước giữa đúng là dual của biểu thức', () => {
    const r = complementByDual("x + y'z", 3);
    expect(r.steps.length).toBe(3);
    expect(r.steps[1].expr).toBe("x(y' + z)");
    expect(r.steps[2].expr).toBe("x'(y + z')");
  });
});

describe('verifyComplement', () => {
  it('phát hiện được biểu thức bù sai', () => {
    expect(verifyComplement('x + y', "x' + y'", 2)).toBe(false);
    expect(verifyComplement('x + y', "x'y'", 2)).toBe(true);
  });

  it('bù của bù là chính hàm ban đầu', () => {
    for (const [e, n] of CASES) {
      const once = complementByDeMorgan(e, n).result;
      const twice = complementByDeMorgan(once, n).result;
      expect(exprTruthTable(twice, n), e).toEqual(exprTruthTable(e, n));
    }
  });
});
