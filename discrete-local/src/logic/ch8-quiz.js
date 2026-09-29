/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D8 — Đồ thị (MCS 12, đếm đường đi MCS 10.3; Rosen 10.1–10.5, 11.1). Thuần.
   Đồ thị sinh ngẫu nhiên; đáp án luôn TÍNH lại bằng graph.js (BFS, Havel–Hakimi, vét cạn đẳng cấu),
   không tin nhãn "muốn sinh loại gì". Hình vẽ: q.figure = { type: 'graph', graphs: [{ n, edges, labels? }] }.
   --------------------------------------------------------------- */

import {
  name, degrees, adjMatrix, matPow, bfs, shortestPath, components, twoColor, eulerKind, havelHakimi,
  isomorphism, differingInvariant, randomGraph, randomConnected, relabel, twoSwitch,
} from './graph.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, int, shuffle } from '@shared/logic/shuffle.js';
import { parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['degree', 'valid', 'special', 'walks', 'dist', 'comp', 'bipartite', 'euler', 'tree', 'iso'];
export const GROUPS = [
  { id: 'g-deg', kinds: ['degree', 'valid', 'special'] },
  { id: 'g-path', kinds: ['walks', 'dist', 'comp'] },
  { id: 'g-struct', kinds: ['bipartite', 'euler', 'tree', 'iso'] },
];
export const SECONDS = { degree: 45, valid: 120, special: 45, walks: 150, dist: 90, comp: 60, bipartite: 90, euler: 90, tree: 60, iso: 180 };

const YES_NO = ['c8q.yes', 'c8q.no'];
const set = vs => '{' + vs.map(name).join(', ') + '}';
const fig = (...graphs) => ({ type: 'graph', graphs });
const fmtMat = M => '[' + M.map(r => r.join(' ')).join('; ') + ']';
const numLabels = n => Array.from({ length: n }, (_, i) => String(i + 1));

/* ---------------- bậc & các đồ thị thường gặp ---------------- */

function makeDegree(rnd) {
  const n = int(5, 8, rnd);
  const g = randomGraph(n, int(n - 1, n + 4, rnd), rnd);
  const deg = degrees(g).sort((a, b) => b - a);
  const sum = deg.reduce((s, x) => s + x, 0);
  return {
    kind: 'degree', format: 'number', textKey: 'c8q.qDegree', textParams: { seq: deg.join(', ') }, answer: g.edges.length,
    hintKey: 'c8q.hDegree',
    work: [L('s8.handshake'), `${deg.join(' + ')} = ${sum}`, `|E| = ${sum} / 2 = ${sum / 2}`],
  };
}

function makeValid(rnd) {
  const n = int(5, 7, rnd);
  const want = pick(['ok', 'odd', 'hh'], rnd);
  let seq, H;
  for (;;) {
    seq = degrees(randomGraph(n, int(n, n + 4, rnd), rnd));
    if (want === 'odd') seq[int(0, n - 1, rnd)] += 1;
    if (want === 'hh') { const [i, j] = shuffle([...seq.keys()], rnd); seq[i] += 1; seq[j] += 1; }
    seq.sort((a, b) => b - a);
    H = havelHakimi(seq);
    const got = !H.parity ? 'odd' : H.ok ? 'ok' : 'hh';
    if (got === want && seq[0] > 0) break;
  }
  const sum = seq.reduce((s, x) => s + x, 0);
  const work = [L('s8.parity', {}, `${seq.join(' + ')} = ${sum}`)];
  if (!H.parity) work.push(L('s8.oddSum'));
  else work.push(L('s8.hh'), ...H.steps.map(s => `(${s.join(', ')})`), L(H.ok ? 's8.hhOk' : 's8.hhBad'));
  return {
    kind: 'valid', format: 'choice', textKey: 'c8q.qValid', textParams: { seq: seq.join(', ') },
    choices: YES_NO, answer: H.ok ? 0 : 1, hintKey: 'c8q.hValid', work,
  };
}

function makeSpecial(rnd) {
  const t = pick(['K', 'C', 'L', 'Kmn'], rnd);
  const n = int(t === 'C' ? 3 : 4, 12, rnd), m = int(2, 7, rnd);
  const [g, value, rule] = {
    K: [`K${sub(n)}`, n * (n - 1) / 2, `${n}·${n - 1} / 2`],
    C: [`C${sub(n)}`, n, `${n}`],
    L: [`L${sub(n)}`, n - 1, `${n} − 1`],
    Kmn: [`K${sub(m)},${sub(n)}`, m * n, `${m}·${n}`],
  }[t];
  return {
    kind: 'special', format: 'number', textKey: 'c8q.qSpecial', textParams: { g }, answer: value, hintKey: 'c8q.hSpecial',
    work: [L('s8.sp.' + t), `|E(${g})| = ${rule} = ${value}`],
  };
}

const sub = k => String(k).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);

