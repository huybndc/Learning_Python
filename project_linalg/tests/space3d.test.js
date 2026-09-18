import { describe, it, expect } from 'vitest';
import {
  createCamera, orbit, zoom, clampPitch, PITCH_LIMIT, planeThrough, rayPlane,
  dragOnScreenPlane, pick3d, dot, cross, len, unit, sub,
} from '../src/geometry/space3d.js';

const cam = (opt = {}) => createCamera({ width: 400, height: 400, distance: 10, yaw: 0, pitch: 0, ...opt });

describe('phép toán vector 3D nền', () => {
  it('cross vuông góc với cả hai', () => {
    const c = cross([1, 2, 3], [-2, 0, 4]);
    expect(dot(c, [1, 2, 3])).toBeCloseTo(0, 9);
    expect(dot(c, [-2, 0, 4])).toBeCloseTo(0, 9);
  });

  it('unit cho vector dài 1, vector 0 thì báo lỗi', () => {
    expect(len(unit([3, 4, 0]))).toBeCloseTo(1, 9);
    expect(() => unit([0, 0, 0])).toThrowError(/err.zeroVector/);
  });
});

describe('camera', () => {
  it('điểm ngắm rơi đúng tâm màn hình', () => {
    const p = cam().project([0, 0, 0]);
    expect(p.x).toBeCloseTo(200, 6);
    expect(p.y).toBeCloseTo(200, 6);
    expect(p.visible).toBe(true);
  });

  it('trục z hướng lên trên màn hình', () => {
    expect(cam().project([0, 0, 1]).y).toBeLessThan(200);
    expect(cam().project([0, 0, -1]).y).toBeGreaterThan(200);
  });

  it('điểm sau lưng camera thì không nhìn thấy', () => {
    expect(cam().project([20, 0, 0]).visible).toBe(false);
    expect(cam().project([20, 0, 0]).depth).toBeLessThan(0);
  });

  it('càng xa thì depth càng lớn', () => {
    const c = cam();
    expect(c.depthOf([-5, 0, 0])).toBeGreaterThan(c.depthOf([0, 0, 0]));
    expect(c.depthOf([5, 0, 0])).toBeLessThan(c.depthOf([0, 0, 0]));
  });

  it('phối cảnh: vật xa trông nhỏ hơn', () => {
    const c = cam();
    const near = Math.abs(c.project([2, 0, 1]).y - c.project([2, 0, 0]).y);
    const far = Math.abs(c.project([-2, 0, 1]).y - c.project([-2, 0, 0]).y);
    expect(near).toBeGreaterThan(far);
    expect(c.scaleAt([2, 0, 0])).toBeGreaterThan(c.scaleAt([-2, 0, 0]));
  });

  it('kích thước và khoảng cách sai thì báo lỗi', () => {
    expect(() => createCamera({ width: 0, height: 10 })).toThrowError(/err.badViewSize/);
    expect(() => createCamera({ width: 10, height: 10, distance: 0 })).toThrowError(/err.badSpan/);
  });

  it('ba trục camera đôi một vuông góc và dài 1', () => {
    const c = cam({ yaw: 0.7, pitch: 0.4 });
    for (const v of [c.forward, c.right, c.up]) expect(len(v)).toBeCloseTo(1, 9);
    expect(dot(c.forward, c.right)).toBeCloseTo(0, 9);
    expect(dot(c.forward, c.up)).toBeCloseTo(0, 9);
    expect(dot(c.right, c.up)).toBeCloseTo(0, 9);
  });

  it('camera luôn nhìn về điểm ngắm', () => {
    const c = cam({ yaw: 1.2, pitch: 0.6, target: [1, 2, 3] });
    const toTarget = unit(sub([1, 2, 3], c.eye));
    expect(dot(toTarget, c.forward)).toBeCloseTo(1, 9);
  });
});

