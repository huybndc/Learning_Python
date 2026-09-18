import { $, el, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { fmtVec } from '../logic/num-format.js';
import { rankOfVectors, spanKind, isIndependent } from '../logic/subspace.js';
import { createCamera } from '../geometry/space3d.js';
import { createBoard, clear } from './canvas2d.js';
import { renderScene, axesItems, floorGridItems } from './canvas3d.js';
import { enableOrbit } from './drag3d.js';
import { spanItems, vectorItems, SPAN_KIND_KEYS } from './span-draw.js';

/* Chương 3 — Ví dụ 1: span lớn lên qua 4 bước. Bước 3 là bước đáng giá nhất —
   thêm một vector phụ thuộc mà span không đổi một chút nào. */

const V1 = [2, 1, 0];
const V2 = [0, 1, 2];
const STEPS = [
  { vectors: [V1], key: 'c3.growStep0' },
  { vectors: [V1, V2], key: 'c3.growStep1' },
  { vectors: [V1, V2, [2, 2, 2]], key: 'c3.growStep2' },   // v₃ = v₁ + v₂, phụ thuộc
  { vectors: [V1, V2, [0, 0, 3]], key: 'c3.growStep3' },   // ra khỏi mặt phẳng
];
const LABELS = ['v₁', 'v₂', 'v₃'];

const E = { index: 1, board: null, cam: null, hover: -1 };

const makeCam = board => createCamera({
  width: board.view.width, height: board.view.height,
  yaw: -0.65, pitch: 0.5, distance: 15,
});

function draw(board) {
  if (!E.cam || E.cam.width !== board.view.width) E.cam = makeCam(board);
  const vectors = STEPS[E.index].vectors;
  clear(board);
  renderScene(board, E.cam, [
    ...floorGridItems(4, 1),
    ...axesItems(4.5),
    ...spanItems(vectors, { color: '--ok', size: 3.6 }),
    ...vectorItems(vectors, { labels: LABELS, hover: E.hover }),
    { kind: 'point', at: [0, 0, 0], color: '--ink-dim', r: 3 },
  ]);
}

function renderText() {
  const step = STEPS[E.index];
  const vectors = step.vectors;
  const rank = rankOfVectors(vectors);
  $('#e3-pos').textContent = T('common.stepPos', { i: E.index + 1, n: STEPS.length });
  $('#e3-prev').disabled = E.index === 0;
  $('#e3-next').disabled = E.index === STEPS.length - 1;

  const kind = spanKind(vectors);
  const badge = $('#e3-kind');
  badge.textContent = T(SPAN_KIND_KEYS[kind]);
  badge.className = 'badge ' + (kind === 'space' ? 'ok' : kind === 'plane' ? 'warn' : '');

  const box = $('#e3-step');
  box.innerHTML = '';
  box.className = 'step';
  box.appendChild(el('div', 'why', T(step.key)));

  renderReadout($('#e3-grow-out'), [
    ...vectors.map((v, i) => [LABELS[i], fmtVec(v), ['v1', 'v2', 'proj'][i] || '']),
    [T('c3.lblRank'), rank],
    [T('c3.lblDim'), rank],
    [T('c3.lblIndep'), T(isIndependent(vectors) ? 'c3.yes' : 'c3.no'),
      isIndependent(vectors) ? 'sum' : ''],
  ]);
}

function refresh() {
  draw(E.board);
  renderText();
}

export function setupCh3ExamplePage() {
  E.board = createBoard($('#e3-grow'), { onRedraw: b => { E.cam = makeCam(b); draw(b); } });
  E.cam = makeCam(E.board);
  enableOrbit($('#e3-grow'), {
    camera: () => E.cam,
    setCamera: c => { E.cam = c; draw(E.board); },
  });
  $('#e3-prev').addEventListener('click', () => { E.index = Math.max(0, E.index - 1); refresh(); });
  $('#e3-next').addEventListener('click', () => {
    E.index = Math.min(STEPS.length - 1, E.index + 1);
    refresh();
  });
  onLangChange(renderText);
  refresh();
}
