import { describe, it, expect } from 'vitest';
import {
  digitValue, splitNumber, toDecimal, intToBaseSteps, fracToBaseSteps,
  fromDecimal, convertBase, binaryToGrouped, groupedToBinary,
} from '../src/logic/number-systems.js';

describe('digitValue / splitNumber', () => {
  it('đọc đúng giá trị chữ số theo cơ số', () => {
    expect(digitValue('7', 8)).toBe(7);
    expect(digitValue('F', 16)).toBe(15);
    expect(digitValue('f', 16)).toBe(15);     // chấp nhận chữ thường
  });

  it('chữ số vượt cơ số thì throw', () => {
    expect(() => digitValue('8', 8)).toThrow();
    expect(() => digitValue('2', 2)).toThrow();
    expect(() => digitValue('G', 16)).toThrow();
  });

  it('tách đúng phần nguyên và phần lẻ', () => {
    expect(splitNumber('1011')).toEqual({ intPart: '1011', fracPart: '' });
    expect(splitNumber('41.6875')).toEqual({ intPart: '41', fracPart: '6875' });
    expect(splitNumber('.101')).toEqual({ intPart: '', fracPart: '101' });
  });

  it('nhiều hơn một dấu chấm thì throw', () => {
    expect(() => splitNumber('1.2.3')).toThrow();
  });
});

/* --- Example 1.1: 41 = 101001 (chia lấy dư) --- */
describe('intToBaseSteps (Example 1.1–1.2)', () => {
  it('41 → nhị phân là 101001, đủ 6 bước chia', () => {
    const r = intToBaseSteps(41, 2);
    expect(r.digits).toBe('101001');
    expect(r.steps.length).toBe(6);
    expect(r.steps[0]).toEqual({ value: 41, quotient: 20, remainder: 1, digit: '1' });
    expect(r.steps.at(-1)).toEqual({ value: 1, quotient: 0, remainder: 1, digit: '1' });
  });

  it('đọc dư từ dưới lên đúng bằng kết quả', () => {
    const r = intToBaseSteps(153, 8);
    expect(r.digits).toBe('231');
    expect(r.steps.map(s => s.digit).reverse().join('')).toBe(r.digits);
  });

  it('0 ra "0"', () => {
    expect(intToBaseSteps(0, 2).digits).toBe('0');
  });

  it('số âm hoặc không nguyên thì throw', () => {
    expect(() => intToBaseSteps(-1, 2)).toThrow();
    expect(() => intToBaseSteps(1.5, 2)).toThrow();
    expect(() => intToBaseSteps(10, 20)).toThrow();
  });
});

/* --- Example 1.3: 0.6875 = 0.1011 (nhân lấy phần nguyên) --- */
describe('fracToBaseSteps (Example 1.3)', () => {
  it('0.6875 → nhị phân là 1011, dừng đúng lúc (exact)', () => {
    const r = fracToBaseSteps(0.6875, 2);
    expect(r.digits).toBe('1011');
    expect(r.exact).toBe(true);
    expect(r.steps.length).toBe(4);
    expect(r.steps[0].product).toBeCloseTo(1.375, 10);
  });

  it('phần lẻ vô hạn thì cắt đúng maxSteps và exact = false', () => {
    const r = fracToBaseSteps(0.1, 2, 8);
    expect(r.digits.length).toBe(8);
    expect(r.exact).toBe(false);
  });

  it('0 ra chuỗi rỗng', () => {
    expect(fracToBaseSteps(0, 2).digits).toBe('');
  });

  it('phần lẻ ngoài [0,1) thì throw', () => {
    expect(() => fracToBaseSteps(1, 2)).toThrow();
    expect(() => fracToBaseSteps(-0.5, 2)).toThrow();
  });
});

