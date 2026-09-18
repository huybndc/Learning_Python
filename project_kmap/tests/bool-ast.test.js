import { describe, it, expect } from 'vitest';
import {
  parseAst, evalAst, formatAst, dualAst, complementLiteralsAst, pushNot,
} from '../src/logic/bool-ast.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';

const tt = (ast, n) => [...Array(1 << n).keys()].map(m => evalAst(ast, m, n));
const fmt = (s, n) => formatAst(parseAst(s, n), n);

describe('parseAst / evalAst', () => {
  it('cho cùng bảng chân trị với parser sẵn có (expr-parser.js)', () => {
    const cases = [["A'B + AB'", 2], ["(A + B)(A' + B')", 2], ['!A', 1],
      ["A + B'C", 3], ["A'BC' + A'B'C + AC", 3], ['0', 2], ['1', 2], ["A''", 1]];
    for (const [e, n] of cases) {
      expect(tt(parseAst(e, n), n), e).toEqual(exprTruthTable(e, n));
    }
  });

  it('A là MSB', () => {
    expect(tt(parseAst('A', 2), 2)).toEqual([0, 0, 1, 1]);
    expect(tt(parseAst('B', 2), 2)).toEqual([0, 1, 0, 1]);
  });

  it('cú pháp sai thì throw', () => {
    expect(() => parseAst("A' +", 2)).toThrow();
    expect(() => parseAst('(A', 2)).toThrow();
    expect(() => parseAst('Z', 2)).toThrow();
  });
});

describe('formatAst', () => {
  it('round-trip giữ nguyên cách viết chuẩn', () => {
    expect(fmt("A + B'C", 3)).toBe("A + B'C");
    expect(fmt("A'BC' + A'B'C", 3)).toBe("A'BC' + A'B'C");
    expect(fmt("(A+B)(A'+B')", 2)).toBe("(A + B)(A' + B')");
  });

  it('chỉ thêm ngoặc khi cần (OR nằm trong AND)', () => {
    expect(fmt('A(B + C)', 3)).toBe('A(B + C)');
    expect(fmt('A + BC', 3)).toBe('A + BC');       // không cần ngoặc quanh BC
  });

  it('in lại rồi parse lại cho cùng bảng chân trị', () => {
    for (const [e, n] of [["A + B'C", 3], ['A(B + C)', 3], ["(A+B)(A'+B')", 2]]) {
      expect(exprTruthTable(fmt(e, n), n), e).toEqual(exprTruthTable(e, n));
    }
  });
});

describe('dualAst', () => {
  it('đổi AND ngầm thành OR đúng ưu tiên', () => {
    // sai nếu làm trên chuỗi ký tự: B'C phải thành (B' + C)
    expect(formatAst(dualAst(parseAst("A + B'C", 3)), 3)).toBe("A(B' + C)");
  });

  it('dual của dual là chính nó', () => {
    for (const [e, n] of [["A + B'C", 3], ['A(B + C)', 3], ["A'BC' + A'B'C", 3]]) {
      const a = parseAst(e, n);
      expect(formatAst(dualAst(dualAst(a)), n), e).toBe(formatAst(a, n));
    }
  });

  it('đổi hằng 0 ↔ 1', () => {
    expect(formatAst(dualAst(parseAst('0', 2)), 2)).toBe('1');
    expect(formatAst(dualAst(parseAst('1', 2)), 2)).toBe('0');
  });
});

describe('pushNot (DeMorgan)', () => {
  it('(x + y)′ = x′y′ và (xy)′ = x′ + y′', () => {
    expect(formatAst(pushNot(parseAst('A + B', 2)), 2)).toBe("A'B'");
    expect(formatAst(pushNot(parseAst('AB', 2)), 2)).toBe("A' + B'");
  });

  it('kết quả đúng bằng phủ định của hàm gốc', () => {
    for (const [e, n] of [["A + B'C", 3], ["A'BC' + A'B'C + AC", 3], ['A(B + C)', 3]]) {
      const f = exprTruthTable(e, n);
      const g = tt(pushNot(parseAst(e, n)), n);
      expect(g, e).toEqual(f.map(v => v ^ 1));
    }
  });
});

describe('complementLiteralsAst', () => {
  it('chỉ đổi literal, không đụng cấu trúc + / ·', () => {
    expect(formatAst(complementLiteralsAst(parseAst("A + B'C", 3)), 3)).toBe("A' + BC'");
  });
});
