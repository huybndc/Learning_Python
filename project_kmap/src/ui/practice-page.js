import { $, el, HUES } from './dom-helpers.js';
import { buildMap, paintValues, drawGroups } from './kmap-common.js';
import { cellMinterm } from '../logic/kmap-layout.js';
import {
  varNames, splitValues, primeImplicants, minimizeSOP,
  implicantMinterms, implicantToSOP, totalLiterals,
} from '../logic/quine-mccluskey.js';
import { exprTruthTable, sopStats, formatSpec } from '../logic/expr-parser.js';
import { cellsToImplicant, checkGroup } from '../logic/practice-check.js';
import { explainTerm } from '../logic/explain.js';
import { randomValues } from '../logic/random-function.js';

/* =====================================================================
   PHẦN 3 — TAB LUYỆN TẬP
   ===================================================================== */

export const P = { n: 4, values: new Array(16).fill(0), view: null, groups: [], sel: new Set(), drag: null };

export function pSetN(n) {
  P.n = n;
  P.values = new Array(1 << n).fill(0);
  P.groups = []; P.sel.clear();
  pBuild();
  pNewProblem();
}

export function pBuild() {
  P.view = buildMap($('#p-maps'), P.n, null, null);
  P.view.cells.forEach((cell, m) => {
    cell.classList.add('picky');
    cell.addEventListener('pointerdown', ev => pPointerDown(ev, m, cell));
  });
}

/** Ô đang nằm dưới con trỏ (dùng chung cho chuột và cảm ứng). */
export function cellUnder(x, y) {
  const e = document.elementFromPoint(x, y);
  return e ? e.closest('#p-maps .kcell') : null;
}

