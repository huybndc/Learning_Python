import { describe, it, expect } from 'vitest';
import {
  diminishedComplement, radixComplement, subtractByComplement,
  subtractValue, complementResultValue,
} from '../src/logic/complements.js';
import { toDecimal } from '../src/logic/number-systems.js';

/* Ví dụ §1.5 trong sách/slide. */

describe("diminished radix complement (r−1)'s", () => {
  it("1's complement (ví dụ trong sách)", () => {
    expect(diminishedComplement('1011000', 2).digits).toBe('0100111');
    expect(diminishedComplement('0101101', 2).digits).toBe('1010010');
  });

  it("9's complement (ví dụ trong sách)", () => {
    expect(diminishedComplement('546700', 10).digits).toBe('453299');
    expect(diminishedComplement('012398', 10).digits).toBe('987601');
  });

  it('giữ nguyên số chữ số, kể cả số 0 ở đầu', () => {
    expect(diminishedComplement('0011', 2).digits).toHaveLength(4);
  });

  it('bù hai lần ra chính nó', () => {
    for (const [s, r] of [['1011000', 2], ['546700', 10], ['2C', 16]]) {
      const once = diminishedComplement(s, r).digits;
      expect(diminishedComplement(once, r).digits, s).toBe(s);
    }
  });

  it('chữ số không hợp lệ hoặc chuỗi rỗng thì throw', () => {
    expect(() => diminishedComplement('102', 2)).toThrow();
    expect(() => diminishedComplement('', 2)).toThrow();
  });
});

describe("radix complement r's", () => {
  it("10's complement (ví dụ trong sách)", () => {
    expect(radixComplement('012398', 10).digits).toBe('987602');
    expect(radixComplement('246700', 10).digits).toBe('753300');
  });

  it("2's complement (ví dụ trong sách)", () => {
    expect(radixComplement('1101100', 2).digits).toBe('0010100');
    expect(radixComplement('0110111', 2).digits).toBe('1001001');
  });

  it("đúng bằng (r−1)'s complement cộng 1", () => {
    const r = radixComplement('1011000', 2);
    expect(r.diminished).toBe('0100111');
    expect(r.digits).toBe('0101000');
  });

  it('số toàn 0 thì r\'s complement vẫn là 0 (có nhớ tràn ra ngoài)', () => {
    const r = radixComplement('000', 10);
    expect(r.digits).toBe('000');
    expect(r.carryOut).toBe(1);
  });

  it('M + comp(M) = 0 (mod r^n) với mọi M', () => {
    for (let v = 0; v < 64; v++) {
      const s = v.toString(2).padStart(6, '0');
      const c = radixComplement(s, 2).digits;
      expect((toDecimal(s, 2) + toDecimal(c, 2)) % 64, s).toBe(0);
    }
  });
});

/* --- §1.5.3: trừ bằng complement --- */
describe('subtractByComplement', () => {
  it('72532 − 3250 = 69282 (kết quả dương, có nhớ ra ngoài)', () => {
    const r = subtractByComplement('72532', '3250', 10);
    expect(r.digits).toBe('69282');
    expect(r.negative).toBe(false);
    expect(r.endCarry).toBe(true);
  });

  it('3250 − 72532 = −69282 (kết quả âm, không có nhớ)', () => {
    const r = subtractByComplement('3250', '72532', 10);
    expect(r.digits).toBe('69282');
    expect(r.negative).toBe(true);
    expect(r.endCarry).toBe(false);
  });

  it('1010100 − 1000011 = 0010001 (nhị phân)', () => {
    const r = subtractByComplement('1010100', '1000011', 2);
    expect(r.digits).toBe('0010001');
    expect(r.negative).toBe(false);
  });

  it('1000011 − 1010100 = −0010001 (chiều ngược lại)', () => {
    const r = subtractByComplement('1000011', '1010100', 2);
    expect(r.digits).toBe('0010001');
    expect(r.negative).toBe(true);
  });

  it('có đủ các bước giải thích', () => {
    const r = subtractByComplement('72532', '3250', 10);
    expect(r.steps.length).toBe(4);
    expect(r.steps.every(s => s.labelKey && s.value)).toBe(true);
  });

  it('kết quả luôn khớp với phép trừ thập phân, mọi cặp 6 bit', () => {
    for (let a = 0; a < 64; a += 3) {
      for (let b = 0; b < 64; b += 5) {
        const A = a.toString(2).padStart(6, '0');
        const B = b.toString(2).padStart(6, '0');
        const r = subtractByComplement(A, B, 2);
        expect(complementResultValue(r, 2), `${a} - ${b}`).toBe(subtractValue(A, B, 2));
      }
    }
  });

  it('khớp cả ở cơ số 10 và 16', () => {
    for (const [a, b, r] of [['500', '123', 10], ['123', '500', 10], ['FF', '1A', 16], ['1A', 'FF', 16]]) {
      const res = subtractByComplement(a, b, r);
      expect(complementResultValue(res, r), `${a}-${b} base ${r}`).toBe(subtractValue(a, b, r));
    }
  });

  it("trừ 0 (ca riêng: r's complement của 0 là 0 kèm nhớ tràn ra ngoài)", () => {
    const r = subtractByComplement('000011', '000000', 2);
    expect(r.negative).toBe(false);
    expect(r.endCarry).toBe(true);
    expect(complementResultValue(r, 2)).toBe(3);
    expect(complementResultValue(subtractByComplement('000000', '000011', 2), 2)).toBe(-3);
  });

  it('hai số bằng nhau cho 0', () => {
    const r = subtractByComplement('1010', '1010', 2);
    expect(complementResultValue(r, 2)).toBe(0);
  });
});
