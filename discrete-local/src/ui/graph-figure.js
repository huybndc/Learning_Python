import { NAMES } from '../logic/graph.js';

/* ---------------------------------------------------------------
   HÌNH ĐỒ THỊ (SVG): đỉnh xếp đều trên một vòng tròn — không có 3 đỉnh thẳng hàng nên không
   cạnh nào đi xuyên qua đỉnh khác. Dùng cho đề (figure type 'graph') và công cụ đồ thị.
     { graphs: [{ n, edges, labels?, title?, color?: (0|1|-1)[], hot?: [[a, b]] }] }
     color: tô hai phía (lớp c0 / c1); hot: cạnh tô đỏ (hai đầu cùng màu, …).
   --------------------------------------------------------------- */

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 220, R = 82, VR = 14;

function svgEl(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
}

function drawOne({ n, edges, labels, title, color = [], hot = [] }) {
  const pos = Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [SIZE / 2 + R * Math.cos(t), SIZE / 2 + R * Math.sin(t)];
  });
  const isHot = (a, b) => hot.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const svg = svgEl('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, width: SIZE, height: SIZE, class: 'graph-fig', role: 'img' });
  for (const [a, b] of edges) {
    svg.append(svgEl('line', { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], class: 'gf-e' + (isHot(a, b) ? ' hot' : '') }));
  }
  pos.forEach(([x, y], i) => {
    const g = svgEl('g', { class: 'gf-v' + (color[i] >= 0 ? ' c' + color[i] : '') });
    g.append(svgEl('circle', { cx: x, cy: y, r: VR }), svgEl('text', { x, y, dy: '0.35em' }, (labels ?? NAMES)[i]));
    svg.append(g);
  });
  const box = document.createElement('figure');
  box.className = 'graph-box';
  box.append(svg);
  if (title) box.append(Object.assign(document.createElement('figcaption'), { textContent: title }));
  return box;
}

export function graphFigure({ graphs }) {
  const row = document.createElement('div');
  row.className = 'graph-row';
  row.append(...graphs.map(drawOne));
  return row;
}