export function pPointerDown(ev, m, cell) {
  ev.preventDefault();
  const base = new Set(P.sel);
  P.drag = { anchor: cell, base, moved: false };
  const move = e => {
    const c = cellUnder(e.clientX, e.clientY);
    if (!c || c === P.drag.anchor) return;
    P.drag.moved = true;
    pSelectRect(P.drag.anchor, c, base);
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    if (!P.drag.moved) {                       // click đơn → bật/tắt ô (cho phép gom nhóm wrap-around)
      if (P.sel.has(m)) P.sel.delete(m); else P.sel.add(m);
      pPaint();
    }
    P.drag = null;
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

/** Quét chọn vùng chữ nhật (không quấn biên) giữa hai ô cùng một sheet. */
export function pSelectRect(aCell, bCell, base) {
  if (aCell.dataset.s !== bCell.dataset.s) return;
  const s = +aCell.dataset.s;
  const r0 = Math.min(+aCell.dataset.r, +bCell.dataset.r), r1 = Math.max(+aCell.dataset.r, +bCell.dataset.r);
  const c0 = Math.min(+aCell.dataset.c, +bCell.dataset.c), c1 = Math.max(+aCell.dataset.c, +bCell.dataset.c);
  P.sel = new Set(base);
  const L = P.view.L;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) P.sel.add(cellMinterm(L, s, r, c));
  pPaint();
}

export function pPaint() {
  paintValues(P.view, P.values);
  P.view.cells.forEach((cell, m) => cell.classList.toggle('sel', P.sel.has(m)));
  drawGroups(P.view, P.groups.map((g, i) => ({ id: 'u' + i, imp: g.imp, essential: false, hue: HUES[i % HUES.length] })), P.n);
  const lg = $('#p-legend'); lg.innerHTML = '';
  P.groups.forEach((g, i) => {
    const d = el('span', 'lg'); d.style.setProperty('--gh', HUES[i % HUES.length]);
    d.appendChild(el('span', 'sw'));
    d.appendChild(el('span', null, '#' + (i + 1) + ' {' + g.cells.join(',') + '}'));
    lg.appendChild(d);
  });
  if (!P.groups.length) lg.appendChild(el('span', 'small muted', 'Chưa chốt nhóm nào.'));
}

export function pNewProblem() {
  P.values = randomValues(P.n, $('#p-dc').checked);
  P.groups = []; P.sel.clear();
  $('#p-expr').value = '';
  $('#p-result').innerHTML = '';
  $('#p-spec').textContent = 'F(' + varNames(P.n).join(',') + ') = ' + formatSpec(P.values);
  pPaint();
}

export function pCommit() {
  const res = $('#p-result');
  if (P.sel.size === 0) { res.innerHTML = '<div class="msg warn">Chưa chọn ô nào.</div>'; return; }
  const cells = [...P.sel].sort((a, b) => a - b);
  P.groups.push({ cells, imp: cellsToImplicant(cells, P.n) });
  P.sel.clear();
  res.innerHTML = '';
  pPaint();
}

/** Chấm bài: nhóm + biểu thức. */
export function pCheck() {
  const res = $('#p-result');
  res.innerHTML = '';
  const n = P.n, values = P.values;
  const { ones, dcs } = splitValues(values);
  const allPIs = primeImplicants(ones, dcs, n);
  const best = minimizeSOP(values, n);
  const add = (cls, html) => { const d = el('div', 'msg ' + cls); d.innerHTML = html; res.appendChild(d); };

  /* --- 1. Từng nhóm --- */
  if (P.groups.length === 0) add('warn', 'Bạn chưa chốt nhóm nào — phần biểu thức vẫn được chấm.');
  let allGroupsOk = true;
  P.groups.forEach((g, i) => {
    const r = checkGroup(g.cells, values, n, allPIs);
    const head = 'Nhóm #' + (i + 1) + ' {' + g.cells.join(', ') + '}';
    if (!r.ok) {
      allGroupsOk = false;
      add('bad', '✘ ' + head + ': ' + r.errors.join('; ') + '.');
    } else if (r.notes.length) {
      allGroupsOk = false;
      add('warn', '⚠ ' + head + ' hợp lệ (= <span class="mono">' + implicantToSOP(r.imp, n) + '</span>) nhưng ' + r.notes.join('; ') + '.');
    } else {
      add('ok', '✔ ' + head + ' là prime implicant <span class="mono">' + implicantToSOP(r.imp, n) + '</span>.');
    }
  });

  /* --- 2. Các nhóm có phủ hết ô 1 chưa --- */
  if (P.groups.length) {
    const covered = new Set();
    P.groups.forEach(g => g.cells.forEach(m => covered.add(m)));
    const missed = ones.filter(m => !covered.has(m));
    if (missed.length) { allGroupsOk = false; add('bad', '✘ Các nhóm chưa phủ hết ô 1 — còn thiếu: <span class="mono">' + missed.join(', ') + '</span>.'); }
    else add('ok', '✔ Các nhóm đã phủ hết mọi ô 1.');
    if (P.groups.length > best.terms.length && allGroupsOk) {
      add('warn', '⚠ Bạn dùng ' + P.groups.length + ' nhóm, đáp án tối ưu chỉ cần ' + best.terms.length + ' nhóm.');
    }
  }

  /* --- 3. Biểu thức --- */
  const text = $('#p-expr').value.trim();
  if (!text) { add('warn', 'Chưa nhập biểu thức SOP.'); return; }
  let tt;
  try { tt = exprTruthTable(text, n); }
  catch (e) { add('bad', '✘ Biểu thức không đọc được: ' + e.message); return; }

  const wrong = [];
  for (let m = 0; m < (1 << n); m++) if (values[m] !== 2 && tt[m] !== values[m]) wrong.push(m);
  if (wrong.length) {
    add('bad', '✘ Biểu thức <b>không</b> tương đương với hàm. Sai tại ô: <span class="mono">' + wrong.join(', ') +
      '</span> (ô ' + wrong[0] + ': hàm = ' + values[wrong[0]] + ', biểu thức của bạn = ' + tt[wrong[0]] + ').');
  } else {
    add('ok', '✔ Biểu thức <b>tương đương</b> với hàm trên mọi ô không phải don\'t care.');
    const st = sopStats(text, n);
    const bt = best.terms.length, bl = totalLiterals(best.terms, n);
    if (!st) {
      add('warn', '⚠ Không đếm được số term/literal (biểu thức có ngoặc ⇒ chưa ở dạng SOP phẳng). Đáp án tối giản: <span class="mono">' + best.expr + '</span> (' + bt + ' term / ' + bl + ' literal).');
    } else if (st.terms === bt && st.literals === bl) {
      add('ok', '✔ Đã <b>tối giản</b>: ' + st.terms + ' term / ' + st.literals + ' literal — bằng đúng đáp án tối ưu.');
    } else {
      add('warn', '⚠ Đúng nhưng <b>chưa tối giản</b>: bạn có ' + st.terms + ' term / ' + st.literals + ' literal, tối ưu là ' +
        bt + ' term / ' + bl + ' literal.');
    }
  }
}

export function pShowAnswer() {
  const best = minimizeSOP(P.values, P.n);
  P.groups = best.terms.map(t => ({ cells: implicantMinterms(t.imp, P.n), imp: t.imp }));
  P.sel.clear();
  pPaint();
  const res = $('#p-result');
  res.innerHTML = '';
  const d = el('div', 'msg ok');
  d.innerHTML = 'Đáp án tối giản: <b class="mono">F = ' + best.expr + '</b> (' + best.terms.length + ' term / ' +
    totalLiterals(best.terms, P.n) + ' literal).<br>' + best.terms.map(t => '· ' + explainTerm(t.imp, P.n, false)).join('<br>');
  res.appendChild(d);
}

export function setupPracticePage() {
  $('#p-n').addEventListener('change', () => pSetN(+$('#p-n').value));
  $('#p-gen').addEventListener('click', pNewProblem);
  $('#p-dc').addEventListener('change', pNewProblem);
  $('#p-commit').addEventListener('click', pCommit);
  $('#p-clearsel').addEventListener('click', () => { P.sel.clear(); pPaint(); });
  $('#p-undo').addEventListener('click', () => { P.groups.pop(); pPaint(); });
  $('#p-clearg').addEventListener('click', () => { P.groups = []; P.sel.clear(); pPaint(); });
  $('#p-check').addEventListener('click', pCheck);
  $('#p-show').addEventListener('click', pShowAnswer);
  $('#p-expr').addEventListener('keydown', e => { if (e.key === 'Enter') pCheck(); });
  pSetN(4);
}
