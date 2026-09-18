import { $, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import {
  add, sub, dot, norm, angleDeg, combine, isZero, isOrthogonal, isParallel,
} from '../logic/vector.js';
import { fmt, fmtVec } from '../logic/num-format.js';
import { spanKind } from '../logic/ch1-quiz.js';
import { createBoard, clear, grid, axes, polygon, dot as drawDot } from './canvas2d.js';
import { drawVector, drawHandle, drawAngleArc, drawProjection } from './vector-draw.js';
import { enableDrag } from './drag.js';

/* Chương 1 — Tương tác: (1) kéo v và w rồi đọc số ngay, (2) tổ hợp tuyến tính
   c₁v₁ + c₂v₂ với slider hệ số và span hiện lên bằng chấm mờ. */

/* ------------------------- (1) KÉO HAI VECTOR ------------------------- */

const DEF = { v: [3, 1], w: [-1, 2] };
const S = { v: [...DEF.v], w: [...DEF.w], hover: -1, board: null };

function drawDragBoard(board) {
  const { v, w } = S;
  clear(board); grid(board); axes(board);

  if ($('#i1-sum').checked) {
    polygon(board, [[0, 0], v, add(v, w), w], { fill: '--ok', alpha: 0.1 });
    drawVector(board, [0, 0], add(v, w), { color: '--ok', width: 3, text: 'v + w' });
  }
  if ($('#i1-diff').checked) {
    drawVector(board, w, v, { color: '--bad', width: 2, dash: [6, 4], text: 'v − w' });
  }
  if ($('#i1-proj').checked && !isZero(w)) drawProjection(board, v, w, { color: '--proj' });

  drawVector(board, [0, 0], v, { color: '--accent', text: 'v' });
  drawVector(board, [0, 0], w, { color: '--warn', text: 'w' });
  if (!isZero(v) && !isZero(w)) drawAngleArc(board, [0, 0], v, w, { text: fmt(angleDeg(v, w)) + '°' });
  drawHandle(board, v, { color: '--accent', active: S.hover === 0 });
  drawHandle(board, w, { color: '--warn', active: S.hover === 1 });
  drawDot(board, [0, 0], { color: '--ink-dim', r: 3 });
}

function updateDragText() {
  const { v, w } = S;
  const bothNonZero = !isZero(v) && !isZero(w);
  renderReadout($('#i1-out'), [
    ['v', fmtVec(v), 'v1'],
    ['w', fmtVec(w), 'v2'],
    [T('c1.lblSum'), fmtVec(add(v, w)), 'sum'],
    [T('c1.lblDiff'), fmtVec(sub(v, w))],
    [T('c1.lblLenV'), fmt(norm(v))],
    [T('c1.lblLenW'), fmt(norm(w))],
    [T('c1.lblDot'), fmt(dot(v, w))],
    [T('c1.lblAngle'), bothNonZero ? fmt(angleDeg(v, w)) + '°' : T('c1.undefinedZero')],
  ]);

  const badge = $('#i1-rel');
  if (bothNonZero && isOrthogonal(v, w, 1e-9)) {
    badge.textContent = T('c1.relPerp');
    badge.className = 'badge ok';
  } else if (isParallel(v, w, 1e-9)) {
    badge.textContent = T('c1.relParallel');
    badge.className = 'badge warn';
  } else {
    badge.textContent = T('c1.relFree');
    badge.className = 'badge';
  }
}

function refreshDrag() {
  drawDragBoard(S.board);
  updateDragText();
}

function setupDragBoard() {
  S.board = createBoard($('#i1-drag'), { span: 6, onRedraw: drawDragBoard });
  enableDrag(S.board, () => [S.v, S.w], (i, p) => {
    if (i === 0) S.v = p; else S.w = p;
    refreshDrag();
  }, {
    step: 0.25,
    onHover: i => { S.hover = i; drawDragBoard(S.board); },
  });
  ['#i1-sum', '#i1-diff', '#i1-proj'].forEach(sel =>
    $(sel).addEventListener('change', refreshDrag));
  $('#i1-reset').addEventListener('click', () => {
    S.v = [...DEF.v]; S.w = [...DEF.w];
    refreshDrag();
  });
  refreshDrag();
}

/* --------------------- (2) TỔ HỢP TUYẾN TÍNH --------------------- */

const C = { v1: [2, 1], v2: [-1, 2], c1: 1, c2: 1, hover: -1, board: null };

/** Chấm mờ: các điểm với tới được khi c₁, c₂ chạy trên lưới — chính là span. */
function drawSpanDots(board) {
  const { v1, v2 } = C;
  for (let a = -3; a <= 3; a += 0.5) {
    for (let b = -3; b <= 3; b += 0.5) {
      const p = combine([a, b], [v1, v2]);
      drawDot(board, p, { color: '--ink-dim', r: 1.6 });
    }
  }
}

function drawComboBoard(board) {
  const { v1, v2, c1, c2 } = C;
  clear(board); grid(board); axes(board);
  board.ctx.globalAlpha = 0.45;
  drawSpanDots(board);
  board.ctx.globalAlpha = 1;

  const p1 = combine([c1, 0], [v1, v2]);
  const target = combine([c1, c2], [v1, v2]);
  drawVector(board, [0, 0], p1, { color: '--accent', width: 1.6, dash: [5, 4], alpha: 0.7 });
  drawVector(board, p1, target, { color: '--warn', width: 1.6, dash: [5, 4], alpha: 0.7 });
  drawVector(board, [0, 0], v1, { color: '--accent', text: 'v₁' });
  drawVector(board, [0, 0], v2, { color: '--warn', text: 'v₂' });
  drawVector(board, [0, 0], target, { color: '--ok', width: 3.5, text: 'c₁v₁ + c₂v₂' });
  drawHandle(board, v1, { color: '--accent', active: C.hover === 0 });
  drawHandle(board, v2, { color: '--warn', active: C.hover === 1 });
  drawDot(board, [0, 0], { color: '--ink-dim', r: 3 });
}

function updateComboText() {
  const { v1, v2, c1, c2 } = C;
  $('#i1-c1-out').textContent = fmt(c1);
  $('#i1-c2-out').textContent = fmt(c2);
  renderReadout($('#i1-combo-out'), [
    ['v₁', fmtVec(v1), 'v1'],
    ['v₂', fmtVec(v2), 'v2'],
    ['c₁v₁', fmtVec(combine([c1, 0], [v1, v2]))],
    ['c₂v₂', fmtVec(combine([0, c2], [v1, v2]))],
    [T('c1.lblCombo'), fmtVec(combine([c1, c2], [v1, v2])), 'sum'],
  ]);

  const kind = spanKind(v1, v2);
  const badge = $('#i1-span');
  const nameKey = { plane: 'c1.spanPlane', line: 'c1.spanLine', point: 'c1.spanPoint' }[kind];
  const whyKey = { plane: 'c1.spanWhyPlane', line: 'c1.spanWhyLine', point: 'c1.spanWhyPoint' }[kind];
  badge.textContent = T(nameKey);
  badge.className = 'badge ' + (kind === 'plane' ? 'ok' : 'warn');
  $('#i1-span-why').textContent = T(whyKey);
}

function refreshCombo() {
  drawComboBoard(C.board);
  updateComboText();
}

function setupComboBoard() {
  C.board = createBoard($('#i1-combo'), { span: 6, onRedraw: drawComboBoard });
  enableDrag(C.board, () => [C.v1, C.v2], (i, p) => {
    if (i === 0) C.v1 = p; else C.v2 = p;
    refreshCombo();
  }, {
    step: 0.5,
    onHover: i => { C.hover = i; drawComboBoard(C.board); },
  });
  $('#i1-c1').addEventListener('input', e => { C.c1 = Number(e.target.value); refreshCombo(); });
  $('#i1-c2').addEventListener('input', e => { C.c2 = Number(e.target.value); refreshCombo(); });
  refreshCombo();
}

export function setupCh1InteractivePage() {
  setupDragBoard();
  setupComboBoard();
  onLangChange(() => {
    updateDragText();
    updateComboText();
  });
}
