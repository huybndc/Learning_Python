import { describe, it, expect } from 'vitest';
import {
  varNames, popcount, literalCount, implicantMinterms, impCovers, impContains,
  primeImplicants, minimizeSOP, minimizePOS, splitValues, totalLiterals,
  implicantToSOP, implicantToPOS,
} from '../src/logic/quine-mccluskey.js';
import { evalSOP, evalPOS, randomFunction, mulberry32 } from './helpers/eval-cover.js';

/* Chuyển từ khối T3 + T4 của runTests() trong bản HTML gốc.
   Ở đây SOP/POS được đánh giá ở mức implicant; phần đối chiếu với chuỗi
   biểu thức đã sinh ra nằm trong tests/expr-parser.test.js (cần parser). */

describe('tiện ích implicant', () => {
  it('varNames lấy đúng n biến đầu, A là MSB', () => {
    expect(varNames(3)).toEqual(['x', 'y', 'z']);
    expect(varNames(5)).toEqual(['v', 'w', 'x', 'y', 'z']);
  });

  it('popcount đếm đúng số bit 1', () => {
    expect(popcount(0)).toBe(0);
    expect(popcount(7)).toBe(3);
    expect(popcount(0b10101)).toBe(3);
  });

  it('literalCount = số biến chưa bị loại', () => {
    expect(literalCount({ v: 0, d: 0 }, 4)).toBe(4);
    expect(literalCount({ v: 0, d: 0b0101 }, 4)).toBe(2);
  });

  it('implicantMinterms liệt kê đủ và đã sắp xếp', () => {
    // x'z' trên 4 biến: x = bit2, z = bit0 -> d = bit3|bit1 = 0b1010
    const imp = { v: 0, d: 0b1010 };
    expect(implicantMinterms(imp, 4)).toEqual([0, 2, 8, 10]);
    expect(implicantMinterms({ v: 5, d: 0 }, 4)).toEqual([5]);
  });

  it('impCovers khớp với implicantMinterms', () => {
    const imp = { v: 0, d: 0b1010 };
    const ms = new Set(implicantMinterms(imp, 4));
    for (let m = 0; m < 16; m++) expect(impCovers(imp, m)).toBe(ms.has(m));
  });

  it('impContains: A chứa B khi tập minterm của B nằm trong A', () => {
    const big = { v: 0, d: 0b1010 };      // {0,2,8,10}
    const small = { v: 0, d: 0b1000 };    // {0,8}
    expect(impContains(big, small)).toBe(true);
    expect(impContains(small, big)).toBe(false);
    expect(impContains(big, big)).toBe(true);
    expect(impContains(big, { v: 1, d: 0 })).toBe(false);
  });

  it('splitValues tách đúng ones / zeros / dcs', () => {
    expect(splitValues([0, 1, 2, 1])).toEqual({ ones: [1, 3], zeros: [0], dcs: [2] });
  });

  it('implicantToSOP / implicantToPOS sinh đúng literal', () => {
    expect(implicantToSOP({ v: 0, d: 0b1010 }, 4)).toBe("x'z'");
    expect(implicantToSOP({ v: 0, d: 0b1111 }, 4)).toBe('1');
    expect(implicantToPOS({ v: 0, d: 0b1010 }, 4)).toBe('(x + z)');
    expect(implicantToPOS({ v: 0, d: 0b1111 }, 4)).toBe('0');
  });
});

