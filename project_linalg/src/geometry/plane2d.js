import { fail } from '../logic/app-error.js';

/* ---------------------------------------------------------------
   TẦNG HÌNH HỌC 2D — chỉ lo "vẽ ở đâu", không đụng DOM và không làm toán
   tuyến tính. logic/ trả về con số; geometry/ đổi số đó thành toạ độ pixel
   để ui/ đưa lên canvas.

   Quy ước: toạ độ thế giới (world) là toạ độ toán học, y hướng lên.
   Toạ độ pixel là toạ độ canvas, y hướng xuống.
   --------------------------------------------------------------- */

/**
 * Khung nhìn giữ tỉ lệ vuông: 1 đơn vị theo x dài đúng bằng 1 đơn vị theo y,
 * nhờ vậy góc vuông trên hình đúng là góc vuông (rất cần khi minh hoạ trực giao).
 * span = số đơn vị tính từ tâm ra mép ngắn nhất.
 */
export function createView({ width, height, span = 6, center = [0, 0] }) {
  if (!(width > 0) || !(height > 0)) fail('err.badViewSize', { width, height });
  if (!(span > 0)) fail('err.badSpan', { span });
  const scale = Math.min(width, height) / (2 * span);
  const [cx, cy] = center;
  const halfW = width / (2 * scale), halfH = height / (2 * scale);

  const toPixel = ([x, y]) => [(x - cx) * scale + width / 2, height / 2 - (y - cy) * scale];
  const toWorld = ([px, py]) => [(px - width / 2) / scale + cx, (height / 2 - py) / scale + cy];

  return {
    width, height, scale, center: [cx, cy],
    bounds: { xMin: cx - halfW, xMax: cx + halfW, yMin: cy - halfH, yMax: cy + halfH },
    toPixel, toWorld,
    /** Đổi một độ dài thế giới sang pixel (và ngược lại). */
    lenToPixel: d => d * scale,
    lenToWorld: d => d / scale,
  };
}

/** Bước lưới "đẹp" (1, 2, 5, 10, 20…) sao cho có khoảng count vạch. */
export function niceStep(range, count = 10) {
  if (!(range > 0)) fail('err.badSpan', { span: range });
  const raw = range / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return mult * mag;
}

/** Danh sách toạ độ vạch lưới nằm trong khung nhìn. */
export function gridLines(view, step) {
  const { xMin, xMax, yMin, yMax } = view.bounds;
  const line = (lo, hi) => {
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
      out.push(Math.abs(v) < 1e-9 ? 0 : Number(v.toFixed(10)));
    }
    return out;
  };
  return { xs: line(xMin, xMax), ys: line(yMin, yMax) };
}

/**
 * Đầu mũi tên: từ hai điểm pixel, trả về 2 cánh của mũi tên.
 * Tính trong không gian pixel để mũi tên luôn cùng cỡ dù zoom thế nào.
 */
export function arrowHead(fromPx, toPx, size = 12, spread = 0.42) {
  const dx = toPx[0] - fromPx[0], dy = toPx[1] - fromPx[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { tip: toPx, left: toPx, right: toPx };
  const a = Math.atan2(dy, dx);
  return {
    tip: toPx,
    left: [toPx[0] - size * Math.cos(a - spread), toPx[1] - size * Math.sin(a - spread)],
    right: [toPx[0] - size * Math.cos(a + spread), toPx[1] - size * Math.sin(a + spread)],
  };
}

const inside = ([x, y], b, eps = 1e-7) =>
  x >= b.xMin - eps && x <= b.xMax + eps && y >= b.yMin - eps && y <= b.yMax + eps;

/**
 * Cắt đường thẳng ax + by = c theo khung nhìn, trả về [P, Q] (toạ độ thế giới)
 * hoặc null nếu đường không cắt khung. Đây là hình của một phương trình trong
 * hệ 2 ẩn — hai đường cắt nhau chính là nghiệm duy nhất.
 */
export function clipLine(a, b, c, bounds) {
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return null;   // 0 = c: không phải đường thẳng
  const { xMin, xMax, yMin, yMax } = bounds;
  const cand = [];
  if (Math.abs(b) > 1e-12) {
    cand.push([xMin, (c - a * xMin) / b], [xMax, (c - a * xMax) / b]);
  }
  if (Math.abs(a) > 1e-12) {
    cand.push([(c - b * yMin) / a, yMin], [(c - b * yMax) / a, yMax]);
  }
  const pts = cand.filter(p => inside(p, bounds));
  if (pts.length < 2) return null;
  // lấy cặp xa nhau nhất để tránh hai điểm trùng ở góc khung
  let best = null, bestD = -1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d > bestD) { bestD = d; best = [pts[i], pts[j]]; }
    }
  }
  return bestD < 1e-9 ? null : best;
}

/** Bốn đỉnh hình bình hành dựng bởi u và v (gốc tại O) — quy tắc cộng vector. */
export const parallelogram = (u, v) => [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v];

/** Điểm gần con trỏ nhất trong danh sách, nếu nằm trong bán kính (pixel). */
export function hitTest(view, pxPoint, worldPoints, radiusPx = 14) {
  let best = -1, bestD = radiusPx;
  worldPoints.forEach((w, i) => {
    const p = view.toPixel(w);
    const d = Math.hypot(p[0] - pxPoint[0], p[1] - pxPoint[1]);
    if (d <= bestD) { bestD = d; best = i; }
  });
  return best;
}

/** Bắt điểm về mắt lưới khi kéo — để toạ độ ra số đẹp. */
export const snap = ([x, y], step = 0.5) =>
  step > 0 ? [Math.round(x / step) * step, Math.round(y / step) * step] : [x, y];

export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpPoint = (p, q, t) => p.map((v, i) => lerp(v, q[i], t));
/** Nội suy mượt hai đầu — dùng cho animation cộng vector, khử Gauss… */
export const easeInOut = t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
