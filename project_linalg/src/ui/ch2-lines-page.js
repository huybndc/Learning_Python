import { $, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { splitAugmented } from '../logic/matrix.js';
import { solve, systemStrings } from '../logic/linear-system.js';
import { fmtVec } from '../logic/num-format.js';
import { clipLine } from '../geometry/plane2d.js';
import { createBoard, clear, grid, axes, segment, dot as drawDot, label } from './canvas2d.js';
import { state, onSystemChange } from './ch2-state.js';

/* Chương 2 — cách nhìn theo hàng: mỗi phương trình 2 ẩn là một đường thẳng,
   nghiệm là giao điểm. Hệ 3 ẩn thì để dành phần vẽ 3D cho Chương 3. */

const COLORS = ['--accent', '--warn', '--ok', '--bad'];
const LINE_NOTE = { unique: 'c2.linesCross', none: 'c2.linesParallel', infinite: 'c2.linesSame' };

const L = { board: null };

/** Chỉ vẽ được khi hệ có đúng 2 ẩn (3 cột: hai hệ số và vế phải). */
const isTwoVar = M => M[0].length === 3;

function drawLines(board) {
  clear(board); grid(board); axes(board);
  const M = state.M;
  if (!isTwoVar(M)) return;

  M.forEach((row, i) => {
    const seg = clipLine(row[0], row[1], row[2], board.view.bounds);
    if (!seg) return;
    const color = COLORS[i % COLORS.length];
    segment(board, seg[0], seg[1], { color, width: 2.5 });
    // nhãn đặt ở giữa đoạn đã cắt theo khung: luôn nằm trong hình, khỏi bị cắt ở góc
    const mid = [(seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2];
    label(board, mid, 'R' + (i + 1), { color, dx: 8, dy: -10 });
  });

  const { A, b } = splitAugmented(M);
  const r = solve(A, b);
  if (r.type === 'unique') {
    drawDot(board, r.solution, { color: '--ok', r: 6 });
    label(board, r.solution, fmtVec(r.solution), { color: '--ok', dx: 10, dy: -12 });
  }
  drawDot(board, [0, 0], { color: '--ink-dim', r: 3 });
}

function updateText() {
  const M = state.M;
  const host = $('#e2-lines-out');
  if (!isTwoVar(M)) {
    renderReadout(host, []);
    $('#e2-lines-note').textContent = T('c2.rowPic3');
    return;
  }
  const { A, b } = splitAugmented(M);
  const eqs = systemStrings(A, b);
  const r = solve(A, b);
  const rows = [
    [T('c2.lblEq1'), eqs[0], 'v1'],
    [T('c2.lblEq2'), eqs[1] || '', 'v2'],
    [T('c2.lblType'), T({ unique: 'c2q.tUnique', infinite: 'c2q.tInfinite', none: 'c2q.tNone' }[r.type])],
  ];
  if (r.type === 'unique') rows.push([T('c2.lblCross'), fmtVec(r.solution), 'sum']);
  renderReadout(host, rows);
  $('#e2-lines-note').textContent = T(LINE_NOTE[r.type]);
}

function refresh() {
  drawLines(L.board);
  updateText();
}

export function setupCh2LinesPage() {
  L.board = createBoard($('#e2-lines'), { span: 6, onRedraw: drawLines });
  onSystemChange(refresh);
  onLangChange(updateText);
  refresh();
}