describe('toDecimal / fromDecimal', () => {
  it('đọc đúng giá trị theo trọng số cơ số', () => {
    expect(toDecimal('101001', 2)).toBe(41);
    expect(toDecimal('0.1011', 2)).toBe(0.6875);
    expect(toDecimal('41.6875', 10)).toBe(41.6875);
    expect(toDecimal('FF', 16)).toBe(255);
    expect(toDecimal('630', 8)).toBe(408);
  });

  it('chuỗi rỗng hoặc cơ số ngoài 2..16 thì throw', () => {
    expect(() => toDecimal('', 2)).toThrow();
    expect(() => toDecimal('10', 17)).toThrow();
    expect(() => toDecimal('10', 1)).toThrow();
  });

  it('fromDecimal ghép đúng phần nguyên và phần lẻ', () => {
    expect(fromDecimal(41.6875, 2)).toBe('101001.1011');
    expect(fromDecimal(41, 2)).toBe('101001');
    expect(fromDecimal(255, 16)).toBe('FF');
  });
});

describe('convertBase', () => {
  it('đổi trực tiếp giữa các cơ số', () => {
    expect(convertBase('41.6875', 10, 2)).toBe('101001.1011');
    expect(convertBase('101001.1011', 2, 10)).toBe('41.6875');
    expect(convertBase('FF', 16, 2)).toBe('11111111');
    expect(convertBase('777', 8, 16)).toBe('1FF');
  });

  it('round-trip qua nhiều cơ số cho số nguyên', () => {
    for (let v = 0; v < 300; v++) {
      for (const r of [2, 3, 5, 8, 10, 16]) {
        const s = convertBase(String(v), 10, r);
        expect(convertBase(s, r, 10), `v=${v}, r=${r}`).toBe(String(v));
      }
    }
  });

  it('round-trip số có phần lẻ hữu hạn ở cơ số 2', () => {
    for (const s of ['0.5', '0.25', '0.6875', '13.375', '1.03125']) {
      const b = convertBase(s, 10, 2);
      expect(convertBase(b, 2, 10), s).toBe(s);
    }
  });
});

/* --- §1.4: gộp nhóm bit, không đi qua thập phân --- */
describe('binaryToGrouped / groupedToBinary (§1.4)', () => {
  it('nhị phân → bát phân gộp 3 bit (ví dụ trong sách)', () => {
    expect(binaryToGrouped('10110001101011.111100000110', 3).digits).toBe('26153.7406');
  });

  it('nhị phân → thập lục phân gộp 4 bit (ví dụ trong sách)', () => {
    expect(binaryToGrouped('10110001101011.11110010', 4).digits).toBe('2C6B.F2');
  });

  it('đệm 0 bên trái phần nguyên, bên phải phần lẻ', () => {
    const r = binaryToGrouped('1.1', 4);
    expect(r.groups.int[0].bits).toBe('0001');
    expect(r.groups.frac[0].bits).toBe('1000');
    expect(r.digits).toBe('1.8');
  });

  it('bát/thập lục phân → nhị phân bằng cách bung từng chữ số', () => {
    // digits đã chuẩn hoá (bỏ 0 thừa hai đầu) để round-trip khớp;
    // groups vẫn giữ nguyên từng nhóm đầy đủ để hiển thị từng bước.
    const r = groupedToBinary('673.124', 3);
    expect(r.groups.int.map(g => g.bits)).toEqual(['110', '111', '011']);
    expect(r.groups.frac.map(g => g.bits)).toEqual(['001', '010', '100']);
    expect(r.digits).toBe('110111011.0010101');
    expect(groupedToBinary('306.D', 4).digits).toBe('1100000110.1101');
  });

  it('round-trip nhị phân ↔ hex ↔ nhị phân', () => {
    for (const b of ['1011', '11111111', '10110001101011.1111']) {
      const h = binaryToGrouped(b, 4).digits;
      expect(groupedToBinary(h, 4).digits, b).toBe(b);
    }
  });

  it('nhóm sai kích thước hoặc bit không hợp lệ thì throw', () => {
    expect(() => binaryToGrouped('101', 5)).toThrow();
    expect(() => binaryToGrouped('102', 4)).toThrow();
    expect(() => groupedToBinary('8', 3)).toThrow();   // 8 không hợp lệ ở octal
  });
});
