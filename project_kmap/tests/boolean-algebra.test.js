import { describe, it, expect } from 'vitest';
import {
  THEOREMS, theorem, checkDerivation, equivalent, dual, normalize, cost, usedVars,
} from '../src/logic/boolean-algebra.js';
import { DERIVATIONS, derivation } from '../src/logic/boolean-examples.js';

describe('bảng định lý', () => {
  it('mọi định lý đều có id, tên và phát biểu', () => {
    expect(THEOREMS.length).toBeGreaterThan(15);
    expect(THEOREMS.every(t => t.id && t.name && t.law)).toBe(true);
  });

  it('id không trùng nhau', () => {
    expect(new Set(THEOREMS.map(t => t.id)).size).toBe(THEOREMS.length);
  });

  it('tra được theo id, id lạ thì throw', () => {
    expect(theorem('T6a').law).toBe('x + xy = x');
    expect(() => theorem('XX')).toThrow();
  });
});

describe('equivalent / dual / normalize', () => {
  it('nhận ra hai biểu thức tương đương', () => {
    expect(equivalent("A + A'B", 'A + B', 3)).toBe(true);
    expect(equivalent("A(A' + B)", 'AB', 3)).toBe(true);
    expect(equivalent('A + B', 'AB', 2)).toBe(false);
  });

  it('dual xử lý đúng AND viết liền', () => {
    expect(dual("A + B'C", 3)).toBe("A(B' + C)");
    expect(dual('A(B + C)', 3)).toBe('A + BC');
  });

  it('normalize chuẩn hoá khoảng trắng và dấu nhân', () => {
    expect(normalize("A·B  +  C", 3)).toBe('AB + C');
  });

  it('usedVars liệt kê biến thực sự xuất hiện', () => {
    expect(usedVars("A + B'C", 4)).toEqual(['A', 'B', 'C']);
    expect(usedVars('D', 4)).toEqual(['D']);
  });

  it('cost đếm term/literal, trả null khi có ngoặc', () => {
    expect(cost("A'B + BD' + C", 4)).toEqual({ terms: 3, literals: 5 });
    expect(cost('(A + B)C', 4)).toBeNull();
  });
});

/* --- Example 2.1: mọi bước rút gọn phải giữ nguyên bảng chân trị --- */
describe('checkDerivation (Example 2.1)', () => {
  for (const d of DERIVATIONS) {
    it(`${d.id} — ${d.title}`, () => {
      const r = checkDerivation(d.from, d.steps, d.n);
      expect(r.errors).toEqual([]);
      expect(r.ok).toBe(true);
      expect(r.steps.length).toBe(d.steps.length);
      // mỗi bước phải nêu được định lý
      expect(r.steps.every(s => s.law && s.name)).toBe(true);
    });
  }

  it('kết quả cuối khớp với phát biểu của định lý', () => {
    expect(checkDerivation("A(A' + B)", derivation('2.1a').steps, 3).to).toBe('AB');
    expect(checkDerivation("A + A'B", derivation('2.1b').steps, 3).to).toBe('A + B');
    expect(checkDerivation("(A + B)(A + B')", derivation('2.1c').steps, 3).to).toBe('A');
    expect(checkDerivation("AB + A'C + BC", derivation('2.1d').steps, 3).to).toBe("AB + A'C");
  });

  it('rút gọn xong thì số literal giảm', () => {
    const r = checkDerivation("AB + A'C + BC", derivation('2.1d').steps, 3);
    expect(r.statsFrom.literals).toBe(6);
    expect(r.statsTo.literals).toBe(4);
    expect(r.statsTo.terms).toBeLessThan(r.statsFrom.terms);
  });

  it('bắt được một bước sai (không tương đương)', () => {
    const r = checkDerivation("A + A'B", [{ expr: 'AB', by: 'P4b' }], 3);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('không tương đương');
  });

  it('bắt được một bước sai cú pháp', () => {
    const r = checkDerivation('A + B', [{ expr: 'A +', by: 'P2a' }], 2);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('không đọc được');
  });

  it('định lý lạ thì throw', () => {
    expect(() => checkDerivation('A', [{ expr: 'A', by: 'ZZ' }], 2)).toThrow();
  });
});