/* --- T3: hàm ngẫu nhiên — SOP/POS phải khớp bảng chân trị --- */
describe('T3 — 120 hàm ngẫu nhiên mỗi n (n = 2..4)', () => {
  for (let n = 2; n <= 4; n++) {
    it(`n = ${n}: SOP và POS khớp bảng chân trị tại mọi ô đã định nghĩa`, () => {
      const rnd = mulberry32(0x5eed + n);
      for (let t = 0; t < 120; t++) {
        const values = randomFunction(n, rnd);
        const S = minimizeSOP(values, n);
        const P = minimizePOS(values, n);
        const ts = evalSOP(S, n), tp = evalPOS(P, n);
        for (let m = 0; m < (1 << n); m++) {
          if (values[m] === 2) continue;           // don't care: bỏ qua
          expect(ts[m], `ca ${t}, SOP sai tại m=${m} (${S.expr})`).toBe(values[m]);
          expect(tp[m], `ca ${t}, POS sai tại m=${m} (${P.expr})`).toBe(values[m]);
        }
      }
    });

    it(`n = ${n}: không term nào của cover phủ một ô 0`, () => {
      const rnd = mulberry32(0xbeef + n);
      for (let t = 0; t < 120; t++) {
        const values = randomFunction(n, rnd);
        const S = minimizeSOP(values, n);
        for (const term of S.terms) {
          const bad = implicantMinterms(term.imp, n).filter(m => values[m] === 0);
          expect(bad, `ca ${t}, term ${term.text} phủ ô 0`).toEqual([]);
        }
      }
    });

    it(`n = ${n}: mọi ô 1 đều được cover phủ`, () => {
      const rnd = mulberry32(0xf00d + n);
      for (let t = 0; t < 120; t++) {
        const values = randomFunction(n, rnd);
        const S = minimizeSOP(values, n);
        const { ones } = splitValues(values);
        const missed = ones.filter(m => !S.terms.some(x => impCovers(x.imp, m)));
        expect(missed, `ca ${t} bỏ sót ô 1`).toEqual([]);
      }
    });
  }
});

/* --- T4: các case kinh điển --- */
describe('T4 — case kinh điển', () => {
  it("4 góc K-map 4 biến → x'z'", () => {
    const v = new Array(16).fill(0);
    [0, 2, 8, 10].forEach(m => { v[m] = 1; });
    expect(minimizeSOP(v, 4).expr).toBe("x'z'");
  });

  for (let n = 2; n <= 4; n++) {
    it(`n = ${n}: hàm hằng 1 và hằng 0`, () => {
      const one = new Array(1 << n).fill(1);
      const zero = new Array(1 << n).fill(0);
      expect(minimizeSOP(one, n).expr).toBe('1');
      expect(minimizePOS(one, n).expr).toBe('1');
      expect(minimizeSOP(zero, n).expr).toBe('0');
      expect(minimizePOS(zero, n).expr).toBe('0');
    });

    it(`n = ${n}: XOR/parity không rút gọn được, mọi term essential`, () => {
      const v = new Array(1 << n);
      for (let m = 0; m < (1 << n); m++) v[m] = popcount(m) % 2;
      const S = minimizeSOP(v, n);
      expect(S.terms.length).toBe(1 << (n - 1));
      expect(S.terms.every(t => literalCount(t.imp, n) === n)).toBe(true);
      expect(S.terms.every(t => t.essential)).toBe(true);
      expect(evalSOP(S, n)).toEqual(v);
    });
  }

  it("don't care giúp rút gọn: Σm(1,3,5,7,9) + d(11,13,15) → z", () => {
    const v = new Array(16).fill(0);
    [1, 3, 5, 7, 9].forEach(m => { v[m] = 1; });
    [11, 13, 15].forEach(m => { v[m] = 2; });
    expect(minimizeSOP(v, 4).expr).toBe('z');
  });

  it('ca essential kinh điển Σm(0,1,2,5,6,7,8,9,10,14) → 3 term / 7 literal', () => {
    const v = new Array(16).fill(0);
    [0, 1, 2, 5, 6, 7, 8, 9, 10, 14].forEach(m => { v[m] = 1; });
    const S = minimizeSOP(v, 4);
    expect(evalSOP(S, 4)).toEqual(v);
    expect(S.terms.length, S.expr).toBe(3);
    expect(totalLiterals(S.terms, 4)).toBe(7);
  });
});

describe('primeImplicants', () => {
  it('hàm rỗng không có prime implicant nào', () => {
    expect(primeImplicants([], [], 4)).toEqual([]);
  });

  it('prime implicant thực sự là tối đại (không PI nào chứa PI khác)', () => {
    const pis = primeImplicants([0, 1, 2, 5, 6, 7, 8, 9, 10, 14], [], 4);
    for (const a of pis) {
      for (const b of pis) {
        if (a === b) continue;
        expect(impContains(a, b), `${implicantToSOP(a, 4)} chứa ${implicantToSOP(b, 4)}`).toBe(false);
      }
    }
  });

  it('don\'t care được dùng để mở rộng nhóm', () => {
    const withDC = primeImplicants([1], [0, 3, 5], 4);
    expect(withDC.some(p => literalCount(p, 4) < 4)).toBe(true);
  });
});
