import { describe, it, expect } from 'vitest';
import {
  parseAst, evalAst, formatAst, dualAst, complementLiteralsAst, pushNot,
} from '../src/logic/bool-ast.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';

const tt = (ast, n) => [...Array(1 << n).keys()].map(m => evalAst(ast, m, n));
const fmt = (s, n) => formatAst(parseAst(s, n), n);

describe('parseAst / evalAst', () => {
  it('cho cùng bảng chân trị với parser sẵn có (expr-parser.js)', () => {
    const cases = [["x'y + xy'", 2], ["(x + y)(x' + y')", 2], ['!z', 1],
      ["x + y'z", 3], ["x'yz' + x'y'z + xz", 3], ['0', 2], ['1', 2], ["z''", 1]];
    for (const [e, n] of cases) {
      expect(tt(parseAst(e, n), n), e).toEqual(exprTruthTable(e, n));
    }
  });

  it('A là MSB', () => {
    expect(tt(parseAst('x', 2), 2)).toEqual([0, 0, 1, 1]);
    expect(tt(parseAst('y', 2), 2)).toEqual([0, 1, 0, 1]);
  });

  it('cú pháp sai thì throw', () => {
    expect(() => parseAst("x' +", 2)).toThrow();
    expect(() => parseAst('(x', 2)).toThrow();
    expect(() => parseAst('q', 2)).toThrow();
  });
});

describe('formatAst', () => {
  it('round-trip giữ nguyên cách viết chuẩn', () => {
    expect(fmt("x + y'z", 3)).toBe("x + y'z");
    expect(fmt("x'yz' + x'y'z", 3)).toBe("x'yz' + x'y'z");
    expect(fmt("(x+y)(x'+y')", 2)).toBe("(x + y)(x' + y')");
  });

  it('chỉ thêm ngoặc khi cần (OR nằm trong AND)', () => {
    expect(fmt('x(y + z)', 3)).toBe('x(y + z)');
    expect(fmt('x + yz', 3)).toBe('x + yz');       // không cần ngoặc quanh BC
  });

  it('in lại rồi parse lại cho cùng bảng chân trị', () => {
    for (const [e, n] of [["x + y'z", 3], ['x(y + z)', 3], ["(x+y)(x'+y')", 2]]) {
      expect(exprTruthTable(fmt(e, n), n), e).toEqual(exprTruthTable(e, n));
    }
  });
});

describe('dualAst', () => {
  it('đổi AND ngầm thành OR đúng ưu tiên', () => {
    // sai nếu làm trên chuỗi ký tự: B'C phải thành (B' + C)
    expect(formatAst(dualAst(parseAst("x + y'z", 3)), 3)).toBe("x(y' + z)");
  });

  it('dual của dual là chính nó', () => {
    for (const [e, n] of [["x + y'z", 3], ['x(y + z)', 3], ["x'yz' + x'y'z", 3]]) {
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
    expect(formatAst(pushNot(parseAst('x + y', 2)), 2)).toBe("x'y'");
    expect(formatAst(pushNot(parseAst('xy', 2)), 2)).toBe("x' + y'");
  });

  it('kết quả đúng bằng phủ định của hàm gốc', () => {
    for (const [e, n] of [["x + y'z", 3], ["x'yz' + x'y'z + xz", 3], ['x(y + z)', 3]]) {
      const f = exprTruthTable(e, n);
      const g = tt(pushNot(parseAst(e, n)), n);
      expect(g, e).toEqual(f.map(v => v ^ 1));
    }
  });
});

describe('complementLiteralsAst', () => {
  it('chỉ đổi literal, không đụng cấu trúc + / ·', () => {
    expect(formatAst(complementLiteralsAst(parseAst("x + y'z", 3)), 3)).toBe("x' + yz'");
  });
});
