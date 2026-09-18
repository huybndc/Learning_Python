import { describe, it, expect } from 'vitest';
import {
  polygonNormal, polygonPlane, centroid, splitConvex, splitSegment, splitAll,
  sortForPainter, parallelogram3, spanPatch,
} from '../src/geometry/polygon3d.js';
import { createCamera, dot } from '../src/geometry/space3d.js';

const SQUARE = [[-2, -2, 0], [2, -2, 0], [2, 2, 0], [-2, 2, 0]];

describe('mặt phẳng của đa giác', () => {
  it('pháp tuyến và phương trình mặt phẳng', () => {
    expect(polygonNormal(SQUARE)).toEqual([0, 0, 1]);
    expect(polygonPlane(SQUARE)).toEqual({ n: [0, 0, 1], d: 0 });
    expect(polygonPlane([[0, 0, 3], [1, 0, 3], [0, 1, 3]])).toEqual({ n: [0, 0, 1], d: 3 });
  });

  it('bỏ qua ba điểm đầu thẳng hàng để tìm pháp tuyến', () => {
    const poly = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]];
    expect(polygonNormal(poly)).not.toBe(null);
  });

  it('đa giác suy biến thì không có pháp tuyến', () => {
    expect(polygonNormal([[0, 0, 0], [1, 0, 0], [2, 0, 0]])).toBe(null);
    expect(polygonPlane([[0, 0, 0], [1, 0, 0], [2, 0, 0]])).toBe(null);
  });

  it('trọng tâm', () => {
    expect(centroid(SQUARE)).toEqual([0, 0, 0]);
    expect(centroid([[0, 0, 0], [2, 0, 0]])).toEqual([1, 0, 0]);
  });
});

describe('cắt đa giác lồi', () => {
  it('cắt đôi thì mỗi nửa vẫn là đa giác kín', () => {
    const { front, back } = splitConvex(SQUARE, { n: [1, 0, 0], d: 0 });
    expect(front.length).toBeGreaterThanOrEqual(3);
    expect(back.length).toBeGreaterThanOrEqual(3);
    expect(front.every(p => p[0] >= -1e-9)).toBe(true);
    expect(back.every(p => p[0] <= 1e-9)).toBe(true);
  });

  it('hai nửa ghép lại đúng diện tích cũ', () => {
    const area = poly => {
      let s = 0;
      for (let i = 1; i + 1 < poly.length; i++) {
        const [a, b] = [
          [poly[i][0] - poly[0][0], poly[i][1] - poly[0][1]],
          [poly[i + 1][0] - poly[0][0], poly[i + 1][1] - poly[0][1]],
        ];
        s += Math.abs(a[0] * b[1] - a[1] * b[0]) / 2;
      }
      return s;
    };
    const { front, back } = splitConvex(SQUARE, { n: [1, 1, 0], d: 0.5 });
    expect(area(front) + area(back)).toBeCloseTo(area(SQUARE), 6);
  });

  it('nằm hẳn một bên thì không cắt', () => {
    expect(splitConvex(SQUARE, { n: [1, 0, 0], d: 10 })).toEqual({ front: null, back: SQUARE });
    expect(splitConvex(SQUARE, { n: [1, 0, 0], d: -10 })).toEqual({ front: SQUARE, back: null });
  });

  it('đa giác nằm ngay trên mặt phẳng thì không bị xé', () => {
    const r = splitConvex(SQUARE, { n: [0, 0, 1], d: 0 });
    expect(r.front).toEqual(SQUARE);
    expect(r.back).toBe(null);
  });
});

describe('cắt đoạn thẳng bằng mặt phẳng', () => {
  const zPlane = { n: [0, 0, 1], d: 0 };

  it('đoạn xuyên qua thì cắt làm đôi tại đúng chỗ giao', () => {
    const halves = splitSegment([0, 0, -2], [0, 0, 2], zPlane);
    expect(halves).toEqual([[[0, 0, -2], [0, 0, 0]], [[0, 0, 0], [0, 0, 2]]]);
  });

  it('điểm cắt nằm trên mặt phẳng và chia đúng tỉ lệ', () => {
    const [a, b] = splitSegment([0, 0, -1], [0, 0, 3], zPlane);
    expect(a[1][2]).toBeCloseTo(0, 9);
    expect(b[0]).toEqual(a[1]);
  });

  it('đoạn nằm hẳn một phía hoặc nằm trên mặt thì không cắt', () => {
    expect(splitSegment([0, 0, 1], [0, 0, 2], zPlane)).toBe(null);
    expect(splitSegment([0, 0, -1], [0, 0, -2], zPlane)).toBe(null);
    expect(splitSegment([0, 0, 0], [1, 1, 0], zPlane)).toBe(null);
  });
});

