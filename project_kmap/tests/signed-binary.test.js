import { describe, it, expect } from 'vitest';
import {
  FORMATS, range, encode, decode, addTwos, subTwos, compareFormats,
} from '../src/logic/signed-binary.js';

/* Ví dụ §1.6 trong sách/slide. */

describe('range', () => {
  it("2's complement lệch khoảng so với hai dạng kia", () => {
    expect(range('twos', 8)).toEqual({ min: -128, max: 127 });
    expect(range('ones', 8)).toEqual({ min: -127, max: 127 });
    expect(range('magnitude', 8)).toEqual({ min: -127, max: 127 });
  });
});

describe('encode / decode', () => {
  it('−9 trên 8 bit theo cả ba dạng (ví dụ trong sách)', () => {
    expect(encode(-9, 'magnitude', 8)).toBe('10001001');
    expect(encode(-9, 'ones', 8)).toBe('11110110');
    expect(encode(-9, 'twos', 8)).toBe('11110111');
  });

  it('số dương giống nhau ở cả ba dạng', () => {
    for (const f of FORMATS) expect(encode(9, f, 8), f).toBe('00001001');
  });

  it('round-trip encode → decode với mọi giá trị trong khoảng', () => {
    for (const f of FORMATS) {
      const { min, max } = range(f, 6);
      for (let v = min; v <= max; v++) {
        expect(decode(encode(v, f, 6), f), `${f} ${v}`).toBe(v);
      }
    }
  });

  it('có hai cách viết số 0 ở magnitude và ones (+0 và −0)', () => {
    expect(decode('10000000', 'magnitude')).toBe(0);
    expect(decode('11111111', 'ones')).toBe(0);
    expect(decode('00000000', 'twos')).toBe(0);
  });

  it("chỉ 2's complement biểu diễn được −128 trên 8 bit", () => {
    expect(encode(-128, 'twos', 8)).toBe('10000000');
    expect(() => encode(-128, 'ones', 8)).toThrow();
    expect(() => encode(-128, 'magnitude', 8)).toThrow();
  });

  it('vượt khoảng, không nguyên, hoặc bit sai thì throw', () => {
    expect(() => encode(128, 'twos', 8)).toThrow();
    expect(() => encode(1.5, 'twos', 8)).toThrow();
    expect(() => encode(1, 'xx', 8)).toThrow();
    expect(() => decode('102', 'twos')).toThrow();
    expect(() => decode('1010', 'xx')).toThrow();
  });

  it('compareFormats đánh dấu null khi không biểu diễn được', () => {
    const r = compareFormats(-128, 8);
    expect(r.find(x => x.format === 'twos').bits).toBe('10000000');
    expect(r.find(x => x.format === 'ones').bits).toBeNull();
  });
});

/* --- §1.6: cộng/trừ 2's complement và phát hiện tràn số --- */
describe('addTwos', () => {
  it('6 + 13 = 19, không tràn', () => {
    const r = addTwos('00000110', '00001101');
    expect(r.bits).toBe('00010011');
    expect(r.value).toBe(19);
    expect(r.overflow).toBe(false);
  });

  it('−6 + 13 = 7 (nhớ ra ngoài bị bỏ, không phải tràn)', () => {
    const r = addTwos(encode(-6, 'twos', 8), encode(13, 'twos', 8));
    expect(r.value).toBe(7);
    expect(r.carryOut).toBe(1);
    expect(r.overflow).toBe(false);
  });

  it('120 + 66 tràn số (hai số dương ra kết quả âm)', () => {
    const r = addTwos('01111000', '01000010');
    expect(r.overflow).toBe(true);
    expect(r.value).toBe(-70);
  });

  it('−123 + (−66) tràn số (hai số âm ra kết quả dương)', () => {
    const r = addTwos(encode(-123, 'twos', 8), encode(-66, 'twos', 8));
    expect(r.overflow).toBe(true);
    expect(r.value).toBeGreaterThan(0);
  });

  it('hai số khác dấu thì không bao giờ tràn', () => {
    for (let a = -8; a < 8; a++) {
      for (let b = -8; b < 8; b++) {
        if ((a < 0) === (b < 0)) continue;
        const r = addTwos(encode(a, 'twos', 5), encode(b, 'twos', 5));
        expect(r.overflow, `${a} + ${b}`).toBe(false);
        expect(r.value).toBe(a + b);
      }
    }
  });

  it('không tràn thì kết quả luôn đúng, mọi cặp 5 bit', () => {
    for (let a = -16; a < 16; a++) {
      for (let b = -16; b < 16; b++) {
        const r = addTwos(encode(a, 'twos', 5), encode(b, 'twos', 5));
        const exact = a + b;
        if (exact >= -16 && exact <= 15) {
          expect(r.overflow, `${a}+${b}`).toBe(false);
          expect(r.value, `${a}+${b}`).toBe(exact);
        } else {
          expect(r.overflow, `${a}+${b} phải tràn`).toBe(true);
        }
      }
    }
  });

  it('khác số bit thì throw', () => {
    expect(() => addTwos('0101', '01')).toThrow();
  });
});

describe('subTwos', () => {
  it('9 − 13 = −4', () => {
    const r = subTwos('00001001', '00001101');
    expect(r.value).toBe(-4);
    expect(r.overflow).toBe(false);
  });

  it('đúng với mọi cặp không tràn (5 bit)', () => {
    for (let a = -15; a < 16; a++) {
      for (let b = -15; b < 16; b++) {
        const exact = a - b;
        if (exact < -16 || exact > 15) continue;
        const r = subTwos(encode(a, 'twos', 5), encode(b, 'twos', 5));
        expect(r.value, `${a}-${b}`).toBe(exact);
      }
    }
  });
});
