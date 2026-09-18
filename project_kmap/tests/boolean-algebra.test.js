import { describe, it, expect } from 'vitest';
import {
  THEOREMS, theorem, checkDerivation, equivalent, dual, normalize, cost, usedVars,
} from '../src/logic/boolean-algebra.js';
import { DERIVATIONS, derivation } from '../src/logic/boolean-examples.js';

describe('bảng định lý', () => {
  it('mọi định lý đều có id, tên và phát biểu', () => {
    expect(THEOREMS.length).toBeGreaterThan(15);
    expect(THEOREMS.every(t => t.id && t.nameKey && t.law)).toBe(true);
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
    expect(equivalent("x + x'y", 'x + y', 3)).toBe(true);
    expect(equivalent("x(x' + y)", 'xy', 3)).toBe(true);
    expect(equivalent('x + y', 'xy', 2)).toBe(false);
  });

  it('dual xử lý đúng AND viết liền', () => {
    expect(dual("x + y'z", 3)).toBe("x(y' + z)");
    expect(dual('x(y + z)', 3)).toBe('x + yz');
  });

  it('normalize chuẩn hoá khoảng trắng và dấu nhân', () => {
    expect(normalize("x·y  +  z", 3)).toBe('xy + z');
  });

  it('usedVars liệt kê biến thực sự xuất hiện', () => {
    expect(usedVars("w + x'y", 4)).toEqual(['w', 'x', 'y']);
    expect(usedVars('z', 4)).toEqual(['z']);
  });

  it('cost đếm term/literal, trả null khi có ngoặc', () => {
    expect(cost("w'x + xz' + y", 4)).toEqual({ terms: 3, literals: 5 });
    expect(cost('(w + x)y', 4)).toBeNull();
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
      expect(r.steps.every(s => s.law && s.nameKey)).toBe(true);
    });
  }

  it('kết quả cuối khớp với phát biểu của định lý', () => {
    expect(checkDerivation("x(x' + y)", derivation('2.1a').steps, 3).to).toBe('xy');
    expect(checkDerivation("x + x'y", derivation('2.1b').steps, 3).to).toBe('x + y');
    expect(checkDerivation("(x + y)(x + y')", derivation('2.1c').steps, 3).to).toBe('x');
    expect(checkDerivation("xy + x'z + yz", derivation('2.1d').steps, 3).to).toBe("xy + x'z");
  });

  it('rút gọn xong thì số literal giảm', () => {
    const r = checkDerivation("xy + x'z + yz", derivation('2.1d').steps, 3);
    expect(r.statsFrom.literals).toBe(6);
    expect(r.statsTo.literals).toBe(4);
    expect(r.statsTo.terms).toBeLessThan(r.statsFrom.terms);
  });

  it('bắt được một bước sai (không tương đương)', () => {
    const r = checkDerivation("x + x'y", [{ expr: 'xy', by: 'P4b' }], 3);
    expect(r.ok).toBe(false);
    expect(r.errors[0].key).toBe('c2.stepNotEquiv');
  });

  it('bắt được một bước sai cú pháp', () => {
    const r = checkDerivation('x + y', [{ expr: 'x +', by: 'P2a' }], 2);
    expect(r.ok).toBe(false);
    expect(r.errors[0].key).toBe('c2.stepParseFail');
  });

  it('định lý lạ thì throw', () => {
    expect(() => checkDerivation('x', [{ expr: 'x', by: 'ZZ' }], 2)).toThrow();
  });
});
