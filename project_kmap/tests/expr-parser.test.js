import { describe, it, expect } from 'vitest';
import {
  parseBoolExpr, exprTruthTable, sopStats, parseSpec, formatSpec,
} from '../src/logic/expr-parser.js';
import { minimizeSOP, minimizePOS } from '../src/logic/quine-mccluskey.js';
import { randomFunction, mulberry32 } from './helpers/eval-cover.js';

/* Chuyển từ khối T5 của runTests() trong bản HTML gốc,
   cộng phần đối chiếu chuỗi biểu thức của T3 (cần parser nên hoãn tới đây). */

/* --- T5: spec Σm / ΠM / d --- */
describe('parseSpec / formatSpec (T5)', () => {
  it('round-trip Σm + d', () => {
    expect(formatSpec(parseSpec('Σm(1,3,5,7) + d(0,2)', 3))).toBe('Σm(1,3,5,7) + d(0,2)');
  });

  it('round-trip khi không có don\'t care', () => {
    expect(formatSpec(parseSpec('m(0,1)', 2))).toBe('Σm(0,1)');
  });

  it('ΠM: các maxterm = 0, còn lại = 1', () => {
    const v = parseSpec('ΠM(0,2,4)', 3);
    expect([0, 2, 4].every(m => v[m] === 0)).toBe(true);
    expect([1, 3, 5, 6, 7].every(m => v[m] === 1)).toBe(true);
  });

  it('chấp nhận nhiều kiểu dấu phân cách', () => {
    expect(parseSpec('m(1 3; 5)', 3)).toEqual(parseSpec('m(1,3,5)', 3));
  });

  it('minterm vượt phạm vi thì throw', () => {
    expect(() => parseSpec('m(99)', 3)).toThrow();
    expect(() => parseSpec('m(-1)', 3)).toThrow();
  });

  it('không có m(...) lẫn M(...) thì throw', () => {
    expect(() => parseSpec('abc', 3)).toThrow();
  });

  it('dùng cả m(...) và M(...) thì throw', () => {
    expect(() => parseSpec('m(1) M(2)', 3)).toThrow();
  });

  it('d(...) ghi đè thành don\'t care', () => {
    const v = parseSpec('m(1,2) + d(2)', 2);
    expect(v[1]).toBe(1);
    expect(v[2]).toBe(2);
  });
});

/* --- T5: biểu thức Boolean --- */
describe('exprTruthTable / parseBoolExpr (T5)', () => {
  it("A'B + AB' là XOR 2 biến", () => {
    expect(exprTruthTable("x'y + xy'", 2).join('')).toBe('0110');
  });

  it('đọc được ngoặc', () => {
    expect(exprTruthTable("(x + y)(x' + y')", 2).join('')).toBe('0110');
  });

  it('đọc được !A', () => {
    expect(exprTruthTable('!z', 1).join('')).toBe('10');
  });

  it('hằng 0 và hằng 1', () => {
    expect(exprTruthTable('0', 2).join('')).toBe('0000');
    expect(exprTruthTable('1', 2).join('')).toBe('1111');
  });

  it('A là MSB', () => {
    expect(exprTruthTable('x', 2).join('')).toBe('0011');
    expect(exprTruthTable('y', 2).join('')).toBe('0101');
  });

  it('phủ định hai lần triệt tiêu nhau', () => {
    expect(exprTruthTable("z''", 1).join('')).toBe(exprTruthTable('z', 1).join(''));
    expect(exprTruthTable('!!z', 1).join('')).toBe(exprTruthTable('z', 1).join(''));
  });

  it('chấp nhận ký hiệu thay thế (· * ∧ | ∨ ¬) và chữ thường', () => {
    expect(exprTruthTable('x·y', 2).join('')).toBe(exprTruthTable('xy', 2).join(''));
    expect(exprTruthTable('x|y', 2).join('')).toBe(exprTruthTable('x + y', 2).join(''));
    expect(exprTruthTable('¬z', 1).join('')).toBe('10');
  });

  it('biểu thức sai cú pháp thì throw', () => {
    expect(() => exprTruthTable("x' +", 2)).toThrow();
    expect(() => exprTruthTable('(x', 2)).toThrow();
    expect(() => exprTruthTable('x)', 2)).toThrow();
    expect(() => exprTruthTable('q', 2)).toThrow();   // biến ngoài phạm vi n
    expect(() => exprTruthTable('', 2)).toThrow();
  });

  it('parseBoolExpr trả về hàm dùng lại được', () => {
    const f = parseBoolExpr("x'y", 2);
    expect([0, 1, 2, 3].map(m => (f(m) ? 1 : 0))).toEqual([0, 1, 0, 0]);
  });
});

/* --- T5: sopStats --- */
describe('sopStats (T5)', () => {
  it('đếm đúng số term và literal', () => {
    expect(sopStats("w'x + xz' + y", 4)).toEqual({ terms: 3, literals: 5 });
  });

  it('một term đơn', () => {
    expect(sopStats('w', 4)).toEqual({ terms: 1, literals: 1 });
  });

  it('trả về null khi có ngoặc (không phải SOP phẳng)', () => {
    expect(sopStats('(w + x)y', 4)).toBeNull();
  });

  it('trả về null khi có biến ngoài phạm vi n', () => {
    expect(sopStats('wz', 2)).toBeNull();
  });
});

/* --- T3 (phần chuỗi): biểu thức sinh ra phải khớp bảng chân trị --- */
describe('T3 — chuỗi SOP/POS sinh ra khớp bảng chân trị', () => {
  for (let n = 2; n <= 4; n++) {
    it(`n = ${n}: 120 hàm ngẫu nhiên, parse lại expr đúng tại mọi ô đã định nghĩa`, () => {
      const rnd = mulberry32(0x5eed + n);          // cùng seed với quine-mccluskey.test.js
      for (let t = 0; t < 120; t++) {
        const values = randomFunction(n, rnd);
        const S = minimizeSOP(values, n);
        const P = minimizePOS(values, n);
        const ts = exprTruthTable(S.expr, n);
        const tp = exprTruthTable(P.expr, n);
        for (let m = 0; m < (1 << n); m++) {
          if (values[m] === 2) continue;
          expect(ts[m], `ca ${t}, SOP "${S.expr}" sai tại m=${m}`).toBe(values[m]);
          expect(tp[m], `ca ${t}, POS "${P.expr}" sai tại m=${m}`).toBe(values[m]);
        }
      }
    });
  }

  it('XOR 4 biến: chuỗi SOP sinh ra parse lại đúng', () => {
    const v = new Array(16);
    for (let m = 0; m < 16; m++) v[m] = [...Array(4).keys()].reduce((s, b) => s + ((m >> b) & 1), 0) % 2;
    const S = minimizeSOP(v, 4);
    expect(exprTruthTable(S.expr, 4)).toEqual(v);
  });
});
