import { $, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { add, scale, dot, norm, angleDeg, projection, scalarProjection } from '../logic/vector.js';
import { fmt, fmtVec } from '../logic/num-format.js';
import { parseNumbers } from '../logic/answer-check.js';
import { parallelogram, easeInOut } from '../geometry/plane2d.js';
import { createBoard, clear, grid, axes, polygon, dot as drawDot } from './canvas2d.js';
import { drawVector, drawAngleArc, drawProjection } from './vector-draw.js';
import { animate } from './drag.js';

/* Khoá i18n viết thẳng ra thành bảng tra, không ghép chuỗi — như vậy test
   i18n mới soi được là khoá nào đã có bản dịch. */
const STEP_KEYS = ['c1.step0', 'c1.step1', 'c1.step2'];
const SIGN_KEYS = { pos: 'c1.signPos', zero: 'c1.signZero', neg: 'c1.signNeg' };
const WHY_KEYS = { pos: 'c1.whyPos', zero: 'c1.whyZero', neg: 'c1.whyNeg' };

/* Chương 1 — Ví dụ: (1) cộng vector có animation nối đuôi, (2) tích vô hướng
   nhìn bằng hình chiếu. Hai bảng vẽ độc lập nhau, dùng chung tầng canvas2d. */

/* ----------------------------- (1) CỘNG VECTOR ----------------------------- */

const A = { v: [3, 1], w: [-1, 2], t: 1, board: null, stop: null };

/** Ba chặng: vẽ v → dời w tới đầu v → chốt tổng và hình bình hành. */
function drawAdd(board) {
  const { v, w } = A;
  const sum = add(v, w);
  const p = A.t * 3;                      // 0…3, mỗi đơn vị là một chặng
  clear(board); grid(board); axes(board);

  if (p >= 2) {
    polygon(board, parallelogram(v, w), { fill: '--ok', alpha: 0.12 });
    drawVector(board, [0, 0], w, { color: '--warn', width: 1.5, dash: [5, 4], alpha: 0.5 });
    drawVector(board, w, sum, { color: '--accent', width: 1.5, dash: [5, 4], alpha: 0.5 });
  }
  drawVector(board, [0, 0], scale(Math.min(1, p), v), { color: '--accent', text: p >= 0.9 ? 'v' : null });
  if (p >= 1) {
    const k = Math.min(1, p - 1);
    drawVector(board, v, add(v, scale(k, w)),
      { color: '--warn', text: k > 0.9 ? 'w' : null, labelAt: 'mid' });
  }
  if (p >= 2) {
    const k = easeInOut(Math.min(1, p - 2));
    drawVector(board, [0, 0], scale(k, sum), { color: '--ok', width: 3.5, text: k > 0.9 ? 'v + w' : null });
  }
  drawDot(board, [0, 0], { color: '--ink-dim', r: 3 });
}

function updateAddText() {
  const { v, w } = A;
  const sum = add(v, w);
  renderReadout($('#e1-add-out'), [
    ['v', fmtVec(v), 'v1'],
    ['w', fmtVec(w), 'v2'],
    [T('c1.lblSum'), fmtVec(sum), 'sum'],
    [T('c1.lblLenV'), fmt(norm(v))],
    [T('c1.lblLenW'), fmt(norm(w))],
    ['‖v + w‖', fmt(norm(sum))],
  ]);
  const phase = A.t < 1 / 3 ? 0 : A.t < 2 / 3 ? 1 : 2;
  $('#e1-add-step').textContent = T(STEP_KEYS[phase]);
}

function playAdd() {
  if (A.stop) A.stop();
  A.stop = animate(1800, t => {
    A.t = t;
    drawAdd(A.board);
    updateAddText();
  });
}

/** Đọc ô nhập toạ độ; sai thì báo và giữ nguyên giá trị cũ. */
function readInputs() {
  const err = $('#e1-err');
  const v = parseNumbers($('#e1-v').value);
  const w = parseNumbers($('#e1-w').value);
  if (!v || v.length !== 2 || !w || w.length !== 2) {
    err.textContent = T('c1.errVec');
    return false;
  }
  err.textContent = '';
  A.v = v; A.w = w;
  return true;
}

function setupAdd() {
  A.board = createBoard($('#e1-add'), { span: 6, onRedraw: b => { drawAdd(b); } });
  const onEdit = () => { if (readInputs()) playAdd(); };
  $('#e1-v').addEventListener('change', onEdit);
  $('#e1-w').addEventListener('change', onEdit);
  $('#e1-play').addEventListener('click', () => { readInputs(); playAdd(); });
  playAdd();
}

/* --------------------------- (2) TÍCH VÔ HƯỚNG --------------------------- */

/* Góc trên slider đo TỪ w chứ không từ trục x: nhờ vậy kéo tới 90° là rơi
   đúng vào trường hợp v·w = 0 — trường hợp đáng nhớ nhất của cả chương. */
const D = { w: [4, 1], len: 3.2, deg: 35, board: null };

const vOf = () => {
  // không làm tròn toạ độ ở đây: làm tròn sẽ phá mất tính vuông góc, và v·w ở
  // 90° sẽ ra 0.0001 thay vì 0. Việc làm tròn để hiển thị là của fmt().
  const r = (D.deg * Math.PI) / 180 + Math.atan2(D.w[1], D.w[0]);
  return [D.len * Math.cos(r), D.len * Math.sin(r)];
};

function drawDotBoard(board) {
  const v = vOf(), w = D.w;
  clear(board); grid(board); axes(board);
  drawVector(board, [0, 0], w, { color: '--warn', text: 'w' });
  drawProjection(board, v, w, { color: '--proj' });
  drawVector(board, [0, 0], v, { color: '--accent', text: 'v' });
  drawAngleArc(board, [0, 0], v, w, { text: fmt(angleDeg(v, w)) + '°' });
  drawDot(board, [0, 0], { color: '--ink-dim', r: 3 });
}

function updateDotText() {
  const v = vOf(), w = D.w;
  const d = dot(v, w);
  renderReadout($('#e1-dot-out'), [
    ['v', fmtVec(v), 'v1'],
    ['w', fmtVec(w), 'v2'],
    [T('c1.lblDot'), fmt(d), d > 1e-9 ? 'sum' : d < -1e-9 ? 'v2' : ''],
    [T('c1.lblLenV'), fmt(norm(v))],
    [T('c1.lblLenW'), fmt(norm(w))],
    [T('c1.lblCos'), fmt(d / (norm(v) * norm(w)))],
    [T('c1.lblAngle'), fmt(angleDeg(v, w)) + '°'],
    [T('c1.lblProj'), fmt(scalarProjection(v, w)), 'proj'],
  ]);
  const kind = Math.abs(d) < 1e-6 ? 'zero' : d > 0 ? 'pos' : 'neg';
  const badge = $('#e1-dot-sign');
  badge.textContent = T(SIGN_KEYS[kind]);
  badge.className = 'badge ' + (kind === 'zero' ? 'warn' : kind === 'pos' ? 'ok' : 'bad');
  $('#e1-dot-why').textContent = T(WHY_KEYS[kind]);
  $('#e1-ang-out').textContent = D.deg + '°';
}

function refreshDot() {
  drawDotBoard(D.board);
  updateDotText();
}

function setupDot() {
  D.board = createBoard($('#e1-dot'), { span: 5.5, onRedraw: drawDotBoard });
  $('#e1-ang').addEventListener('input', e => {
    D.deg = Number(e.target.value);
    refreshDot();
  });
  refreshDot();
}

export function setupCh1ExamplePage() {
  setupAdd();
  setupDot();
  onLangChange(() => {
    updateAddText();
    updateDotText();
  });
}
