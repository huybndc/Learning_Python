import { createView, gridLines, niceStep } from '../geometry/plane2d.js';
import { cssVar } from './dom-helpers.js';

/* ---------------------------------------------------------------
   BẢNG VẼ CANVAS 2D — tầng ui/: nơi duy nhất đụng tới canvas context.
   Nhận toạ độ toán học (y hướng lên), tự đổi sang pixel qua geometry/.
   Màu lấy từ biến CSS nên tự đúng ở cả light mode lẫn dark mode.
   --------------------------------------------------------------- */

const DEFAULT_SPAN = 6;

/**
 * Gắn một canvas thành "bảng vẽ". Tự co giãn theo bề ngang khung chứa và
 * tự vẽ lại (onRedraw) khi kích thước đổi — canvas nét ở cả màn hình retina.
 */
export function createBoard(canvas, { span = DEFAULT_SPAN, center = [0, 0], onRedraw } = {}) {
  const ctx = canvas.getContext('2d');
  const board = { canvas, ctx, view: null, span, center };

  board.fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(160, canvas.clientWidth || canvas.parentElement.clientWidth || 320);
    const h = w;                                   // vuông: giữ tỉ lệ 1:1 cho hình học
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);        // từ đây vẽ bằng toạ độ CSS pixel
    board.view = createView({ width: w, height: h, span: board.span, center: board.center });
    return board.view;
  };

  board.setSpan = s => { board.span = s; board.fit(); };
  board.redraw = () => { if (onRedraw) onRedraw(board); };

  board.fit();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      // tab đang ẩn thì clientWidth = 0: giữ nguyên kích thước cũ, khỏi vẽ lại vô ích
      if (!canvas.clientWidth) return;
      board.fit();
      board.redraw();
    }).observe(canvas);
  }
  return board;
}

/* --------------------------- nguyên liệu vẽ --------------------------- */

const px = (board, p) => board.view.toPixel(p);

function stroke(ctx, { color = '--ink', width = 2, dash = null, alpha = 1 }) {
  ctx.strokeStyle = color.startsWith('--') ? cssVar(color) : color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.setLineDash(dash || []);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function clear(board) {
  const { ctx, view } = board;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, board.canvas.width, board.canvas.height);
  ctx.restore();
  ctx.fillStyle = cssVar('--panel2');
  ctx.fillRect(0, 0, view.width, view.height);
}

/** Lưới ô vuông. Bỏ trống step thì tự chọn bước "đẹp". */
export function grid(board, step) {
  const { ctx, view } = board;
  const s = step || niceStep(view.bounds.xMax - view.bounds.xMin, 10);
  const { xs, ys } = gridLines(view, s);
  ctx.save();
  stroke(ctx, { color: '--line', width: 1 });
  ctx.beginPath();
  for (const x of xs) {
    const a = px(board, [x, view.bounds.yMin]), b = px(board, [x, view.bounds.yMax]);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  }
  for (const y of ys) {
    const a = px(board, [view.bounds.xMin, y]), b = px(board, [view.bounds.xMax, y]);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
  ctx.restore();
  return s;
}

/** Hai trục toạ độ, có vạch số. */
export function axes(board, step) {
  const { ctx, view } = board;
  const s = step || niceStep(view.bounds.xMax - view.bounds.xMin, 10);
  const o = px(board, [0, 0]);
  ctx.save();
  stroke(ctx, { color: '--line-strong', width: 1.5 });
  ctx.beginPath();
  ctx.moveTo(px(board, [view.bounds.xMin, 0])[0], o[1]);
  ctx.lineTo(px(board, [view.bounds.xMax, 0])[0], o[1]);
  ctx.moveTo(o[0], px(board, [0, view.bounds.yMin])[1]);
  ctx.lineTo(o[0], px(board, [0, view.bounds.yMax])[1]);
  ctx.stroke();

  ctx.fillStyle = cssVar('--ink-dim');
  ctx.font = '11px ui-monospace,Menlo,Consolas,monospace';
  ctx.globalAlpha = 1;
  const { xs, ys } = gridLines(view, s);
  const EDGE = 14;                                 // sát mép quá thì chữ số bị cắt
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const x of xs) {
    const [cx] = px(board, [x, 0]);
    if (x !== 0 && cx > EDGE && cx < view.width - EDGE) ctx.fillText(String(x), cx, o[1] + 4);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const y of ys) {
    const cy = px(board, [0, y])[1];
    if (y !== 0 && cy > EDGE && cy < view.height - EDGE) ctx.fillText(String(y), o[0] - 5, cy);
  }
  ctx.restore();
}

export function segment(board, a, b, opt = {}) {
  const { ctx } = board;
  const [p, q] = [px(board, a), px(board, b)];
  ctx.save();
  stroke(ctx, opt);
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
  ctx.stroke();
  ctx.restore();
}

/** Đa giác kín: tô nền mờ và/hoặc viền. */
export function polygon(board, pts, { fill = null, alpha = 0.16, ...opt } = {}) {
  const { ctx } = board;
  if (pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  pts.map(p => px(board, p)).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill.startsWith('--') ? cssVar(fill) : fill;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  if (opt.color) { stroke(ctx, opt); ctx.stroke(); }
  ctx.restore();
}

export function dot(board, p, { color = '--accent', r = 4, hollow = false } = {}) {
  const { ctx } = board;
  const c = px(board, p);
  ctx.save();
  ctx.beginPath();
  ctx.arc(c[0], c[1], r, 0, Math.PI * 2);
  if (hollow) {
    ctx.fillStyle = cssVar('--panel2'); ctx.fill();
    stroke(ctx, { color, width: 2 }); ctx.stroke();
  } else {
    ctx.fillStyle = color.startsWith('--') ? cssVar(color) : color;
    ctx.fill();
  }
  ctx.restore();
}

/** Cung tròn bán kính tính bằng pixel (dùng cho ký hiệu góc). */
export function arcPx(board, centerWorld, radiusPx, a0, a1, opt = {}) {
  const { ctx } = board;
  const c = px(board, centerWorld);
  ctx.save();
  stroke(ctx, opt);
  ctx.beginPath();
  // góc trên canvas ngược chiều góc toán học vì trục y hướng xuống
  ctx.arc(c[0], c[1], radiusPx, -a0, -a1, true);
  ctx.stroke();
  ctx.restore();
}

/** Nhãn chữ đặt cạnh một điểm; dx/dy tính bằng pixel. */
export function label(board, p, text, { color = '--ink', dx = 8, dy = -8, bold = true, bg = true } = {}) {
  const { ctx } = board;
  const [x, y] = px(board, p);
  ctx.save();
  ctx.font = (bold ? 'bold ' : '') + '13px ui-monospace,Menlo,Consolas,monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (bg) {
    const w = ctx.measureText(text).width;
    ctx.fillStyle = cssVar('--panel2');
    ctx.globalAlpha = 0.78;
    ctx.fillRect(x + dx - 3, y + dy - 8, w + 6, 16);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = color.startsWith('--') ? cssVar(color) : color;
  ctx.fillText(text, x + dx, y + dy);
  ctx.restore();
}
