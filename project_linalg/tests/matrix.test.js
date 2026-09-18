import { describe, it, expect } from 'vitest';
import * as M from '../src/logic/matrix.js';

describe('kiểm tra dạng ma trận', () => {
  it('bắt các dạng sai', () => {
    expect(() => M.shape([])).toThrowError(/err.notMatrix/);
    expect(() => M.shape([[1, 2], [3]])).toThrowError(/err.raggedMatrix/);
    expect(() => M.shape([[1, 'a']])).toThrowError(/err.matrixNumbers/);
    expect(() => M.zeros(0, 2)).toThrowError(/err.badSize/);
  });

  it('shape, clone, isSquare', () => {
    expect(M.shape([[1, 2, 3], [4, 5, 6]])).toEqual({ rows: 2, cols: 3 });
    expect(M.isSquare([[1, 2], [3, 4]])).toBe(true);
    expect(M.isSquare([[1, 2, 3], [4, 5, 6]])).toBe(false);
    const A = [[1, 2]];
    const B = M.clone(A);
    B[0][0] = 9;
    expect(A[0][0]).toBe(1);
  });

  it('zeros và identity', () => {
    expect(M.zeros(2, 3)).toEqual([[0, 0, 0], [0, 0, 0]]);
    expect(M.identity(3)).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  });
});

describe('cộng, trừ, nhân vô hướng', () => {
  it('theo từng phần tử', () => {
    expect(M.add([[1, 2]], [[3, 4]])).toEqual([[4, 6]]);
    expect(M.sub([[1, 2]], [[3, 4]])).toEqual([[-2, -2]]);
    expect(M.scale(2, [[1, -2], [0, 3]])).toEqual([[2, -4], [0, 6]]);
  });

  it('lệch kích thước thì báo lỗi', () => {
    expect(() => M.add([[1, 2]], [[1], [2]])).toThrowError(/err.shapeMismatch/);
  });
});

describe('chuyển vị và nhân ma trận', () => {
  it('transpose đổi hàng thành cột', () => {
    expect(M.transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
    expect(M.transpose(M.transpose([[1, 2, 3], [4, 5, 6]]))).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('nhân với I giữ nguyên', () => {
    const A = [[1, 2], [3, 4]];
    expect(M.multiply(A, M.identity(2))).toEqual(A);
    expect(M.multiply(M.identity(2), A)).toEqual(A);
  });

  it('nhân đúng công thức hàng × cột', () => {
    expect(M.multiply([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
    expect(M.multiply([[1, 2, 3]], [[1], [0], [-1]])).toEqual([[-2]]);
  });

  it('nhân ma trận không giao hoán', () => {
    const [A, B] = [[[1, 2], [3, 4]], [[0, 1], [0, 0]]];
    expect(M.equals(M.multiply(A, B), M.multiply(B, A))).toBe(false);
  });

  it('(AB)ᵀ = BᵀAᵀ', () => {
    const [A, B] = [[[1, 2, 0], [0, 1, 3]], [[1, 0], [2, 1], [0, 4]]];
    expect(M.transpose(M.multiply(A, B))).toEqual(M.multiply(M.transpose(B), M.transpose(A)));
  });

  it('lệch chiều thì báo lỗi', () => {
    expect(() => M.multiply([[1, 2]], [[1, 2]])).toThrowError(/err.mulMismatch/);
  });
});

describe('A·x và cách nhìn theo cột', () => {
  it('matVec đúng', () => {
    expect(M.matVec([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7]);
    expect(M.matVec([[2, 0], [0, 3]], [5, -1])).toEqual([10, -3]);
    expect(() => M.matVec([[1, 2]], [1, 2, 3])).toThrowError(/err.matVecMismatch/);
  });

  it('A·x là tổ hợp tuyến tính các cột của A', () => {
    const A = [[1, 2], [3, 4]], x = [2, -1];
    const cols = M.columns(A);
    const combo = cols[0].map((_, i) => cols[0][i] * x[0] + cols[1][i] * x[1]);
    expect(M.matVec(A, x)).toEqual(combo);
  });

  it('A·(x+y) = A·x + A·y', () => {
    const A = [[1, 2], [3, 4]];
    const [x, y] = [[1, 1], [2, -3]];
    const left = M.matVec(A, [x[0] + y[0], x[1] + y[1]]);
    const [ax, ay] = [M.matVec(A, x), M.matVec(A, y)];
    expect(left).toEqual([ax[0] + ay[0], ax[1] + ay[1]]);
  });
});

describe('ma trận mở rộng', () => {
  it('augment rồi split thì về chỗ cũ', () => {
    const A = [[1, 2], [3, 4]], b = [5, 6];
    const aug = M.augment(A, b);
    expect(aug).toEqual([[1, 2, 5], [3, 4, 6]]);
    expect(M.splitAugmented(aug)).toEqual({ A, b });
    expect(() => M.augment(A, [1, 2, 3])).toThrowError(/err.augmentMismatch/);
  });
});

describe('định thức', () => {
  it('2×2 và 3×3', () => {
    expect(M.determinant([[1, 2], [3, 4]])).toBe(-2);
    expect(M.determinant([[2, 0, 1], [1, 3, 2], [1, 1, 1]])).toBe(0);
    expect(M.determinant([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).toBe(-306);
    expect(M.determinant([[5]])).toBe(5);
  });

  it('det(I) = 1 và ma trận có hai hàng giống nhau thì det = 0', () => {
    expect(M.determinant(M.identity(4))).toBe(1);
    expect(M.determinant([[1, 2], [1, 2]])).toBe(0);
    expect(M.determinant([[1, 2, 3], [4, 5, 6], [1, 2, 3]])).toBe(0);
  });

  it('det(AB) = det(A)·det(B)', () => {
    const [A, B] = [[[1, 2], [3, 5]], [[2, 1], [0, 4]]];
    expect(M.determinant(M.multiply(A, B))).toBe(M.determinant(A) * M.determinant(B));
  });

  it('det(Aᵀ) = det(A)', () => {
    const A = [[1, 2, 3], [0, 4, 5], [1, 0, 6]];
    expect(M.determinant(M.transpose(A))).toBe(M.determinant(A));
  });

  it('chỉ ma trận vuông mới có định thức', () => {
    expect(() => M.determinant([[1, 2, 3], [4, 5, 6]])).toThrowError(/err.needSquare/);
    expect(() => M.trace([[1, 2, 3], [4, 5, 6]])).toThrowError(/err.needSquare/);
  });

  it('minor, cofactor, trace', () => {
    expect(M.minorMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0)).toEqual([[5, 6], [8, 9]]);
    expect(M.cofactor([[1, 2], [3, 4]], 0, 0)).toBe(4);
    expect(M.cofactor([[1, 2], [3, 4]], 0, 1)).toBe(-3);
    expect(M.trace([[1, 2], [3, 4]])).toBe(5);
  });

  it('khai triển cofactor theo hàng đầu ra đúng định thức', () => {
    const A = [[6, 1, 1], [4, -2, 5], [2, 8, 7]];
    const s = A[0].reduce((acc, v, j) => acc + v * M.cofactor(A, 0, j), 0);
    expect(s).toBe(M.determinant(A));
  });
});
