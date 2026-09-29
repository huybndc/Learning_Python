import { $, ht } from '@shared/ui/dom.js';
import { fail } from '@shared/logic/app-error.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';
import { parseEdges, name, NAMES, degrees, adjMatrix, matPow, bfs, components, twoColor, eulerKind } from '../logic/graph.js';
import { graphFigure } from './graph-figure.js';

/* ---------------------------------------------------------------
   CÔNG CỤ ĐỒ THỊ (D8, mục Công cụ): gõ danh sách cạnh → hình vẽ + mọi thứ chương D8 hỏi:
   bậc & bắt tay, BFS từ một đỉnh, thành phần, hai phía (tô màu / chu trình lẻ tô đỏ), Euler, cây, Aᵏ.
   Markup ở pages/ch8.html; mọi phép tính từ logic/graph.js.
   --------------------------------------------------------------- */

const set = vs => '{' + vs.map(name).join(', ') + '}';

function fact(host, label, value) {
  const d = ht('div', 'gt-fact');
  d.append(ht('span', 'muted', label + ' '), ht('span', 'mono', value));
  host.append(d);
}

function matrixTable(M, n) {
  const t = ht('table', 'grid');
  const head = ht('tr');
  head.append(ht('th'), ...Array.from({ length: n }, (_, j) => ht('th', null, name(j))));
  t.append(ht('thead'), ht('tbody'));
  t.tHead.append(head);
  M.forEach((r, i) => {
    const tr = ht('tr');
    tr.append(ht('th', null, name(i)), ...r.map(x => ht('td', x ? 'val-1' : 'val-0', String(x))));
    t.tBodies[0].append(tr);
  });
  const box = ht('div', 'tblbox');
  box.append(t);
  return box;
}

function draw() {
  const fig = $('#t8-fig'), facts = $('#t8-facts');
  fig.replaceChildren(); facts.replaceChildren(); $('#t8-err').textContent = '';
  try {
    const g = parseEdges($('#t8-edges').value);
    const s = NAMES.indexOf($('#t8-s').value.trim().toLowerCase());
    if (s < 0 || s >= g.n) fail('t8.badStart', { last: name(g.n - 1) });
    const k = Number($('#t8-k').value);
    if (!Number.isInteger(k) || k < 1 || k > 6) fail('t8.badK');

    const deg = degrees(g), C = twoColor(g), E = eulerKind(g), comps = components(g), B = bfs(g, s);
    const cyc = C.ok ? [] : C.cycle.map((v, i) => [v, C.cycle[(i + 1) % C.cycle.length]]);
    fig.append(graphFigure({ graphs: [{ ...g, color: C.ok ? C.color : [], hot: cyc }] }));

    const sum = deg.reduce((a, b) => a + b, 0);
    fact(facts, T('t8.size'), `n = ${g.n}, |E| = ${g.edges.length}`);
    fact(facts, T('t8.deg'), deg.map((d, v) => `${name(v)}:${d}`).join('  ') + `  (Σ = ${sum} = 2·${g.edges.length})`);
    fact(facts, T('t8.bfs', { s: name(s) }), B.layers.map((l, i) => `${i}: ${l.map(name).join(',')}`).join('  |  '));
    fact(facts, T('t8.comps', { c: comps.length }), comps.map(set).join('  '));
    fact(facts, T('t8.bip'), C.ok
      ? `X = ${set(C.color.flatMap((c, v) => (c === 0 ? [v] : [])))},  Y = ${set(C.color.flatMap((c, v) => (c === 1 ? [v] : [])))}`
      : T('t8.oddCycle', { c: [...C.cycle, C.cycle[0]].map(name).join('–') }));
    fact(facts, T('t8.euler'), T('c8q.eu.' + E.kind) + (E.odd.length ? ` — ${T('t8.odd')} ${set(E.odd)}` : ''));
    fact(facts, T('t8.cycles'), T(g.edges.length === g.n - comps.length ? (comps.length === 1 ? 't8.isTree' : 't8.isForest') : 't8.hasCycle'));
    facts.append(ht('p', 'small muted gt-mat', T('t8.walks', { k })), matrixTable(matPow(adjMatrix(g), k), g.n));
  } catch (e) {
    fig.replaceChildren(); facts.replaceChildren();
    $('#t8-err').textContent = T('err.prefix') + tError(e);
  }
}

export function setupGraphTool() {
  ['#t8-edges', '#t8-s', '#t8-k'].forEach(sel => $(sel).addEventListener('input', draw));
  onLangChange(draw);
  draw();
}
