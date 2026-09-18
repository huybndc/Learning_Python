import { $, el } from './dom-helpers.js';
import {
  allFunctions, evalAllGates, evalFunction,
  nandAssociativityTable, norAssociativityTable,
} from '../logic/logic-gates.js';
import { sopToNand } from '../logic/nand-conversion.js';
import { exprTruthTable } from '../logic/expr-parser.js';

/* Chương 2 — Tương tác: 8 cổng chuẩn, bảng 16 hàm, tính không kết hợp của
   NAND/NOR, và chuyển mạch AND-OR thành toàn NAND. */

const G = { x: 0, y: 0, assoc: 'nand' };

/* ---------------- 8 cổng chuẩn ---------------- */
function renderGates() {
  const host = $('#g-gates');
  host.innerHTML = '';
  evalAllGates(G.x, G.y).forEach(g => {
    const card = el('div', 'gatecard' + (g.value ? ' on' : ''));
    card.appendChild(el('div', 'gname', g.gate));
    card.appendChild(el('div', 'mono small muted', g.symbol));
    card.appendChild(el('div', 'gval', String(g.value)));
    card.title = g.note;
    host.appendChild(card);
  });
}

/* ---------------- Bảng 16 hàm ---------------- */
function renderFunctionTable() {
  const t = $('#g-table');
  t.innerHTML = '';
  const hr = el('tr');
  ['Fᵢ', 'Biểu thức', 'Ký hiệu', '00', '01', '10', '11', 'Nhóm', 'Cổng'].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);

  const row = (G.x << 1) | G.y;
  const tb = el('tbody');
  allFunctions().forEach(f => {
    const tr = el('tr');
    tr.appendChild(el('td', 'muted', 'F' + f.i));
    tr.appendChild(el('td', null, f.expr));
    tr.appendChild(el('td', 'muted', f.op));
    f.rows.forEach((r, k) => {
      const td = el('td', r.f ? 'val-1' : 'val-0', String(r.f));
      if (k === row) td.classList.add('nowcol');
      tr.appendChild(td);
    });
    tr.appendChild(el('td', 'small muted', f.group));
    tr.appendChild(el('td', 'small', f.gate || '—'));
    if (evalFunction(f.i, G.x, G.y) === 1) tr.classList.add('on');
    tb.appendChild(tr);
  });
  t.appendChild(tb);
}

/* ---------------- NAND/NOR không kết hợp ---------------- */
function renderAssoc() {
  const data = G.assoc === 'nand' ? nandAssociativityTable() : norAssociativityTable();
  const sym = G.assoc === 'nand' ? '↑' : '↓';
  const t = $('#g-assoc-table');
  t.innerHTML = '';
  const hr = el('tr');
  ['x', 'y', 'z', `(x ${sym} y) ${sym} z`, `x ${sym} (y ${sym} z)`, 'Bằng nhau?',
    G.assoc === 'nand' ? '(xyz)′ đúng nghĩa' : '(x+y+z)′ đúng nghĩa'].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  data.rows.forEach(r => {
    const tr = el('tr');
    [r.x, r.y, r.z].forEach(v => tr.appendChild(el('td', null, String(v))));
    tr.appendChild(el('td', r.left ? 'val-1' : 'val-0', String(r.left)));
    tr.appendChild(el('td', r.right ? 'val-1' : 'val-0', String(r.right)));
    tr.appendChild(el('td', r.same ? 'ok' : 'bad', r.same ? '✔' : '✘'));
    tr.appendChild(el('td', r.proper ? 'val-1' : 'val-0', String(r.proper)));
    if (!r.same) tr.classList.add('rowbad');
    tb.appendChild(tr);
  });
  t.appendChild(tb);

  const n = $('#g-assoc-note');
  const diff = data.rows.filter(r => !r.same).length;
  n.className = 'small bad';
  n.innerHTML = 'Hai cách ghép đôi khác nhau ở <b>' + diff + '/8</b> dòng ⇒ '
    + G.assoc.toUpperCase() + ' <b>không có tính kết hợp</b>. Vì vậy '
    + G.assoc.toUpperCase() + ' 3 ngõ vào được <b>định nghĩa lại</b> (cột cuối), '
    + 'chứ không phải ghép hai cổng 2 ngõ vào.';
}

/* ---------------- SOP → toàn NAND ---------------- */
function renderNandForm() {
  const expr = $('#g-sop').value.trim();
  const n = +$('#g-sopn').value;
  const host = $('#g-sopsteps');
  host.innerHTML = ''; $('#g-sopcheck').textContent = '';
  if (!expr) { $('#g-soperr').textContent = 'Nhập một biểu thức SOP, ví dụ AB + CD.'; return; }

  let r;
  try {
    r = sopToNand(expr, n);
  } catch (e) {
    $('#g-soperr').textContent = 'Lỗi: ' + e.message;
    return;
  }
  $('#g-soperr').textContent = '';

  r.steps.forEach((s, i) => {
    const d = el('div');
    d.style.margin = '6px 0';
    d.appendChild(el('div', 'mono hl', (i + 1) + '. ' + s.expr));
    d.appendChild(el('div', 'small muted', s.note));
    host.appendChild(d);
  });

  const same = exprTruthTable(r.result, n).join('') === exprTruthTable(expr, n).join('');
  const c = $('#g-sopcheck');
  c.className = 'small ' + (same ? 'ok' : 'bad');
  c.innerHTML = (same ? '✔' : '✘') + ' Cần <b>' + r.gateCount.level1 + '</b> cổng NAND ở tầng 1 và <b>1</b> ở tầng 2'
    + (same ? '; bảng chân trị khớp với F ban đầu.' : '; nhưng bảng chân trị KHÔNG khớp.');
}

export function setupCh2InteractivePage() {
  const seg = (sel, apply) => document.querySelectorAll(sel + ' button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll(sel + ' button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      apply(b);
    });
  });
  seg('#g-x', b => { G.x = +b.dataset.v; renderGates(); renderFunctionTable(); });
  seg('#g-y', b => { G.y = +b.dataset.v; renderGates(); renderFunctionTable(); });
  seg('#g-assoc', b => { G.assoc = b.dataset.g; renderAssoc(); });

  $('#g-sop').addEventListener('input', renderNandForm);
  $('#g-sopn').addEventListener('change', renderNandForm);

  renderGates();
  renderFunctionTable();
  renderAssoc();
  renderNandForm();
}
