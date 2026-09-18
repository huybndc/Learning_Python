import { describe, it, expect } from 'vitest';
import {
  matrixFromColumns, rankOf, rankOfVectors, isIndependent, spanKind, inSpan,
  columnSpaceBasis, nullSpaceBasis, rowSpaceBasis, dimensions, spansSpace,
  isBasis, extractBasis,
} from '../src/logic/subspace.js';
import { matVec, columns } from '../src/logic/matrix.js';

describe('dựng ma trận từ các cột', () => {
  it('vector thành cột', () => {
    expect(matrixFromColumns([[1, 2], [3, 4]])).toEqual([[1, 3], [2, 4]]);
    expect(matrixFromColumns([[1, 2, 3]])).toEqual([[1], [2], [3]]);
  });

  it('bắt đầu vào sai', () => {
    expect(() => matrixFromColumns([])).toThrowError(/err.noVectors/);
    expect(() => matrixFromColumns([[1, 2], [1, 2, 3]])).toThrowError(/err.dimMismatch/);
  });
});

describe('hạng và độc lập tuyến tính', () => {
  it('hạng của ma trận', () => {
    expect(rankOf([[1, 0], [0, 1]])).toBe(2);
    expect(rankOf([[1, 2], [2, 4]])).toBe(1);
    expect(rankOf([[0, 0], [0, 0]])).toBe(0);
    expect(rankOf([[1, 2, 3], [2, 4, 6], [1, 1, 1]])).toBe(2);
  });

  it('hạng không vượt quá số hàng lẫn số cột', () => {
    expect(rankOf([[1, 2, 3]])).toBe(1);
    expect(rankOf([[1], [2], [3]])).toBe(1);
    expect(rankOf([[1, 2, 3], [4, 5, 6]])).toBe(2);
  });

  it('độc lập tuyến tính', () => {
    expect(isIndependent([[1, 0, 0], [0, 1, 0]])).toBe(true);
    expect(isIndependent([[1, 0, 0], [2, 0, 0]])).toBe(false);
    expect(isIndependent([[1, 1, 0], [0, 1, 1], [1, 0, 1]])).toBe(true);
    expect(isIndependent([[1, 1, 0], [0, 1, 1], [1, 2, 1]])).toBe(false);
  });

  it('nhiều hơn 3 vector trong R³ thì chắc chắn phụ thuộc', () => {
    expect(isIndependent([[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 2, 3]])).toBe(false);
  });

  it('bộ có vector 0 thì không bao giờ độc lập', () => {
    expect(isIndependent([[1, 0, 0], [0, 0, 0]])).toBe(false);
    expect(isIndependent([[0, 0, 0]])).toBe(false);
  });
});