/* ---------------- đường đi, khoảng cách, liên thông ---------------- */

function makeWalks(rnd) {
  const n = int(4, 5, rnd), k = pick([2, 3], rnd);
  const g = randomConnected(n, int(1, 3, rnd), rnd);
  const A = adjMatrix(g), P = matPow(A, k);
  const u = int(0, n - 1, rnd), v = int(0, n - 1, rnd);
  const kp = k === 2 ? '²' : '³';
  const work = [L('s8.walkRule', { k, kp }), `A = ${fmtMat(A)}`, `A² = ${fmtMat(matPow(A, 2))}`];
  if (k === 3) work.push(`A³ = A²·A = ${fmtMat(P)}`);
  work.push(L('s8.readEntry', { u: name(u), v: name(v), kp }, `${P[u][v]}`));
  return {
    kind: 'walks', format: 'number', textKey: 'c8q.qWalks', textParams: { k, u: name(u), v: name(v) },
    answer: P[u][v], figure: fig(g), hintKey: 'c8q.hWalks', work,
  };
}

function makeDist(rnd) {
  for (;;) {
    const n = int(6, 8, rnd);
    const g = randomConnected(n, int(1, 3, rnd), rnd);
    const s = int(0, n - 1, rnd), { dist, layers } = bfs(g, s);
    const far = dist.flatMap((d, v) => (d >= 2 ? [v] : []));
    if (!far.length) continue;
    const t = pick(far, rnd);
    return {
      kind: 'dist', format: 'number', textKey: 'c8q.qDist', textParams: { s: name(s), t: name(t) },
      answer: dist[t], figure: fig(g), hintKey: 'c8q.hDist',
      work: [
        L('s8.bfs', { s: name(s) }),
        ...layers.slice(0, dist[t] + 1).map((l, i) => `${i}: ${l.map(name).join(', ')}`),
        L('s8.path', { t: name(t), d: dist[t] }, shortestPath(g, s, t).map(name).join(' – ')),
      ],
    };
  }
}

function makeComp(rnd) {
  for (;;) {
    const n = int(7, 9, rnd);
    const g = randomGraph(n, int(n - 4, n - 1, rnd), rnd);
    const cs = components(g);
    if (cs.length < 2 || cs.length > 4) continue;
    return {
      kind: 'comp', format: 'number', textKey: 'c8q.qComp', textParams: {}, answer: cs.length,
      figure: fig(g), hintKey: 'c8q.hComp',
      work: [L('s8.comps'), ...cs.map(set), L('s8.count', {}, `${cs.length}`)],
    };
  }
}

/* ---------------- hai phía, Euler, cây, đẳng cấu ---------------- */

function makeBipartite(rnd) {
  const want = rnd() < 0.5;
  let g, C;
  do {
    const n = int(5, 7, rnd);
    g = randomConnected(n, int(1, 3, rnd), rnd);
    C = twoColor(g);
  } while (C.ok !== want);
  const side = c => C.color.flatMap((x, v) => (x === c ? [v] : []));
  const work = [L('s8.color')];
  if (C.ok) work.push(`X = ${set(side(0))}`, `Y = ${set(side(1))}`, L('s8.bipOk'));
  else {
    const cyc = C.cycle.map(name);
    work.push(L('s8.clash', { u: name(C.clash[0]), v: name(C.clash[1]) }), L('s8.oddCycle', { len: cyc.length }, [...cyc, cyc[0]].join(' – ')));
  }
  return {
    kind: 'bipartite', format: 'choice', textKey: 'c8q.qBipartite', textParams: {}, choices: YES_NO, answer: C.ok ? 0 : 1,
    figure: fig(g), hintKey: 'c8q.hBipartite', work,
  };
}