describe('cắt tất cả để không mảnh nào xuyên nhau', () => {
  const A = { poly: SQUARE, id: 'ngang' };
  const B = { poly: [[0, -2, -2], [0, 2, -2], [0, 2, 2], [0, -2, 2]], id: 'dọc' };

  it('hai mặt cắt nhau thì mỗi mặt bị chia đôi', () => {
    const pieces = splitAll([A, B]);
    expect(pieces.length).toBe(4);
    expect(pieces.filter(p => p.id === 'ngang').length).toBe(2);
    expect(pieces.filter(p => p.id === 'dọc').length).toBe(2);
  });

  it('mỗi mảnh nằm hẳn về một phía của mặt phẳng kia', () => {
    for (const piece of splitAll([A, B])) {
      const other = piece.id === 'ngang' ? polygonPlane(B.poly) : polygonPlane(A.poly);
      const signs = piece.poly.map(p => Math.sign(Number((dot(other.n, p) - other.d).toFixed(9))));
      const nonZero = signs.filter(s => s !== 0);
      expect(new Set(nonZero).size, JSON.stringify(piece.poly)).toBeLessThanOrEqual(1);
    }
  });

  it('hai mặt song song thì không cắt gì cả', () => {
    const C = { poly: SQUARE.map(p => [p[0], p[1], 3]), id: 'trên' };
    expect(splitAll([A, C]).length).toBe(2);
  });

  it('một mặt thì giữ nguyên', () => {
    expect(splitAll([A]).length).toBe(1);
    expect(splitAll([A])[0].poly).toEqual(SQUARE);
  });

  it('giữ lại thông tin đi kèm của đa giác gốc', () => {
    for (const piece of splitAll([A, B])) expect(['ngang', 'dọc']).toContain(piece.id);
  });
});

describe('sắp thứ tự vẽ', () => {
  const cam = createCamera({ width: 400, height: 400, distance: 10, yaw: 0, pitch: 0 });

  it('vẽ vật xa trước, vật gần sau', () => {
    const far = { poly: [[-4, -1, -1], [-4, 1, -1], [-4, 1, 1]], id: 'xa' };
    const near = { poly: [[4, -1, -1], [4, 1, -1], [4, 1, 1]], id: 'gần' };
    expect(sortForPainter([near, far], cam.depthOf).map(x => x.id)).toEqual(['xa', 'gần']);
  });

  it('không làm mất mảnh nào', () => {
    const items = [{ poly: SQUARE }, { poly: SQUARE.map(p => [p[0], p[1], 1]) }];
    expect(sortForPainter(items, cam.depthOf).length).toBe(2);
  });

  it('nhận cả vật chỉ có `points` (mũi tên, đoạn thẳng)', () => {
    const items = [
      { points: [[4, 0, 0]], id: 'gần' },
      { points: [[-4, 0, 0]], id: 'xa' },
    ];
    expect(sortForPainter(items, cam.depthOf).map(x => x.id)).toEqual(['xa', 'gần']);
  });
});

describe('dựng hình cho không gian con', () => {
  it('hình bình hành dựng bởi hai vector', () => {
    expect(parallelogram3([2, 0, 0], [0, 3, 0]))
      .toEqual([[0, 0, 0], [2, 0, 0], [2, 3, 0], [0, 3, 0]]);
  });

  it('mảnh mặt phẳng span{u, v} chứa cả u lẫn v và đi qua gốc', () => {
    const patch = spanPatch([1, 0, 0], [0, 1, 0], 3);
    const plane = polygonPlane(patch);
    expect(Math.abs(plane.d)).toBeLessThan(1e-9);            // qua gốc toạ độ
    for (const v of [[1, 0, 0], [0, 1, 0], [2, -5, 0]]) {
      expect(Math.abs(dot(plane.n, v))).toBeLessThan(1e-9);  // mọi tổ hợp đều nằm trên mặt
    }
  });

  it('mảnh mặt phẳng cho hai vector chéo nhau vẫn đúng mặt', () => {
    const plane = polygonPlane(spanPatch([1, 1, 0], [0, 1, 2], 3));
    for (const v of [[1, 1, 0], [0, 1, 2], [1, 2, 2]]) {
      expect(Math.abs(dot(plane.n, v))).toBeLessThan(1e-9);
    }
  });

  it('hai vector cùng phương thì không dựng được mặt phẳng', () => {
    expect(spanPatch([1, 0, 0], [2, 0, 0])).toBe(null);
    expect(spanPatch([1, 2, 3], [-2, -4, -6])).toBe(null);
  });
});
