import { fail } from '../logic/app-error.js';

/* ---------------------------------------------------------------
   CAMERA 3D THUẦN — chiếu điểm trong R³ xuống mặt phẳng màn hình.

   Quy ước: trục z hướng lên (như cách vẽ R³ trong sách), camera quay quanh
   một điểm ngắm theo hai góc: yaw (quay quanh trục z) và pitch (nâng lên/hạ
   xuống). Tất cả ở đây là hàm thuần — không đụng canvas, không đụng DOM —
   nên kiểm chứng được bằng test Node như mọi module khác.
   --------------------------------------------------------------- */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (k, a) => [k * a[0], k * a[1], k * a[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => {
  const n = len(a);
  if (n < 1e-12) fail('err.zeroVector', {});
  return mul(1 / n, a);
};

export { sub, add, mul, dot, cross, len, unit };

/** Giới hạn pitch để camera không lật ngược qua đỉnh. */
export const PITCH_LIMIT = Math.PI / 2 - 0.05;

export const clampPitch = p => Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, p));

/**
 * Camera quay quanh điểm ngắm.
 * @param yaw/pitch  radian
 * @param distance   khoảng cách từ camera tới điểm ngắm
 * @param fov        góc mở dọc, radian
 */
export function createCamera({
  yaw = 0.9, pitch = 0.55, distance = 14, target = [0, 0, 0], fov = Math.PI / 4,
  width = 400, height = 400,
} = {}) {
  if (!(distance > 0)) fail('err.badSpan', { span: distance });
  if (!(width > 0) || !(height > 0)) fail('err.badViewSize', { width, height });

  const p = clampPitch(pitch);
  const dir = [Math.cos(p) * Math.cos(yaw), Math.cos(p) * Math.sin(yaw), Math.sin(p)];
  const eye = add(target, mul(distance, dir));
  const forward = mul(-1, dir);                     // nhìn từ eye về target
  const worldUp = [0, 0, 1];
  const right = unit(cross(forward, worldUp));
  const up = cross(right, forward);                 // đã là vector đơn vị
  const focal = (height / 2) / Math.tan(fov / 2);
  const [cx, cy] = [width / 2, height / 2];
  const NEAR = 0.05;

  /** Điểm 3D → toạ độ pixel. visible = false nếu nằm sau lưng camera. */
  function project(pt) {
    const d = sub(pt, eye);
    const depth = dot(d, forward);
    if (depth <= NEAR) return { x: 0, y: 0, depth, visible: false };
    return {
      x: cx + focal * dot(d, right) / depth,
      y: cy - focal * dot(d, up) / depth,
      depth,
      visible: true,
    };
  }

  /** Độ sâu của một điểm (càng lớn càng xa) — dùng để sắp thứ tự vẽ. */
  const depthOf = pt => dot(sub(pt, eye), forward);

  /** Tia đi từ camera qua một điểm trên màn hình — dùng để kéo–thả trong 3D. */
  function rayFrom([sx, sy]) {
    const dirRay = unit(add(add(mul(focal, forward), mul(sx - cx, right)), mul(-(sy - cy), up)));
    return { origin: eye, dir: dirRay };
  }

  /**
   * Bán kính pixel của một đoạn dài 1 đơn vị đặt tại `pt` — để chấm/nhãn giữ
   * kích thước hợp lý theo độ sâu.
   */
  const scaleAt = pt => {
    const depth = depthOf(pt);
    return depth > NEAR ? focal / depth : 0;
  };

  return {
    yaw, pitch: p, distance, target, fov, width, height,
    eye, forward, right, up, focal,
    project, depthOf, rayFrom, scaleAt,
  };
}

/** Camera mới sau khi kéo chuột: đổi góc nhìn chứ không đổi cảnh. */
export function orbit(cam, dYaw, dPitch) {
  return createCamera({
    ...cam, yaw: cam.yaw + dYaw, pitch: clampPitch(cam.pitch + dPitch),
  });
}

/** Camera mới sau khi phóng to/thu nhỏ. */
export function zoom(cam, factor, min = 4, max = 40) {
  return createCamera({ ...cam, distance: Math.min(max, Math.max(min, cam.distance * factor)) });
}

/** Mặt phẳng {n·x = d} qua một điểm với pháp tuyến cho trước. */
export function planeThrough(point, normal) {
  const n = unit(normal);
  return { n, d: dot(n, point) };
}

/** Giao của tia với mặt phẳng; null nếu tia song song hoặc cắt ở phía sau. */
export function rayPlane(ray, plane) {
  const denom = dot(ray.dir, plane.n);
  if (Math.abs(denom) < 1e-9) return null;
  const t = (plane.d - dot(ray.origin, plane.n)) / denom;
  return t > 0 ? add(ray.origin, mul(t, ray.dir)) : null;
}

/**
 * Kéo một điểm trong 3D: chiếu tia chuột lên mặt phẳng đi qua điểm cũ và
 * vuông góc với hướng nhìn. Đây là cách kéo tự nhiên nhất — điểm luôn đi theo
 * con trỏ, còn độ sâu thì giữ nguyên.
 */
export function dragOnScreenPlane(cam, screenPt, currentPoint) {
  const plane = planeThrough(currentPoint, cam.forward);
  return rayPlane(cam.rayFrom(screenPt), plane);
}

/** Điểm 3D nào nằm gần con trỏ nhất (trong bán kính pixel)? -1 nếu không có. */
export function pick3d(cam, screenPt, points, radiusPx = 16) {
  let best = -1, bestScore = radiusPx;
  points.forEach((p, i) => {
    const s = cam.project(p);
    if (!s.visible) return;
    const dist = Math.hypot(s.x - screenPt[0], s.y - screenPt[1]);
    if (dist <= bestScore) { bestScore = dist; best = i; }
  });
  return best;
}
