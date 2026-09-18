import { $, renderReadout } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { fmtVec } from '../logic/num-format.js';
import { spanKind, rankOfVectors, isIndependent, inSpan } from '../logic/subspace.js';
import { createCamera } from '../geometry/space3d.js';
import { createBoard, clear } from './canvas2d.js';
import { renderScene, axesItems, floorGridItems, dropLineItem } from './canvas3d.js';
import { enableOrbit } from './drag3d.js';
import { spanItems, vectorItems, SPAN_KIND_KEYS } from './span-draw.js';

/* Chương 3 — Tương tác: kéo vector trong R³, xem span đổi hình, và thử xem
   vector b có nằm trong span hay không. Kéo nền trống thì xoay góc nhìn. */

const DEF = { vectors: [[2, 1, 0], [0, 1, 2], [1, 0, 2]], b: [2, 2, 2] };
const LABELS = ['v₁', 'v₂', 'v₃'];

const S = {
  vectors: DEF.vectors.map(v => v.slice()),
  b: DEF.b.slice(),
  count: 2,
  hover: -1,
  board: null,
  cam: null,
};

const active = () => S.vectors.slice(0, S.count);
const showB = () => $('#i3-showb').checked;
/** Các điểm kéo được: đầu mỗi vector đang hiện, rồi tới b nếu đang hiện. */
const handles = () => (showB() ? [...active(), S.b] : active());

const makeCam = board => createCamera({
  width: board.view.width, height: board.view.height,
  yaw: -0.65, pitch: 0.5, distance: 15,
});

function draw(board) {
  if (!S.cam || S.cam.width !== board.view.width) S.cam = makeCam(board);
  const vs = active();
  const items = [
    ...floorGridItems(4, 1),
    ...axesItems(4.5),
    ...spanItems(vs, { color: '--ok', size: 3.6, show: $('#i3-showpatch').checked }),
    ...vectorItems(vs, { labels: LABELS, hover: S.hover }),
    { kind: 'point', at: [0, 0, 0], color: '--ink-dim', r: 3 },
  ];
  if (showB()) {
    const inside = inSpan(vs, S.b).inSpan;
    items.push(
      dropLineItem(S.b, '--ok'),
      { kind: 'arrow', from: [0, 0, 0], to: S.b, color: inside ? '--ok' : '--bad', width: 3.5, text: 'b' },
      { kind: 'point', at: S.b, color: inside ? '--ok' : '--bad', r: S.hover === S.count ? 7 : 5, hollow: true },
    );
  }
  clear(board);
  renderScene(board, S.cam, items);
}

function renderText() {
  const vs = active();
  const kind = spanKind(vs);
  const rank = rankOfVectors(vs);
  const rows = vs.map((v, i) => [LABELS[i], fmtVec(v), ['v1', 'v2', 'proj'][i] || '']);
  if (showB()) rows.push(['b', fmtVec(S.b), 'sum']);
  rows.push(
    [T('c3.lblDim'), rank],
    [T('c3.lblIndep'), T(isIndependent(vs) ? 'c3.yes' : 'c3.no'), isIndependent(vs) ? 'sum' : ''],
  );
  renderReadout($('#i3-out'), rows);

  const kindBadge = $('#i3-kind');
  kindBadge.textContent = T('c3.lblSpanKind') + ': ' + T(SPAN_KIND_KEYS[kind]);
  kindBadge.className = 'badge ' + (kind === 'space' ? 'ok' : kind === 'plane' ? 'warn' : '');

  const badge = $('#i3-inspan');
  if (!showB()) {
    badge.style.display = 'none';
    $('#i3-why').textContent = '';
    return;
  }
  badge.style.display = '';
  const r = inSpan(vs, S.b);
  badge.textContent = T(r.inSpan ? 'c3.inSpanYes' : 'c3.inSpanNo');
  badge.className = 'badge ' + (r.inSpan ? 'ok' : 'bad');
  $('#i3-why').textContent = r.inSpan
    ? T('c3.whyInSpan', { coefs: r.coefs.map(c => String(Number(c.toFixed(3)))).join(', ') })
    : T('c3.whyNotInSpan');
}

function refresh() {
  draw(S.board);
  renderText();
}

export function setupCh3InteractivePage() {
  S.board = createBoard($('#i3-span'), { onRedraw: b => { S.cam = makeCam(b); draw(b); } });
  S.cam = makeCam(S.board);
  enableOrbit($('#i3-span'), {
    camera: () => S.cam,
    setCamera: c => { S.cam = c; draw(S.board); },
    handles,
    moveHandle: (i, p) => {
      if (i < S.count) S.vectors[i] = p; else S.b = p;
      refresh();
    },
    onHover: i => { S.hover = i; draw(S.board); },
    snap: 0.5,
  });
  $('#i3-count').addEventListener('change', e => { S.count = Number(e.target.value); refresh(); });
  ['#i3-showb', '#i3-showpatch'].forEach(sel => $(sel).addEventListener('change', refresh));
  $('#i3-reset').addEventListener('click', () => {
    S.vectors = DEF.vectors.map(v => v.slice());
    S.b = DEF.b.slice();
    refresh();
  });
  onLangChange(renderText);
  refresh();
}
