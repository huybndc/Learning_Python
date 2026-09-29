/* ---------------------------------------------------------------
   ĐỒ THỊ ĐƠN VÔ HƯỚNG (MCS 12, đếm đường đi MCS 10.3; Rosen 10.1–10.5, 11.1) — thuần.
   Đồ thị = { n, edges: [[i, j], …] } với đỉnh 0 … n−1, i < j, không khuyên, không cạnh lặp.
   Tên đỉnh hiện ra là chữ a, b, c… (NAMES). Mọi hàm trả kèm dữ liệu để in lời giải từng bước.
   --------------------------------------------------------------- */

import { fail } from '@shared/logic/app-error.js';
import { shuffle } from '@shared/logic/shuffle.js';

export const NAMES = 'abcdefghijklmnopqrstuvwxyz';
export const name = i => NAMES[i];

const key = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);

/** Chuẩn hoá: mỗi cạnh i < j, sắp xếp, bỏ trùng. */
export function makeGraph(n, edges) {
  const seen = new Map();
  for (const [a, b] of edges) if (a !== b) seen.set(key(a, b), a < b ? [a, b] : [b, a]);
  return { n, edges: [...seen.values()].sort((x, y) => x[0] - y[0] || x[1] - y[1]) };
}

/**
 * Đọc danh sách cạnh kiểu "ab, bc, c-d, e" (chữ thường; một chữ đứng riêng = đỉnh cô lập).
 * Đỉnh là a … (chữ lớn nhất xuất hiện) — n = số chữ tới chữ lớn nhất, để tên đỉnh không bị đổi.
 */
export function parseEdges(text) {
  const tokens = String(text).toLowerCase().split(/[\s,;]+/).map(t => t.replace(/[-–—]/g, '')).filter(Boolean);
  if (!tokens.length) fail('err.graphEmpty');
  const edges = [];
  let n = 0;
  for (const t of tokens) {
    if (!/^[a-z]{1,2}$/.test(t)) fail('err.graphToken', { t });
    const [a, b] = [...t].map(c => NAMES.indexOf(c));
    if (b === a) fail('err.graphLoop', { t });
    n = Math.max(n, a + 1, (b ?? 0) + 1);
    if (b !== undefined) edges.push([a, b]);
  }
  if (n > 12) fail('err.graphBig');
  return makeGraph(n, edges);
}

export const formatEdges = g => g.edges.map(([a, b]) => name(a) + name(b)).join(', ');

export function neighbors(g) {
  const adj = Array.from({ length: g.n }, () => []);
  for (const [a, b] of g.edges) { adj[a].push(b); adj[b].push(a); }
  adj.forEach(l => l.sort((x, y) => x - y));
  return adj;
}

export const degrees = g => neighbors(g).map(l => l.length);

export function adjMatrix(g) {
  const A = Array.from({ length: g.n }, () => Array(g.n).fill(0));
  for (const [a, b] of g.edges) A[a][b] = A[b][a] = 1;
  return A;
}

export const matMul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));

/** Aᵏ (k ≥ 1): phần tử (u, v) = số đường đi (walk) dài k từ u tới v. */
export function matPow(A, k) {
  let P = A;
  for (let i = 1; i < k; i++) P = matMul(P, A);
  return P;
}

