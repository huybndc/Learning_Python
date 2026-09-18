import { describe, it, expect } from 'vitest';
import {
  GROUPS, evalFunction, truthRows, classify, allFunctions, functionAt,
  STANDARD_GATES, evalAllGates, ASSOCIATIVE,
  nandN, norN, xorN, nandAssociativityTable, norAssociativityTable,
} from '../src/logic/logic-gates.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';

/* §2.7–2.8: 16 hàm hai biến và 8 cổng chuẩn. */

describe('đánh số 16 hàm', () => {
  it('bits của Fᵢ đúng bằng biểu diễn nhị phân 4 bit của i', () => {
    allFunctions().forEach(f => {
      expect(f.bits, 'F' + f.i).toBe(f.i.toString(2).padStart(4, '0'));
    });
  });

  it('các hàm quen thuộc đúng số hiệu như trong sách', () => {
    expect(functionAt(1).gate).toBe('AND');
    expect(functionAt(7).gate).toBe('OR');
    expect(functionAt(6).gate).toBe('XOR');
    expect(functionAt(8).gate).toBe('NOR');
    expect(functionAt(9).gate).toBe('XNOR');
    expect(functionAt(14).gate).toBe('NAND');
  });

  it('AND đúng bảng chân trị 0001, OR là 0111, NAND là 1110', () => {
    expect(functionAt(1).bits).toBe('0001');
    expect(functionAt(7).bits).toBe('0111');
    expect(functionAt(14).bits).toBe('1110');
  });

  it('truthRows theo đúng thứ tự xy = 00, 01, 10, 11', () => {
    expect(truthRows(1).map(r => [r.x, r.y])).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]]);
  });

  it('16 hàm đôi một khác nhau', () => {
    expect(new Set(allFunctions().map(f => f.bits)).size).toBe(16);
  });

  it('chỉ số ngoài 0..15 thì throw', () => {
    expect(() => evalFunction(16, 0, 0)).toThrow();
    expect(() => evalFunction(-1, 0, 0)).toThrow();
    expect(() => functionAt(99)).toThrow();
  });
});

/* Biểu thức đại số ghi trong bảng phải khớp với bảng chân trị sinh ra. */
describe('biểu thức đại số khớp bảng chân trị', () => {
  it('mọi Fᵢ: expr (đổi x→A, y→B) cho đúng bits', () => {
    for (const f of allFunctions()) {
      const expr = f.expr.replace(/x/g, 'A').replace(/y/g, 'B');
      const tt = exprTruthTable(expr, 2);          // m = 0..3 tương ứng AB = 00..11
      expect(tt.join(''), 'F' + f.i + ' = ' + f.expr).toBe(f.bits);
    }
  });
});

describe('classify', () => {
  it('F0 và F15 là hằng', () => {
    expect(classify(0)).toBe('constant');
    expect(classify(15)).toBe('constant');
  });

  it('transfer và complement là hàm một biến', () => {
    for (const i of [3, 5, 10, 12]) expect(classify(i), 'F' + i).toBe('unary');
  });

  it('còn lại là toán tử hai ngôi', () => {
    for (const i of [1, 2, 4, 6, 7, 8, 9, 11, 13, 14]) expect(classify(i), 'F' + i).toBe('binary');
  });

  it('đủ 3 nhóm với số lượng 2 / 4 / 10', () => {
    const count = {};
    allFunctions().forEach(f => { count[f.group] = (count[f.group] || 0) + 1; });
    expect(count).toEqual({ constant: 2, unary: 4, binary: 10 });
    expect(Object.keys(GROUPS).sort()).toEqual(['binary', 'constant', 'unary']);
  });
});

describe('8 cổng chuẩn', () => {
  it('đủ 8 cổng, mỗi cổng trỏ tới một Fᵢ hợp lệ', () => {
    expect(STANDARD_GATES.length).toBe(8);
    STANDARD_GATES.forEach(g => {
      expect(g.fi).toBeGreaterThanOrEqual(0);
      expect(g.fi).toBeLessThanOrEqual(15);
      expect(g.note.length).toBeGreaterThan(5);
    });
  });

  it('evalAllGates đúng ở cả 4 cặp (x, y)', () => {
    const got = {};
    for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1; y++) {
      evalAllGates(x, y).forEach(g => {
        got[g.gate] = (got[g.gate] || '') + g.value;
      });
    }
    expect(got.AND).toBe('0001');
    expect(got.OR).toBe('0111');
    expect(got.NAND).toBe('1110');
    expect(got.NOR).toBe('1000');
    expect(got.XOR).toBe('0110');
    expect(got.XNOR).toBe('1001');
    expect(got.NOT).toBe('1100');       // x′
    expect(got.Buffer).toBe('0011');    // x
  });
});

/* --- Mở rộng nhiều ngõ vào: NAND/NOR KHÔNG kết hợp --- */
describe('mở rộng nhiều ngõ vào', () => {
  it('NAND không có tính kết hợp', () => {
    const t = nandAssociativityTable();
    expect(t.associative).toBe(false);
    expect(t.rows.length).toBe(8);
    expect(t.rows.some(r => !r.same)).toBe(true);
  });

  it('NOR không có tính kết hợp', () => {
    expect(norAssociativityTable().associative).toBe(false);
  });

  it('bảng ASSOCIATIVE khớp với kết quả tính được', () => {
    expect(ASSOCIATIVE.NAND).toBe(nandAssociativityTable().associative);
    expect(ASSOCIATIVE.NOR).toBe(norAssociativityTable().associative);
    expect(ASSOCIATIVE.AND).toBe(true);
    expect(ASSOCIATIVE.OR).toBe(true);
    expect(ASSOCIATIVE.XOR).toBe(true);
  });

  it('NAND 3 ngõ vào định nghĩa đúng là (xyz)′, khác cả hai cách ghép đôi', () => {
    const t = nandAssociativityTable();
    expect(t.rows.map(r => r.proper).join('')).toBe('11111110');
    expect(t.rows.some(r => r.proper !== r.left)).toBe(true);
    expect(t.rows.some(r => r.proper !== r.right)).toBe(true);
  });

  it('NOR 3 ngõ vào định nghĩa đúng là (x + y + z)′', () => {
    expect(norAssociativityTable().rows.map(r => r.proper).join('')).toBe('10000000');
  });

  it('XOR nhiều ngõ vào là hàm lẻ (odd function)', () => {
    expect(xorN([1, 1, 1])).toBe(1);
    expect(xorN([1, 1, 0])).toBe(0);
    expect(xorN([1, 0, 0, 1, 1])).toBe(1);
    expect(xorN([])).toBe(0);
  });

  it('nandN / norN đúng định nghĩa với số ngõ vào bất kỳ', () => {
    expect(nandN([1, 1, 1, 1])).toBe(0);
    expect(nandN([1, 1, 0, 1])).toBe(1);
    expect(norN([0, 0, 0])).toBe(1);
    expect(norN([0, 1, 0])).toBe(0);
  });
});
