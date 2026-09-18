import { el } from './dom-helpers.js';
import { fmt } from '../logic/num-format.js';
import { parseNumber } from '../logic/answer-check.js';

/* Hiển thị và nhập ma trận — dùng chung cho tab Ví dụ và tab Tương tác.
   Cột cuối của ma trận mở rộng được vạch riêng bằng đường kẻ dọc. */

const bracket = cls => el('div', cls);

function grid(cols) {
  const g = el('div', 'matgrid');
  g.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  return g;
}

function wrap(inner) {
  const box = el('div', 'matbox');
  box.append(bracket('brk'), inner, bracket('brk r'));
  return box;
}

/**
 * Vẽ ma trận ở dạng chỉ đọc.
 * @param opt.augmented  cột cuối là vế phải b (vạch phân cách)
 * @param opt.pivot      { row, col } tô đậm ô trụ
 * @param opt.changed    danh sách chỉ số hàng vừa bị thay đổi
 */
export function renderMatrix(host, M, { augmented = true, pivot = null, changed = [] } = {}) {
  host.innerHTML = '';
  if (!M || !M.length) return;
  const cols = M[0].length;
  const g = grid(cols);
  M.forEach((row, i) => row.forEach((v, j) => {
    const cell = el('div', 'cell', fmt(v));
    if (augmented && j === cols - 1) cell.classList.add('aug');
    if (pivot && pivot.row === i && pivot.col === j) cell.classList.add('pivot');
    if (changed.includes(i)) cell.classList.add('chg');
    if (v === 0) cell.classList.add('zero');
    g.appendChild(cell);
  }));
  host.appendChild(wrap(g));
}

/**
 * Vẽ ô nhập cho ma trận mở rộng. onChange nhận ma trận mới, hoặc null nếu có ô
 * không phải số — trang gọi tự quyết định báo lỗi thế nào.
 */
export function renderMatrixInputs(host, M, onChange, { augmented = true } = {}) {
  host.innerHTML = '';
  const cols = M[0].length;
  const g = grid(cols);
  const inputs = [];

  const collect = () => {
    const out = inputs.map(row => row.map(inp => parseNumber(inp.value)));
    onChange(out.flat().some(v => v === null) ? null : out);
  };

  M.forEach((row, i) => {
    inputs.push([]);
    row.forEach((v, j) => {
      const inp = el('input');
      inp.type = 'text';
      inp.value = fmt(v);
      inp.setAttribute('aria-label', `a${i + 1}${j + 1}`);
      if (augmented && j === cols - 1) inp.classList.add('aug');
      inp.addEventListener('input', collect);
      inputs[i].push(inp);
      g.appendChild(inp);
    });
  });
  host.appendChild(wrap(g));
  return inputs;
}

/** Danh sách hàng bị đổi bởi một phép biến đổi — để tô sáng đúng chỗ. */
export function changedRows(op) {
  if (!op) return [];
  if (op.type === 'swap') return [op.i, op.j];
  return [op.i];
}
