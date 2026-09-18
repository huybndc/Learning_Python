import { describe, it, expect } from 'vitest';
import * as V from '../src/logic/vector.js';

const close = (a, b, eps = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('phép toán cơ bản', () => {
  it('cộng/trừ theo từng toạ độ', () => {
    expect(V.add([1, 2], [3, 4])).toEqual([4, 6]);
    expect(V.sub([1, 2], [3, 4])).toEqual([-2, -2]);
    expect(V.add([1, 2, 3], [0, 0, 0])).toEqual([1, 2, 3]);
  });

  it('không sửa vector đầu vào', () => {
    const a = [1, 2];
    V.add(a, [3, 4]); V.scale(5, a); V.neg(a);
    expect(a).toEqual([1, 2]);
  });

  it('nhân vô hướng và vector đối', () => {
    expect(V.scale(3, [1, -2])).toEqual([3, -6]);
    expect(V.scale(0, [1, -2])).toEqual([0, 0]);
    expect(V.neg([1, -2])).toEqual([-1, 2]);
  });

  it('cộng vector giao hoán và kết hợp', () => {
    const [u, v, w] = [[1, 2], [-3, 5], [4, 0]];
    expect(V.add(u, v)).toEqual(V.add(v, u));
    expect(V.add(V.add(u, v), w)).toEqual(V.add(u, V.add(v, w)));
  });

  it('lệch số chiều thì báo lỗi có mã', () => {
    expect(() => V.add([1, 2], [1, 2, 3])).toThrowError(/err.dimMismatch/);
    expect(() => V.dot([1], [1, 2])).toThrowError(/err.dimMismatch/);
    expect(() => V.add([1, 2], 'xy')).toThrowError(/err.notVector/);
    expect(() => V.add([1, NaN], [1, 2])).toThrowError(/err.vectorNumbers/);
  });
});

describe('tích vô hướng, độ dài, góc', () => {
  it('dot đối xứng và tuyến tính', () => {
    expect(V.dot([1, 2], [3, 4])).toBe(11);
    expect(V.dot([1, 2], [3, 4])).toBe(V.dot([3, 4], [1, 2]));
    expect(V.dot([1, 2], V.add([3, 4], [1, 1]))).toBe(V.dot([1, 2], [3, 4]) + V.dot([1, 2], [1, 1]));
  });

  it('độ dài là căn của dot với chính nó', () => {
    expect(V.norm([3, 4])).toBe(5);
    expect(V.norm([1, 2, 2])).toBe(3);
    expect(V.norm2([3, 4])).toBe(25);
    expect(V.distance([1, 1], [4, 5])).toBe(5);
  });

  it('góc giữa hai vector', () => {
    expect(V.angleDeg([1, 0], [0, 1])).toBe(90);
    expect(V.angleDeg([1, 0], [1, 0])).toBe(0);
    expect(V.angleDeg([1, 0], [-1, 0])).toBe(180);
    close(V.angleDeg([1, 0], [1, 1]), 45, 1e-9);
  });

  it('cos không vượt miền acos dù sai số làm tròn', () => {
    const u = [0.1, 0.2, 0.3];
    expect(Number.isNaN(V.angle(u, V.scale(3, u)))).toBe(false);
    close(V.angle(u, V.scale(3, u)), 0, 1e-7);
    close(V.angleDeg(u, V.scale(-3, u)), 180, 1e-6);
  });

  it('vector 0 không có hướng nên báo lỗi', () => {
    expect(() => V.normalize([0, 0])).toThrowError(/err.zeroVector/);
    expect(() => V.angle([0, 0], [1, 1])).toThrowError(/err.zeroVector/);
  });

  it('normalize cho vector đơn vị cùng hướng', () => {
    expect(V.normalize([3, 4])).toEqual([0.6, 0.8]);
    close(V.norm(V.normalize([1, 2, 3])), 1);
    close(V.angleDeg([1, 2], V.normalize([1, 2])), 0, 1e-7);
  });
});

describe('tích có hướng', () => {
  it('cross trong R³ vuông góc với cả hai', () => {
    expect(V.cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    const [a, b] = [[1, 2, 3], [-2, 0, 4]];
    const c = V.cross(a, b);
    expect(V.dot(c, a)).toBe(0);
    expect(V.dot(c, b)).toBe(0);
  });

  it('cross đổi dấu khi đổi thứ tự', () => {
    expect(V.cross([1, 2, 3], [4, 5, 6])).toEqual(V.neg(V.cross([4, 5, 6], [1, 2, 3])));
  });

  it('cross2 là định thức 2×2', () => {
    expect(V.cross2([1, 0], [0, 1])).toBe(1);
    expect(V.cross2([2, 1], [4, 2])).toBe(0);
    expect(() => V.cross2([1, 2, 3], [1, 2, 3])).toThrowError(/err.needDim2/);
    expect(() => V.cross([1, 2], [3, 4])).toThrowError(/err.needDim3/);
  });
});

describe('tổ hợp tuyến tính và hình chiếu', () => {
  it('combine dựng đúng c₁v₁ + c₂v₂', () => {
    expect(V.combine([2, 3], [[1, 0], [0, 1]])).toEqual([2, 3]);
    expect(V.combine([1, -1], [[2, 3], [1, 1]])).toEqual([1, 2]);
    expect(V.combine([0, 0], [[2, 3], [1, 1]])).toEqual([0, 0]);
  });

  it('combine báo lỗi khi số hệ số khác số vector', () => {
    expect(() => V.combine([1], [[1, 0], [0, 1]])).toThrowError(/err.combineLength/);
  });

  it('hình chiếu nằm trên đường thẳng của b và phần dư thì vuông góc', () => {
    expect(V.projection([3, 3], [1, 0])).toEqual([3, 0]);
    const p = V.projection([2, 5], [3, 1]);
    expect(V.isParallel(p, [3, 1])).toBe(true);
    expect(V.isOrthogonal(V.perpendicular([2, 5], [3, 1]), [3, 1])).toBe(true);
  });

  it('chiếu lên chính mình thì giữ nguyên', () => {
    expect(V.projection([2, 5], [2, 5])).toEqual([2, 5]);
    expect(V.scalarProjection([3, 4], [1, 0])).toBe(3);
    expect(V.scalarProjection([-3, 4], [1, 0])).toBe(-3);
    expect(() => V.projection([1, 1], [0, 0])).toThrowError(/err.zeroVector/);
  });
});

describe('quan hệ giữa hai vector', () => {
  it('cùng phương', () => {
    expect(V.isParallel([1, 2], [2, 4])).toBe(true);
    expect(V.isParallel([1, 2], [-3, -6])).toBe(true);
    expect(V.isParallel([1, 2], [2, 5])).toBe(false);
    expect(V.isParallel([0, 0], [2, 5])).toBe(true);
    expect(V.isParallel([1, 2, 3], [2, 4, 6])).toBe(true);
    expect(V.isParallel([1, 2, 3], [2, 4, 7])).toBe(false);
  });

  it('trực giao ⇔ dot = 0', () => {
    expect(V.isOrthogonal([1, 0], [0, 5])).toBe(true);
    expect(V.isOrthogonal([1, 1], [1, -1])).toBe(true);
    expect(V.isOrthogonal([1, 1], [1, 1])).toBe(false);
  });

  it('isZero và equals có sai số cho phép', () => {
    expect(V.isZero([0, 0, 0])).toBe(true);
    expect(V.isZero([1e-12, 0])).toBe(true);
    expect(V.equals([1, 2], [1 + 1e-12, 2])).toBe(true);
    expect(V.equals([1, 2], [1.1, 2])).toBe(false);
    expect(V.equals([1, 2], [1, 2, 3])).toBe(false);
  });
});
