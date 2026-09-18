import { arrowHead } from '../geometry/plane2d.js';
import { angle as vecAngle, norm, sub, add, scale, projection } from '../logic/vector.js';
import { cssVar } from './dom-helpers.js';
import { segment, arcPx, label, dot } from './canvas2d.js';

/* Vẽ vector và các ký hiệu hình học đi kèm (góc, góc vuông, hình chiếu).
   Tách khỏi canvas2d.js để mỗi file giữ một trách nhiệm. */

/** Mũi tên từ `from` tới `to` (toạ độ toán học), kèm nhãn nếu có. */
export function drawVector(board, from, to, {
  color = '--accent', width = 2.5, dash = null, text = null, head = 12, alpha = 1, labelDx = 9,
  labelAt = 'tip',                                 // 'mid' khi hai mũi tên chung điểm đầu
} = {}) {
  const { ctx } = board;
  const [p, q] = [board.view.toPixel(from), board.view.toPixel(to)];
  if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.5) {
    dot(board, to, { color, r: 4 });               // vector 0: chỉ là một chấm ở gốc
    if (text) label(board, to, text, { color, dx: labelDx });
    return;
  }
  segment(board, from, to, { color, width, dash, alpha });

  const { tip, left, right } = arrowHead(p, q, head);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color.startsWith('--') ? cssVar(color) : color;
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.lineTo(left[0], left[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (text) {
    if (labelAt === 'mid') {
      label(board, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], text, { color, dx: 6, dy: -6 });
    } else {
      // đẩy nhãn ra ngoài theo hướng vector để không đè lên mũi tên
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      label(board, to, text, { color, dx: labelDx * (q[0] - p[0]) / d, dy: 9 * (q[1] - p[1]) / d - 4 });
    }
  }
}

/** Chấm tròn nắm được ở đầu mũi tên — báo hiệu "kéo được". */
export function drawHandle(board, p, { color = '--accent', active = false } = {}) {
  dot(board, p, { color, r: active ? 7 : 5, hollow: true });
}

/** Cung đánh dấu góc giữa hai vector u, v cùng xuất phát từ `at`. */
export function drawAngleArc(board, at, u, v, { color = '--ink-dim', radiusPx = 30, text = null } = {}) {
  if (norm(u) < 1e-9 || norm(v) < 1e-9) return;
  const a0 = Math.atan2(u[1], u[0]);
  const a1 = Math.atan2(v[1], v[0]);
  // đi theo cung nhỏ giữa hai tia
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  arcPx(board, at, radiusPx, a0, a0 + d, { color, width: 1.5 });
  if (text) {
    const mid = a0 + d / 2;
    const r = board.view.lenToWorld(radiusPx + 16);
    label(board, add(at, [r * Math.cos(mid), r * Math.sin(mid)]), text,
      { color, dx: -10, dy: 0, bold: false });
  }
}

/** Ký hiệu góc vuông (ô vuông nhỏ) tại `at`, giữa hai hướng u và v. */
export function drawRightAngle(board, at, u, v, { color = '--ink-dim', sizePx = 12 } = {}) {
  if (norm(u) < 1e-9 || norm(v) < 1e-9) return;
  const s = board.view.lenToWorld(sizePx);
  const un = scale(s / norm(u), u), vn = scale(s / norm(v), v);
  const corner = add(add(at, un), vn);
  segment(board, add(at, un), corner, { color, width: 1.4 });
  segment(board, add(at, vn), corner, { color, width: 1.4 });
}

/**
 * Minh hoạ hình chiếu của a lên b: vector chiếu vẽ đậm, đường gióng vuông góc
 * vẽ nét đứt — đúng hình vẽ quen thuộc khi giải thích dot product.
 */
export function drawProjection(board, a, b, { color = '--ok', from = [0, 0] } = {}) {
  if (norm(b) < 1e-9) return null;
  const p = projection(a, b);
  const foot = add(from, p);
  segment(board, add(from, a), foot, { color: '--ink-dim', width: 1.4, dash: [5, 4] });
  drawVector(board, from, foot, { color, width: 3.5, head: 11 });
  const perp = sub(a, p);
  if (norm(perp) > 1e-6) drawRightAngle(board, foot, scale(-1, p), perp, { color });
  return p;
}

/** Góc giữa hai vector, tính bằng độ — tiện dùng khi ghi nhãn. */
export const degBetween = (u, v) => vecAngle(u, v) * 180 / Math.PI;
