import { describe, it, expect } from 'vitest';
import {
  mapLayout, cellMinterm, mintermPositions, contiguousSegments, implicantRects,
} from '../src/logic/kmap-layout.js';
import { primeImplicants, implicantMinterms, popcount } from '../src/logic/quine-mccluskey.js';

/* Chuyển từ khối T6 của runTests() trong bản HTML gốc. */

describe('mapLayout', () => {
  it('chia biến vào sheet / hàng / cột đúng cho từng n', () => {
    expect(mapLayout(2)).toMatchObject({ sheetVars: [], rowVars: ['A'], colVars: ['B'] });
    expect(mapLayout(3)).toMatchObject({ sheetVars: [], rowVars: ['A'], colVars: ['B', 'C'] });
    expect(mapLayout(4)).toMatchObject({ sheetVars: [], rowVars: ['A', 'B'], colVars: ['C', 'D'] });
    expect(mapLayout(5)).toMatchObject({ sheetVars: ['A'], rowVars: ['B', 'C'], colVars: ['D', 'E'] });
  });

  it('số sheet × hàng × cột đúng bằng 2^n', () => {
    for (let n = 2; n <= 5; n++) {
      const L = mapLayout(n);
      expect(L.sheetCodes.length * L.rowCodes.length * L.colCodes.length).toBe(1 << n);
    }
  });
});

describe('cellMinterm / mintermPositions', () => {
  it('mỗi minterm xuất hiện đúng một lần trên lưới', () => {
    for (let n = 2; n <= 5; n++) {
      const L = mapLayout(n);
      const seen = new Set();
      for (let s = 0; s < L.sheetCodes.length; s++)
        for (let r = 0; r < L.rowCodes.length; r++)
          for (let c = 0; c < L.colCodes.length; c++) seen.add(cellMinterm(L, s, r, c));
      expect(seen.size).toBe(1 << n);
    }
  });

  it('mintermPositions là bảng tra ngược đúng của cellMinterm', () => {
    for (let n = 2; n <= 5; n++) {
      const L = mapLayout(n);
      const pos = mintermPositions(L);
      for (let m = 0; m < (1 << n); m++) {
        const p = pos[m];
        expect(cellMinterm(L, p.s, p.r, p.c), `n=${n}, m=${m}`).toBe(m);
      }
    }
  });
});

/* --- T6: hai ô kề nhau (kể cả wrap-around) khác đúng 1 bit --- */
describe('T6 — quan hệ kề trên K-map', () => {
  for (let n = 2; n <= 5; n++) {
    it(`n = ${n}: ô kề nhau (kể cả quấn biên) khác đúng 1 biến`, () => {
      const L = mapLayout(n);
      const R = L.rowCodes.length, C = L.colCodes.length;
      for (let s = 0; s < L.sheetCodes.length; s++)
        for (let r = 0; r < R; r++)
          for (let c = 0; c < C; c++) {
            const m = cellMinterm(L, s, r, c);
            if (C > 1) {
              const right = cellMinterm(L, s, r, (c + 1) % C);
              expect(popcount(m ^ right), `n=${n} (${s},${r},${c}) → phải`).toBe(1);
            }
            if (R > 1) {
              const down = cellMinterm(L, s, (r + 1) % R, c);
              expect(popcount(m ^ down), `n=${n} (${s},${r},${c}) → dưới`).toBe(1);
            }
          }
    });
  }
});

describe('contiguousSegments', () => {
  it('tập đầy đủ trả về đúng một đoạn phủ hết', () => {
    expect(contiguousSegments([0, 1, 2, 3], 4)).toEqual([[0, 4]]);
  });

  it('đoạn liên tiếp gộp thành một', () => {
    expect(contiguousSegments([1, 2], 4)).toEqual([[1, 2]]);
  });

  it('nhóm quấn biên tách thành hai mảnh ở hai mép', () => {
    expect(contiguousSegments([0, 3], 4)).toEqual([[0, 1], [3, 1]]);
  });

  it('một phần tử ra một mảnh rộng 1', () => {
    expect(contiguousSegments([2], 4)).toEqual([[2, 1]]);
  });
});

/* --- T6: tổng diện tích các mảnh = số ô của nhóm --- */
describe('T6 — implicantRects', () => {
  for (let n = 2; n <= 5; n++) {
    it(`n = ${n}: tổng diện tích các mảnh của mọi prime implicant = số minterm`, () => {
      const size = 1 << n;
      const pis = primeImplicants([...Array(size).keys()], [], n);
      for (const p of pis) {
        const rects = implicantRects(p, n);
        const area = rects.reduce((s, r) => s + r.w * r.h, 0);
        expect(area, `n=${n}, imp v=${p.v} d=${p.d}`).toBe(implicantMinterms(p, n).length);
      }
    });

    it(`n = ${n}: mỗi implicant 1 ô vẽ ra đúng một hình 1×1`, () => {
      for (let m = 0; m < (1 << n); m++) {
        const r = implicantRects({ v: m, d: 0 }, n);
        expect(r.length, `n=${n}, m=${m}`).toBe(1);
        expect(r[0].w).toBe(1);
        expect(r[0].h).toBe(1);
      }
    });
  }

  it("4 góc K-map 4 biến (B'D') vẽ thành 4 mảnh 1×1 ở mép", () => {
    const rects = implicantRects({ v: 0, d: 0b1010 }, 4);
    expect(rects.length).toBe(4);
    expect(rects.every(r => r.w === 1 && r.h === 1)).toBe(true);
  });

  it('nhóm phủ cả sheet của K-map 5 biến vẽ ở cả hai sheet', () => {
    // d = 0b11111 -> toàn bộ; lấy nhóm bỏ A (bit 4) và giữ phần còn lại
    const rects = implicantRects({ v: 0, d: 0b10000 }, 5);
    expect(new Set(rects.map(r => r.s)).size).toBe(2);
  });
});