/** BFS từ s: dist[v] (−1 nếu không tới được), các tầng [[s], [bậc 1], …], cha để dựng đường ngắn nhất. */
export function bfs(g, s) {
  const adj = neighbors(g);
  const dist = Array(g.n).fill(-1), parent = Array(g.n).fill(-1);
  dist[s] = 0;
  const layers = [[s]];
  while (layers.at(-1).length) {
    const next = [];
    for (const u of layers.at(-1)) for (const v of adj[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; parent[v] = u; next.push(v); }
    layers.push(next.sort((x, y) => x - y));
  }
  layers.pop();
  return { dist, layers, parent };
}

/** Đường ngắn nhất s → t (danh sách đỉnh) hoặc null. */
export function shortestPath(g, s, t) {
  const { dist, parent } = bfs(g, s);
  if (dist[t] < 0) return null;
  const path = [t];
  while (path[0] !== s) path.unshift(parent[path[0]]);
  return path;
}

/** Các thành phần liên thông, mỗi cái là danh sách đỉnh tăng dần; xếp theo đỉnh nhỏ nhất. */
export function components(g) {
  const seen = Array(g.n).fill(false), out = [];
  for (let s = 0; s < g.n; s++) {
    if (seen[s]) continue;
    const c = bfs(g, s).layers.flat().sort((x, y) => x - y);
    c.forEach(v => { seen[v] = true; });
    out.push(c);
  }
  return out;
}

/**
 * Tô 2 màu bằng BFS. Hai phía ⇔ không có chu trình lẻ (MCS 12.5).
 * @returns {{ ok: true, color: number[] } | { ok: false, color: number[], clash: [u, v], cycle: number[] }}
 */
export function twoColor(g) {
  const adj = neighbors(g);
  const color = Array(g.n).fill(-1), parent = Array(g.n).fill(-1);
  for (let s = 0; s < g.n; s++) {
    if (color[s] >= 0) continue;
    color[s] = 0;
    const queue = [s];
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (color[v] < 0) { color[v] = 1 - color[u]; parent[v] = u; queue.push(v); continue; }
        if (color[v] !== color[u]) continue;
        // u, v cùng màu và kề nhau: nối hai đường lên tổ tiên chung ⇒ chu trình lẻ
        const up = x => { const p = [x]; while (parent[p.at(-1)] >= 0) p.push(parent[p.at(-1)]); return p; };
        const pu = up(u), pv = up(v);
        const lca = pu.find(x => pv.includes(x));
        const cycle = [...pu.slice(0, pu.indexOf(lca) + 1), ...pv.slice(0, pv.indexOf(lca)).reverse()];
        return { ok: false, color, clash: [u, v], cycle };
      }
    }
  }
  return { ok: true, color };
}

/** 'circuit' | 'path' | 'none' — Euler: liên thông (bỏ đỉnh cô lập) và số đỉnh bậc lẻ là 0 / 2. */
export function eulerKind(g) {
  const deg = degrees(g);
  const odd = deg.flatMap((d, v) => (d % 2 ? [v] : []));
  const big = components(g).filter(c => c.some(v => deg[v] > 0));
  const connected = big.length <= 1;
  const kind = !connected || g.edges.length === 0 ? 'none' : odd.length === 0 ? 'circuit' : odd.length === 2 ? 'path' : 'none';
  return { kind, odd, connected };
}

/**
 * Havel–Hakimi: dãy bậc có là dãy bậc của đồ thị đơn không. Mỗi bước bỏ số lớn nhất d,
 * trừ 1 vào d số lớn nhất còn lại.
 * @returns {{ ok: boolean, parity: boolean, steps: number[][] }}
 */
export function havelHakimi(seq) {
  const parity = seq.reduce((s, x) => s + x, 0) % 2 === 0;
  const steps = [];
  let cur = [...seq].sort((a, b) => b - a);
  for (;;) {
    steps.push(cur);
    if (cur.some(x => x < 0)) return { ok: false, parity, steps };
    if (cur.every(x => x === 0)) return { ok: true, parity, steps };
    const [d, ...rest] = cur;
    if (d > rest.length) return { ok: false, parity, steps };
    cur = rest.map((x, i) => (i < d ? x - 1 : x)).sort((a, b) => b - a);
  }
}

export const triangles = g => {
  const A = adjMatrix(g);
  let t = 0;
  for (let a = 0; a < g.n; a++) for (let b = a + 1; b < g.n; b++) for (let c = b + 1; c < g.n; c++) t += A[a][b] * A[b][c] * A[a][c];
  return t;
};