describe('xoay và phóng to', () => {
  it('orbit đổi góc nhưng giữ khoảng cách', () => {
    const c = orbit(cam(), 0.5, 0.2);
    expect(c.yaw).toBeCloseTo(0.5, 9);
    expect(c.pitch).toBeCloseTo(0.2, 9);
    expect(c.distance).toBe(10);
    expect(c.project([0, 0, 0]).x).toBeCloseTo(200, 6);   // điểm ngắm vẫn ở tâm
  });

  it('pitch bị chặn để camera không lật ngược', () => {
    expect(clampPitch(99)).toBeCloseTo(PITCH_LIMIT, 9);
    expect(clampPitch(-99)).toBeCloseTo(-PITCH_LIMIT, 9);
    expect(orbit(cam(), 0, 99).pitch).toBeLessThanOrEqual(PITCH_LIMIT);
  });

  it('zoom bị chặn trong khoảng cho phép', () => {
    expect(zoom(cam(), 0.5).distance).toBe(5);
    expect(zoom(cam(), 0.01).distance).toBe(4);
    expect(zoom(cam(), 100).distance).toBe(40);
  });

  it('zoom gần thì vật trông to ra', () => {
    const far = cam().project([0, 2, 0]).x;
    const near = zoom(cam(), 0.5).project([0, 2, 0]).x;
    expect(Math.abs(near - 200)).toBeGreaterThan(Math.abs(far - 200));
  });
});

describe('tia và mặt phẳng', () => {
  it('tia qua tâm màn hình đi thẳng tới điểm ngắm', () => {
    const c = cam();
    const r = c.rayFrom([200, 200]);
    expect(dot(r.dir, c.forward)).toBeCloseTo(1, 9);
  });

  it('giao tia với mặt phẳng', () => {
    const plane = planeThrough([0, 0, 0], [0, 0, 1]);
    const hit = rayPlane({ origin: [0, 0, 5], dir: [0, 0, -1] }, plane);
    expect(hit).toEqual([0, 0, 0]);
  });

  it('tia song song hoặc cắt phía sau thì không có giao', () => {
    const plane = planeThrough([0, 0, 0], [0, 0, 1]);
    expect(rayPlane({ origin: [0, 0, 5], dir: [1, 0, 0] }, plane)).toBe(null);
    expect(rayPlane({ origin: [0, 0, 5], dir: [0, 0, 1] }, plane)).toBe(null);
  });

  it('kéo điểm: điểm mới vẫn nằm trên mặt phẳng vuông góc hướng nhìn', () => {
    const c = cam({ yaw: 0.8, pitch: 0.4 });
    const start = [1, 1, 1];
    const moved = dragOnScreenPlane(c, [230, 180], start);
    expect(moved).not.toBe(null);
    // cùng độ sâu ⇒ vẫn nằm trên mặt phẳng màn hình đi qua điểm cũ
    expect(c.depthOf(moved)).toBeCloseTo(c.depthOf(start), 6);
  });

  it('kéo tới đúng chỗ con trỏ', () => {
    const c = cam({ yaw: 0.8, pitch: 0.4 });
    const moved = dragOnScreenPlane(c, [230, 180], [1, 1, 1]);
    const back = c.project(moved);
    expect(back.x).toBeCloseTo(230, 4);
    expect(back.y).toBeCloseTo(180, 4);
  });
});

describe('chọn điểm bằng chuột', () => {
  it('bắt đúng điểm gần con trỏ', () => {
    const c = cam();
    const pts = [[0, 0, 0], [0, 0, 3]];
    expect(pick3d(c, [200, 200], pts)).toBe(0);
    expect(pick3d(c, c.project(pts[1]).x ? [c.project(pts[1]).x, c.project(pts[1]).y] : [0, 0], pts)).toBe(1);
    expect(pick3d(c, [10, 10], pts)).toBe(-1);
  });

  it('bỏ qua điểm nằm sau lưng camera', () => {
    const c = cam();
    expect(pick3d(c, [200, 200], [[20, 0, 0]])).toBe(-1);
  });
});