describe('span trông như thế nào', () => {
  it('bốn hình dạng trong R³', () => {
    expect(spanKind([[0, 0, 0]])).toBe('point');
    expect(spanKind([[1, 2, 3]])).toBe('line');
    expect(spanKind([[1, 2, 3], [2, 4, 6]])).toBe('line');
    expect(spanKind([[1, 0, 0], [0, 1, 0]])).toBe('plane');
    expect(spanKind([[1, 0, 0], [0, 1, 0], [1, 1, 0]])).toBe('plane');
    expect(spanKind([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBe('space');
  });

  it('phủ hết không gian và cơ sở', () => {
    expect(spansSpace([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3)).toBe(true);
    expect(spansSpace([[1, 0, 0], [0, 1, 0]], 3)).toBe(false);
    expect(isBasis([[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3)).toBe(true);
    expect(isBasis([[1, 0, 0], [0, 1, 0]], 3)).toBe(false);        // thiếu vector
    expect(isBasis([[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]], 3)).toBe(false); // thừa
    expect(isBasis([[1, 0, 0], [0, 1, 0], [1, 1, 0]], 3)).toBe(false); // phụ thuộc
  });
});

describe('b có nằm trong span không', () => {
  it('nằm trong mặt phẳng span thì tìm được hệ số', () => {
    const r = inSpan([[1, 0, 0], [0, 1, 0]], [2, 3, 0]);
    expect(r.inSpan).toBe(true);
    expect(r.coefs).toEqual([2, 3]);
  });

  it('ra khỏi mặt phẳng thì không', () => {
    expect(inSpan([[1, 0, 0], [0, 1, 0]], [2, 3, 1]).inSpan).toBe(false);
    expect(inSpan([[1, 0, 0], [0, 1, 0]], [2, 3, 1]).coefs).toBe(null);
  });

  it('hệ số tìm được thật sự dựng lại đúng b', () => {
    const vs = [[1, 2, 0], [0, 1, 1], [1, 0, 2]];
    for (const b of [[1, 3, 1], [2, 2, 2], [0, 0, 0]]) {
      const r = inSpan(vs, b);
      expect(r.inSpan).toBe(true);
      expect(matVec(matrixFromColumns(vs), r.coefs)).toEqual(b);
    }
  });

  it('span phụ thuộc thì hệ số không duy nhất', () => {
    const r = inSpan([[1, 0, 0], [2, 0, 0]], [3, 0, 0]);
    expect(r.inSpan).toBe(true);
    expect(r.unique).toBe(false);
    expect(r.type).toBe('infinite');
  });

  it('lệch số chiều thì báo lỗi', () => {
    expect(() => inSpan([[1, 0, 0]], [1, 0])).toThrowError(/err.dimMismatch/);
  });
});

describe('column space và null space', () => {
  const A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]];

  it('cơ sở column space là các cột trụ của chính A', () => {
    const basis = columnSpaceBasis(A);
    expect(basis.length).toBe(rankOf(A));
    for (const v of basis) expect(columns(A)).toContainEqual(v);
  });

  it('cơ sở null space thoả Ax = 0', () => {
    const basis = nullSpaceBasis(A);
    expect(basis.length).toBe(dimensions(A).nullDim);
    for (const v of basis) {
      expect(Math.max(...matVec(A, v).map(Math.abs))).toBeLessThan(1e-9);
    }
  });

  it('ma trận khả nghịch thì null space chỉ có vector 0', () => {
    expect(nullSpaceBasis([[1, 0], [0, 1]])).toEqual([]);
    expect(columnSpaceBasis([[1, 0], [0, 1]]).length).toBe(2);
  });

  it('cơ sở row space là các hàng khác 0 sau khi khử', () => {
    const basis = rowSpaceBasis(A);
    expect(basis.length).toBe(rankOf(A));
    expect(basis.every(row => row.length === 3)).toBe(true);
  });

  it('định lý hạng: rank + dim(null space) = số cột', () => {
    for (const M of [A, [[1, 2], [3, 4]], [[1, 1, 1]], [[0, 0], [0, 0]], [[1, 2, 3], [4, 5, 6]]]) {
      const d = dimensions(M);
      expect(d.rank + d.nullDim).toBe(d.cols);
      expect(d.rank + d.leftNullDim).toBe(d.rows);
      expect(d.rowDim).toBe(d.colDim);          // hai số chiều luôn bằng nhau
    }
  });
});

describe('rút ra một cơ sở từ bộ vector cho trước', () => {
  it('bỏ đúng vector phụ thuộc', () => {
    const r = extractBasis([[1, 0, 0], [2, 0, 0], [0, 1, 0]]);
    expect(r.basis).toEqual([[1, 0, 0], [0, 1, 0]]);
    expect(r.keptIndex).toEqual([0, 2]);
    expect(r.dropped).toEqual([1]);
  });

  it('bộ đã độc lập thì giữ nguyên', () => {
    const vs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const r = extractBasis(vs);
    expect(r.basis).toEqual(vs);
    expect(r.dropped).toEqual([]);
  });

  it('cơ sở rút ra luôn độc lập và cùng span với bộ gốc', () => {
    const sets = [
      [[1, 2, 3], [2, 4, 6], [1, 0, 1]],
      [[1, 1, 0], [0, 1, 1], [1, 2, 1], [2, 0, 1]],
      [[0, 0, 0], [1, 2, 3]],
    ];
    for (const vs of sets) {
      const r = extractBasis(vs);
      if (r.basis.length) expect(isIndependent(r.basis)).toBe(true);
      expect(rankOfVectors(vs)).toBe(r.basis.length);
      // mọi vector bị bỏ đều viết lại được từ cơ sở
      for (const i of r.dropped) {
        if (r.basis.length) expect(inSpan(r.basis, vs[i]).inSpan).toBe(true);
      }
    }
  });
});
