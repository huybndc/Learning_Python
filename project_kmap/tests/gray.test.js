import { describe, it, expect } from 'vitest';
import {
  toBits, binToGray, grayToBin, grayList,
  binToGraySteps, grayToBinSteps, diffPositions,
} from '../src/logic/gray.js';

/* Chuyển từ khối T1 + T2 của runTests() trong bản HTML gốc. */

describe('toBits', () => {
  it('đổi số nguyên thành chuỗi n bit, MSB ở đầu', () => {
    expect(toBits(0, 4)).toBe('0000');
    expect(toBits(5, 4)).toBe('0101');
    expect(toBits(15, 4)).toBe('1111');
    expect(toBits(1, 1)).toBe('1');
  });
});

describe('diffPositions', () => {
  it('trả về vị trí các bit khác nhau', () => {
    expect(diffPositions('0000', '0000')).toEqual([]);
    expect(diffPositions('0000', '0100')).toEqual([1]);
    expect(diffPositions('0101', '1010')).toEqual([0, 1, 2, 3]);
  });
});

/* --- T1: danh sách Gray code --- */
describe('grayList (T1)', () => {
  for (let n = 1; n <= 5; n++) {
    describe(`n = ${n}`, () => {
      const L = grayList(n);

      it('đủ 2^n phần tử', () => {
        expect(L.length).toBe(1 << n);
      });

      it('không có mã trùng nhau', () => {
        expect(new Set(L).size).toBe(L.length);
      });

      it('mỗi bước đổi đúng 1 bit (kể cả vòng cuối → đầu)', () => {
        for (let i = 0; i < L.length; i++) {
          const j = (i + 1) % L.length;
          expect(diffPositions(L[i], L[j]).length, `bước ${i} → ${j}`).toBe(1);
        }
      });

      it('mỗi mã dài đúng n bit', () => {
        expect(L.every(s => s.length === n)).toBe(true);
      });
    });
  }
});

/* --- T2: Binary <-> Gray --- */
describe('binToGray / grayToBin (T2)', () => {
  for (let n = 1; n <= 5; n++) {
    describe(`n = ${n}`, () => {
      const L = grayList(n);

      it('khứ hồi bin → gray → bin đúng với mọi v', () => {
        for (let v = 0; v < (1 << n); v++) {
          const b = toBits(v, n);
          expect(grayToBin(binToGray(b)), `v=${v}`).toBe(b);
        }
      });

      it('binToGray khớp với grayList (reflect-and-prefix)', () => {
        for (let v = 0; v < (1 << n); v++) {
          expect(binToGray(toBits(v, n)), `v=${v}`).toBe(L[v]);
        }
      });

      it('binToGraySteps ghép lại ra đúng kết quả cuối', () => {
        for (let v = 0; v < (1 << n); v++) {
          const b = toBits(v, n);
          expect(binToGraySteps(b).map(s => s.r).join(''), `v=${v}`).toBe(binToGray(b));
        }
      });

      it('grayToBinSteps ghép lại ra đúng kết quả cuối', () => {
        for (let v = 0; v < (1 << n); v++) {
          const b = toBits(v, n);
          const g = binToGray(b);
          expect(grayToBinSteps(g).map(s => s.r).join(''), `v=${v}`).toBe(b);
        }
      });
    });
  }

  it('bước đầu của binToGraySteps XOR với 0', () => {
    const steps = binToGraySteps('1011');
    expect(steps[0].first).toBe(true);
    expect(steps[0].a).toBe('0');
    expect(steps.slice(1).every(s => s.first === false)).toBe(true);
  });

  it('grayToBinSteps dùng bit binary vừa tính, không phải bit gray', () => {
    // g = 1110 -> b = 1011
    const steps = grayToBinSteps('1110');
    expect(steps.map(s => s.r).join('')).toBe('1011');
    expect(steps.map(s => s.a)).toEqual(['0', '1', '0', '1']);
  });
});
