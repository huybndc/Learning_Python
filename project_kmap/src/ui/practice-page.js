import { $, el, HUES } from './dom-helpers.js';
import { buildMap, paintValues, drawGroups } from './kmap-common.js';
import { cellMinterm } from '../logic/kmap-layout.js';
import {
  varNames, splitValues, primeImplicants, minimizeSOP,
  implicantMinterms, implicantToSOP, totalLiterals,
} from '../logic/quine-mccluskey.js';
import { exprTruthTable, sopStats, formatSpec } from '../logic/expr-parser.js';
import { cellsToImplicant, checkGroup } from '../logic/practice-check.js';
import { randomValues } from '../logic/random-function.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';

/* =====================================================================
   PHẦN 3 — TAB LUYỆN TẬP
   ===================================================================== */

/** checkGroup trả về {key, params}; đổi sang chuỗi theo ngôn ngữ hiện tại. */
const msg = e => T(e.key, e.params);

/** Dòng mô tả đề bài. */
function specText() {
  return 'F(' + varNames(P.n).join(',') + ') = ' + formatSpec(P.values);
}

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
  if (!P.groups.length) lg.appendChild(el('span', 'small muted', T('prac.noGroup')));
}

export function pNewProblem() {
  P.values = randomValues(P.n, $('#p-dc').checked);
  P.groups = []; P.sel.clear();
  $('#p-expr').value = '';
  $('#p-result').innerHTML = '';
  $('#p-spec').textContent = specText();
  pPaint();
}

export function pCommit() {
  const res = $('#p-result');
  if (P.sel.size === 0) { res.innerHTML = '<div class="msg warn">' + T('prac.noSelection') + '</div>'; return; }
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
  if (P.groups.length === 0) add('warn', T('prac.noGroupYet'));
  let allGroupsOk = true;
  P.groups.forEach((g, i) => {
    const r = checkGroup(g.cells, values, n, allPIs);
    const cells = '{' + g.cells.join(', ') + '}';
    if (!r.ok) {
      allGroupsOk = false;
      add('bad', T('prac.groupBad', { i: i + 1, cells, errors: r.errors.map(msg).join('; ') }));
    } else if (r.notes.length) {
      allGroupsOk = false;
      add('warn', T('prac.groupWarn', {
        i: i + 1, cells, term: implicantToSOP(r.imp, n), notes: r.notes.map(msg).join('; '),
      }));
    } else {
      add('ok', T('prac.groupOk', { i: i + 1, cells, term: implicantToSOP(r.imp, n) }));
    }
  });

  /* --- 2. Các nhóm có phủ hết ô 1 chưa --- */
  if (P.groups.length) {
    const covered = new Set();
    P.groups.forEach(g => g.cells.forEach(m => covered.add(m)));
    const missed = ones.filter(m => !covered.has(m));
    if (missed.length) { allGroupsOk = false; add('bad', T('prac.missCells', { cells: missed.join(', ') })); }
    else add('ok', T('prac.coverOk'));
    if (P.groups.length > best.terms.length && allGroupsOk) {
      add('warn', T('prac.tooMany', { used: P.groups.length, best: best.terms.length }));
    }
  }

  /* --- 3. Biểu thức --- */
  const text = $('#p-expr').value.trim();
  if (!text) { add('warn', T('prac.noExpr')); return; }
  let tt;
  try { tt = exprTruthTable(text, n); }
  catch (e) { add('bad', T('prac.exprBad', { message: tError(e) })); return; }

  const wrong = [];
  for (let m = 0; m < (1 << n); m++) if (values[m] !== 2 && tt[m] !== values[m]) wrong.push(m);
  if (wrong.length) {
    add('bad', T('prac.exprWrong', {
      cells: wrong.join(', '), first: wrong[0], want: values[wrong[0]], got: tt[wrong[0]],
    }));
  } else {
    add('ok', T('prac.exprOk'));
    const st = sopStats(text, n);
    const bt = best.terms.length, bl = totalLiterals(best.terms, n);
    if (!st) {
      add('warn', T('prac.exprNoCount', { best: best.expr, bt, bl }));
    } else if (st.terms === bt && st.literals === bl) {
      add('ok', T('prac.exprMinimal', { terms: st.terms, literals: st.literals }));
    } else {
      add('warn', T('prac.exprNotMinimal', { terms: st.terms, literals: st.literals, bt, bl }));
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
  d.innerHTML = T('prac.answer', {
    expr: best.expr, terms: best.terms.length, literals: totalLiterals(best.terms, P.n),
  });
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
  onLangChange(() => { pPaint(); $('#p-spec').textContent = specText(); });
  pSetN(4);
}
