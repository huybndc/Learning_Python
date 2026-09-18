import { describe, it, expect } from 'vitest';
import * as G from '../src/geometry/plane2d.js';

const view = G.createView({ width: 400, height: 400, span: 5 });

describe('createView', () => {
  it('gốc toạ độ nằm giữa canvas', () => {
    expect(view.toPixel([0, 0])).toEqual([200, 200]);
    expect(view.bounds).toEqual({ xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
  });

  it('trục y hướng lên trên màn hình', () => {
    const [, py] = view.toPixel([0, 1]);
    expect(py).toBeLessThan(200);
  });

  it('toWorld là nghịch đảo của toPixel', () => {
    for (const p of [[0, 0], [1, 2], [-3.5, 4.25]]) {
      const back = view.toWorld(view.toPixel(p));
      expect(back[0]).toBeCloseTo(p[0], 9);
      expect(back[1]).toBeCloseTo(p[1], 9);
    }
  });

  it('giữ tỉ lệ vuông kể cả khi canvas chữ nhật', () => {
    const wide = G.createView({ width: 800, height: 400, span: 5 });
    const [x1] = wide.toPixel([1, 0]);
    const [, y1] = wide.toPixel([0, 1]);
    expect(x1 - 400).toBeCloseTo(200 - y1, 9);   // 1 đơn vị x = 1 đơn vị y
  });

  it('nhận tâm khác gốc', () => {
    const v = G.createView({ width: 200, height: 200, span: 2, center: [1, 1] });
    expect(v.toPixel([1, 1])).toEqual([100, 100]);
    expect(v.bounds).toEqual({ xMin: -1, xMax: 3, yMin: -1, yMax: 3 });
  });

  it('kích thước sai thì báo lỗi', () => {
    expect(() => G.createView({ width: 0, height: 100 })).toThrowError(/err.badViewSize/);
    expect(() => G.createView({ width: 100, height: 100, span: 0 })).toThrowError(/err.badSpan/);
  });

  it('đổi độ dài giữa hai hệ', () => {
    expect(view.lenToPixel(1)).toBe(40);
    expect(view.lenToWorld(40)).toBe(1);
  });
});

describe('lưới', () => {
  it('bước lưới là số đẹp', () => {
    expect(G.niceStep(10, 10)).toBe(1);
    expect(G.niceStep(100, 10)).toBe(10);
    expect(G.niceStep(3.3, 10)).toBe(0.5);
    expect([1, 2, 5, 10]).toContain(G.niceStep(35, 10) / 1);
  });

  it('vạch lưới nằm trong khung và có vạch 0', () => {
    const { xs, ys } = G.gridLines(view, 1);
    expect(xs).toContain(0);
    expect(ys).toContain(0);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(view.bounds.xMin - 1e-9);
    expect(Math.max(...xs)).toBeLessThanOrEqual(view.bounds.xMax + 1e-9);
    expect(xs.length).toBe(11);
  });
});

describe('mũi tên', () => {
  it('hai cánh đối xứng qua thân mũi tên', () => {
    const { tip, left, right } = G.arrowHead([0, 0], [100, 0], 12);
    expect(tip).toEqual([100, 0]);
    expect(left[0]).toBeCloseTo(right[0], 9);
    expect(left[1]).toBeCloseTo(-right[1], 9);
    expect(left[0]).toBeLessThan(100);
  });

  it('vector rỗng thì không dựng được đầu mũi tên', () => {
    const h = G.arrowHead([5, 5], [5, 5], 12);
    expect(h.left).toEqual([5, 5]);
    expect(h.right).toEqual([5, 5]);
  });
});

describe('cắt đường thẳng theo khung nhìn', () => {
  const b = view.bounds;

  it('đường xiên cắt hai góc', () => {
    expect(G.clipLine(1, 1, 0, b)).toEqual([[-5, 5], [5, -5]]);
  });

  it('đường ngang và đường dọc', () => {
    expect(G.clipLine(0, 1, 2, b)).toEqual([[-5, 2], [5, 2]]);
    expect(G.clipLine(1, 0, -3, b)).toEqual([[-3, -5], [-3, 5]]);
  });

  it('mọi điểm trả về đều thoả phương trình', () => {
    const [p, q] = G.clipLine(2, -3, 4, b);
    expect(2 * p[0] - 3 * p[1]).toBeCloseTo(4, 9);
    expect(2 * q[0] - 3 * q[1]).toBeCloseTo(4, 9);
  });

  it('đường nằm ngoài khung thì trả null', () => {
    expect(G.clipLine(0, 1, 99, b)).toBe(null);
    expect(G.clipLine(0, 0, 5, b)).toBe(null);    // 0 = 5 không phải đường thẳng
  });
});

describe('tiện ích tương tác', () => {
  it('hình bình hành có đủ 4 đỉnh và đỉnh đối là u+v', () => {
    expect(G.parallelogram([2, 0], [1, 3])).toEqual([[0, 0], [2, 0], [3, 3], [1, 3]]);
  });

  it('hitTest bắt đúng điểm gần nhất trong bán kính', () => {
    expect(G.hitTest(view, [240, 160], [[1, 1], [3, 3]])).toBe(0);
    expect(G.hitTest(view, [320, 80], [[1, 1], [3, 3]])).toBe(1);
    expect(G.hitTest(view, [0, 0], [[1, 1], [3, 3]])).toBe(-1);
  });

  it('snap bắt về mắt lưới', () => {
    expect(G.snap([1.2, -0.3], 0.5)).toEqual([1, -0.5]);
    expect(G.snap([1.2, -0.3], 0)).toEqual([1.2, -0.3]);
    expect(G.snap([1.2, -0.3], 1)).toEqual([1, -0]);
  });

  it('nội suy', () => {
    expect(G.lerp(0, 10, 0.5)).toBe(5);
    expect(G.lerpPoint([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
    expect(G.easeInOut(0)).toBe(0);
    expect(G.easeInOut(1)).toBe(1);
    expect(G.easeInOut(0.5)).toBe(0.5);
    expect(G.easeInOut(0.25)).toBeLessThan(0.25);
  });
});

describe('geometry/ giữ đúng ranh giới', () => {
  it('không đụng DOM', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const dir = fileURLToPath(new URL('../src/geometry/', import.meta.url));
    for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
      const code = readFileSync(dir + f, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(/\bdocument\.|\bwindow\.|canvas\.getContext/.test(code), 'geometry/' + f).toBe(false);
    }
  });
});