const EULER = ['circuit', 'path', 'none'];
function makeEuler(rnd) {
  const want = pick(EULER, rnd);
  let g, E;
  do {
    g = randomConnected(int(5, 7, rnd), int(1, 5, rnd), rnd);
    E = eulerKind(g);
  } while (E.kind !== want);
  const deg = degrees(g);
  return {
    kind: 'euler', format: 'choice', textKey: 'c8q.qEuler', textParams: {},
    choices: EULER.map(k => 'c8q.eu.' + k), answer: EULER.indexOf(E.kind), figure: fig(g), hintKey: 'c8q.hEuler',
    work: [
      L('s8.degs'), deg.map((d, v) => `deg ${name(v)} = ${d}`).join(',  '),
      L('s8.odd', { n: E.odd.length }, E.odd.length ? set(E.odd) : '∅'),
      L('s8.eu.' + E.kind),
    ],
  };
}

function makeTree(rnd) {
  const t = pick(['forest', 'cut', 'leaves'], rnd);
  if (t === 'leaves') {
    const n = int(6, 9, rnd);
    const g = randomConnected(n, 0, rnd);
    const leaves = degrees(g).flatMap((d, v) => (d === 1 ? [v] : []));
    return {
      kind: 'tree', format: 'number', textKey: 'c8q.qLeaves', textParams: {}, answer: leaves.length,
      figure: fig(g), hintKey: 'c8q.hTree', formatKey: 'c8q.f_tree',
      work: [L('s8.leaves'), set(leaves), L('s8.count', {}, `${leaves.length}`)],
    };
  }
  const n = int(8, 40, rnd);
  if (t === 'forest') {
    const c = int(2, 6, rnd);
    return {
      kind: 'tree', format: 'number', textKey: 'c8q.qForest', textParams: { n, c }, answer: n - c, hintKey: 'c8q.hTree',
      work: [L('s8.forest'), `|E| = ${n} − ${c} = ${n - c}`],
    };
  }
  const m = n - 1 + int(1, 9, rnd);
  return {
    kind: 'tree', format: 'number', textKey: 'c8q.qCut', textParams: { n, m }, answer: m - n + 1, hintKey: 'c8q.hTree',
    work: [L('s8.spanning', { n }), `${m} − (${n} − 1) = ${m - n + 1}`],
  };
}

function makeIso(rnd) {
  const want = rnd() < 0.5;
  for (;;) {
    const n = int(5, 6, rnd);
    const G = randomConnected(n, int(1, 3, rnd), rnd);
    const H0 = want ? G : twoSwitch(G, rnd);
    if (!H0) continue;
    const H = relabel(H0, rnd), f = isomorphism(G, H);
    if (!!f !== want) continue;
    const d = f ? null : differingInvariant(G, H);
    if (!f && !d) continue;                  // không đẳng cấu thì phải có bất biến khác nhau người học tự kiểm được (D46)
    const hl = numLabels(n), deg = g => degrees(g).sort((a, b) => b - a).join(', ');
    const work = [L('s8.isoDeg'), `G: ${deg(G)}`, `H: ${deg(H)}`];
    if (f) work.push(L('s8.isoMap'), G.edges.map(([a, b]) => `${name(a)}${name(b)} → ${hl[f[a]]}${hl[f[b]]}`).join(',  '), L('s8.isoOk'));
    else work.push(L('s8.inv.' + d.id, { g: String(d.g), h: String(d.h) }));
    return {
      kind: 'iso', format: 'choice', textKey: 'c8q.qIso', textParams: {}, choices: YES_NO, answer: f ? 0 : 1,
      figure: fig({ ...G, title: 'G' }, { ...H, labels: hl, title: 'H' }), hintKey: 'c8q.hIso',
      work,
    };
  }
}

const MAKERS = {
  degree: makeDegree, valid: makeValid, special: makeSpecial, walks: makeWalks, dist: makeDist, comp: makeComp,
  bipartite: makeBipartite, euler: makeEuler, tree: makeTree, iso: makeIso,
};

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c8q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.format === 'choice') return { ok: Number(given) === q.answer };
  const n = parseNumber(given);
  if (n === null) return { retry: true, detailKey: 'run.needNumber' };
  return { ok: n === q.answer };
}