const sortedDeg = g => [...degrees(g)].sort((a, b) => b - a);

/** Đẳng cấu: vét cạn các song ánh giữ bậc (n ≤ 8). Trả ánh xạ f (đỉnh G → đỉnh H) hoặc null. */
export function isomorphism(G, H) {
  if (G.n !== H.n || G.edges.length !== H.edges.length || sortedDeg(G).join() !== sortedDeg(H).join()) return null;
  const dg = degrees(G), dh = degrees(H), AG = adjMatrix(G), AH = adjMatrix(H);
  const f = Array(G.n).fill(-1), used = Array(H.n).fill(false);
  const go = u => {
    if (u === G.n) return true;
    for (let v = 0; v < H.n; v++) {
      if (used[v] || dg[u] !== dh[v]) continue;
      if (f.slice(0, u).some((fw, w) => AG[u][w] !== AH[v][fw])) continue;
      f[u] = v; used[v] = true;
      if (go(u + 1)) return true;
      used[v] = false;
    }
    f[u] = -1;
    return false;
  };
  return go(0) ? f : null;
}

/** Bất biến đầu tiên khác nhau giữa hai đồ thị (để giải thích vì sao không đẳng cấu). */
export function differingInvariant(G, H) {
  const tests = [
    ['vertices', g => g.n], ['edges', g => g.edges.length], ['degrees', g => sortedDeg(g).join(', ')],
    ['components', g => components(g).length], ['triangles', triangles], ['bipartite', g => twoColor(g).ok],
  ];
  for (const [id, fn] of tests) if (fn(G) !== fn(H)) return { id, g: fn(G), h: fn(H) };
  return null;
}

/* ---------------- sinh đồ thị ngẫu nhiên cho đề ---------------- */

/** Đồ thị ngẫu nhiên n đỉnh, m cạnh. */
export function randomGraph(n, m, rnd) {
  const all = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b]);
  return makeGraph(n, shuffle(all, rnd).slice(0, Math.min(m, all.length)));
}

/** Liên thông: cây ngẫu nhiên rồi thêm `extra` cạnh. */
export function randomConnected(n, extra, rnd) {
  const order = shuffle([...Array(n).keys()], rnd);
  const edges = order.slice(1).map((v, i) => [v, order[Math.floor(rnd() * (i + 1))]]);
  const tree = makeGraph(n, edges);
  const rest = randomGraph(n, n * n, rnd).edges.filter(([a, b]) => !tree.edges.some(([x, y]) => x === a && y === b));
  return makeGraph(n, [...tree.edges, ...rest.slice(0, extra)]);
}

/** Đổi nhãn đỉnh theo hoán vị ngẫu nhiên — đồ thị đẳng cấu nhưng trông khác. */
export function relabel(g, rnd) {
  const p = shuffle([...Array(g.n).keys()], rnd);
  return makeGraph(g.n, g.edges.map(([a, b]) => [p[a], p[b]]));
}

/** Hoán đổi 2 cạnh ab, cd → ac, bd (giữ nguyên dãy bậc) — thường ra đồ thị KHÔNG đẳng cấu cùng dãy bậc. */
export function twoSwitch(g, rnd) {
  const has = (x, y) => g.edges.some(([a, b]) => key(a, b) === key(x, y));
  for (let t = 0; t < 50; t++) {
    const [[a, b], [c, d]] = shuffle(g.edges, rnd);
    const [x, y] = rnd() < 0.5 ? [c, d] : [d, c];
    if (new Set([a, b, x, y]).size < 4 || has(a, x) || has(b, y)) continue;
    const drop = new Set([key(a, b), key(c, d)]);
    return makeGraph(g.n, [...g.edges.filter(([p, q]) => !drop.has(key(p, q))), [a, x], [b, y]]);
  }
  return null;
}

