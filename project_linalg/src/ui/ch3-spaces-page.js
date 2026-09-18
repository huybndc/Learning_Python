import { $, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { fmtVec } from '../logic/num-format.js';
import { columns } from '../logic/matrix.js';
import { columnSpaceBasis, nullSpaceBasis, dimensions, spanKind } from '../logic/subspace.js';
import { parseNumber } from '../logic/answer-check.js';
import { createCamera } from '../geometry/space3d.js';
import { createBoard, clear } from './canvas2d.js';
import { renderScene, axesItems, floorGridItems } from './canvas3d.js';
import { enableOrbit } from './drag3d.js';
import { renderMatrixInputs } from './matrix-view.js';
import { spanItems, SPAN_KIND_KEYS } from './span-draw.js';

/* Chương 3 — Ví dụ 2: vẽ C(A) và N(A) của cùng một ma trận lên cùng một hình.
   Đây là chỗ hai mặt phẳng có thể cắt nhau, nên phần cắt đa giác ở
   geometry/polygon3d.js mới có đất dùng. */

const PRESETS = {
  rank1: [[1, 2, 3], [2, 4, 6], [-1, -2, -3]],
  rank2: [[1, 0, 1], [0, 1, 1], [0, 0, 0]],
  rank3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
};
const WHY_KEYS = { 1: 'c3.whyRank1', 2: 'c3.whyRank2', 3: 'c3.whyRank3' };

const S = { A: PRESETS.rank2.map(r => r.slice()), board: null, cam: null };

const makeCam = board => createCamera({
  width: board.view.width, height: board.view.height,
  yaw: -0.7, pitch: 0.5, distance: 14,
});

function draw(board) {
  if (!S.cam || S.cam.width !== board.view.width) S.cam = makeCam(board);
  const colBasis = columnSpaceBasis(S.A);
  const nulBasis = nullSpaceBasis(S.A);
  clear(board);
  renderScene(board, S.cam, [
    ...floorGridItems(4, 1),
    ...axesItems(4.5),
    ...spanItems(colBasis, { color: '--accent', size: 3.4 }),
    ...spanItems(nulBasis, { color: '--bad', size: 3.4 }),
    ...columns(S.A).map((c, i) => ({
      kind: 'arrow', from: [0, 0, 0], to: c, color: '--accent', width: 2.5, alpha: 0.9,
      text: 'a' + (i + 1),
    })),
    ...nulBasis.map((v, i) => ({
      kind: 'arrow', from: [0, 0, 0], to: v, color: '--bad', width: 2.5,
      text: 'n' + (i + 1),
    })),
    { kind: 'point', at: [0, 0, 0], color: '--ink-dim', r: 3 },
  ]);
}

function renderText() {
  const d = dimensions(S.A);
  const colBasis = columnSpaceBasis(S.A);
  const nulBasis = nullSpaceBasis(S.A);
  renderReadout($('#e3-spaces-out'), [
    [T('c3.lblRank'), d.rank],
    [T('c3.lblColSpace'), T(SPAN_KIND_KEYS[spanKind(colBasis.length ? colBasis : [[0, 0, 0]])]), 'v1'],
    [T('c3.lblDimCol'), d.colDim],
    [T('c3.lblBasisCol'), colBasis.map(fmtVec).join(' , ') || '—'],
    [T('c3.lblNullSpace'), T(SPAN_KIND_KEYS[spanKind(nulBasis.length ? nulBasis : [[0, 0, 0]])]), 'v2'],
    [T('c3.lblDimNull'), d.nullDim],
    [T('c3.lblBasisNull'), nulBasis.map(fmtVec).join(' , ') || '—'],
  ]);
  $('#e3-rank-law').textContent = T('c3.rankLaw', { rank: d.rank, nul: d.nullDim, cols: d.cols });
  $('#e3-spaces-why').textContent = WHY_KEYS[d.rank] ? T(WHY_KEYS[d.rank]) : '';
}

function refresh() {
  draw(S.board);
  renderText();
}

function onEdit(M) {
  $('#e3-err').textContent = M ? '' : T('c3.errMatrix');
  if (!M) return;
  S.A = M;
  refresh();
}

export function setupCh3SpacesPage() {
  S.board = createBoard($('#e3-spaces'), { onRedraw: b => { S.cam = makeCam(b); draw(b); } });
  S.cam = makeCam(S.board);
  enableOrbit($('#e3-spaces'), {
    camera: () => S.cam,
    setCamera: c => { S.cam = c; draw(S.board); },
  });
  renderMatrixInputs($('#e3-input'), S.A, onEdit, { augmented: false });
  $('#e3-preset').addEventListener('change', e => {
    S.A = PRESETS[e.target.value].map(r => r.slice());
    $('#e3-err').textContent = '';
    renderMatrixInputs($('#e3-input'), S.A, onEdit, { augmented: false });
    refresh();
  });
  onLangChange(renderText);
  refresh();
}
