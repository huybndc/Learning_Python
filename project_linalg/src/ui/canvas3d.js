import { arrowHead } from '../geometry/plane2d.js';
import { splitAll, sortForPainter, splitSegment, polygonPlane } from '../geometry/polygon3d.js';
import { cssVar } from './dom-helpers.js';

/* ---------------------------------------------------------------
   VẼ CẢNH 3D BẰNG CANVAS 2D.
   Cảnh được mô tả bằng một danh sách "vật" (mặt phẳng, mũi tên, đoạn, điểm),
   geometry/ lo chiếu và sắp thứ tự, còn file này chỉ lo nét vẽ. Nhờ vậy toàn
   bộ phần toán của 3D vẫn test được bằng Node, không cần WebGL.
   --------------------------------------------------------------- */

const col = c => (c && c.startsWith('--') ? cssVar(c) : c) || '#888';

/** Mọi vật đều khai báo `points` để sắp thứ tự vẽ theo độ sâu. */
function pointsOf(item) {
  if (item.poly) return item.poly;
  if (item.from && item.to) return [item.from, item.to];
  if (item.at) return [item.at];
  return [];
}

function drawPoly(ctx, cam, item) {
  const pts = item.poly.map(p => cam.project(p));
  if (pts.some(p => !p.visible)) return;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (item.color) {
    ctx.fillStyle = col(item.color);
    ctx.globalAlpha = item.alpha ?? 0.22;
    ctx.fill();
  }
  if (item.stroke) {
    ctx.strokeStyle = col(item.stroke);
    ctx.globalAlpha = item.strokeAlpha ?? 0.7;
    ctx.lineWidth = item.width ?? 1.5;
    ctx.setLineDash(item.dash || []);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}

function drawSeg(ctx, cam, item) {
  const a = cam.project(item.from), b = cam.project(item.to);
  if (!a.visible || !b.visible) return;
  ctx.strokeStyle = col(item.color);
  ctx.globalAlpha = item.alpha ?? 1;
  ctx.lineWidth = item.width ?? 2;
  ctx.setLineDash(item.dash || []);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawArrow(ctx, cam, item) {
  const a = cam.project(item.from), b = cam.project(item.to);
  if (!a.visible || !b.visible) return;
  drawSeg(ctx, cam, item);
  const { tip, left, right } = arrowHead([a.x, a.y], [b.x, b.y], item.head ?? 11);
  ctx.fillStyle = col(item.color);
  ctx.globalAlpha = item.alpha ?? 1;
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.lineTo(left[0], left[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPoint(ctx, cam, item) {
  const p = cam.project(item.at);
  if (!p.visible) return;
  ctx.beginPath();
  ctx.arc(p.x, p.y, item.r ?? 4, 0, Math.PI * 2);
  if (item.hollow) {
    ctx.fillStyle = cssVar('--panel2');
    ctx.fill();
    ctx.strokeStyle = col(item.color);
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = col(item.color);
    ctx.fill();
  }
}

/** Nhãn luôn vẽ sau cùng để không bị mặt phẳng nào che mất. */
function drawLabel(ctx, cam, at, text, color) {
  const p = cam.project(at);
  if (!p.visible) return;
  ctx.font = 'bold 13px ui-monospace,Menlo,Consolas,monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  ctx.fillStyle = cssVar('--panel2');
  ctx.globalAlpha = 0.75;
  ctx.fillRect(p.x + 6, p.y - 16, w + 6, 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = col(color);
  ctx.fillText(text, p.x + 9, p.y - 8);
}

const DRAW = { poly: drawPoly, seg: drawSeg, arrow: drawArrow, point: drawPoint };

/**
 * Đoạn thẳng đi xuyên qua một mặt phẳng thì cắt làm đôi, để nửa nằm sau mặt
 * được vẽ trước — nhờ vậy nhìn ra được chỗ nào đường chui sau mặt phẳng.
 * Mũi tên không cắt vì cắt xong thì mất đầu mũi tên.
 */
function cutSegments(items, planes) {
  let out = items;
  for (const plane of planes) {
    const next = [];
    for (const it of out) {
      if (it.kind !== 'seg') { next.push(it); continue; }
      const halves = splitSegment(it.from, it.to, plane);
      if (halves) next.push(...halves.map(([a, b]) => ({ ...it, from: a, to: b })));
      else next.push(it);
    }
    out = next;
  }
  return out;
}

/**
 * Vẽ cả cảnh: cắt các mặt phẳng cắt nhau, sắp xa→gần, rồi vẽ; nhãn vẽ sau cùng.
 */
export function renderScene(board, cam, items) {
  const { ctx } = board;
  const polys = items.filter(it => it.kind === 'poly');
  const others = items.filter(it => it.kind !== 'poly');
  const pieces = polys.length > 1 ? splitAll(polys) : polys;
  const planes = polys.map(p => polygonPlane(p.poly)).filter(Boolean);

  const all = [...pieces, ...cutSegments(others, planes)].map(it => ({ ...it, points: pointsOf(it) }));
  for (const item of sortForPainter(all, cam.depthOf)) {
    const fn = DRAW[item.kind];
    if (fn) fn(ctx, cam, item);
  }
  for (const item of items) {
    if (item.text) drawLabel(ctx, cam, item.at || item.to, item.text, item.color);
  }
}

/** Ba trục toạ độ, phần dương vẽ đậm hơn phần âm. */
export function axesItems(len = 4) {
  const axis = (v, name) => [
    { kind: 'seg', from: [0, 0, 0], to: v.map(x => -x * len), color: '--line-strong', width: 1, alpha: 0.5 },
    { kind: 'arrow', from: [0, 0, 0], to: v.map(x => x * len), color: '--line-strong', width: 1.4, head: 8, text: name },
  ];
  return [
    ...axis([1, 0, 0], 'x'),
    ...axis([0, 1, 0], 'y'),
    ...axis([0, 0, 1], 'z'),
  ];
}

/** Lưới ô vuông nằm trên mặt phẳng z = 0, làm mốc cho mắt nhìn độ sâu. */
export function floorGridItems(size = 4, step = 1) {
  const out = [];
  for (let v = -size; v <= size; v += step) {
    out.push(
      { kind: 'seg', from: [v, -size, 0], to: [v, size, 0], color: '--line', width: 1, alpha: 0.55 },
      { kind: 'seg', from: [-size, v, 0], to: [size, v, 0], color: '--line', width: 1, alpha: 0.55 },
    );
  }
  return out;
}

/** Đoạn nét đứt gióng từ một điểm xuống mặt phẳng z = 0 — giúp đọc độ cao. */
export const dropLineItem = (p, color = '--ink-dim') => ({
  kind: 'seg', from: p, to: [p[0], p[1], 0], color, width: 1, dash: [4, 4], alpha: 0.65,
});
