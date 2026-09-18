import { $, el, renderReadout } from './dom-helpers.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';
import { applyRowOp, formatRowOp, forward, isEchelon } from '../logic/elimination.js';
import { classifyFrom } from '../logic/linear-system.js';
import { parseNumber } from '../logic/answer-check.js';
import { renderMatrix, changedRows } from './matrix-view.js';

/* Chương 2 — Tương tác: người học tự chọn phép biến đổi hàng, hệ thống kiểm tra
   từng bước và báo khi ma trận về dạng bậc thang. Có nút gợi ý bước tiếp theo,
   lấy thẳng từ thuật toán khử xuôi. */

const START = [[0, 1, 1, 5], [1, 2, 3, 14], [2, 1, 1, 7]];
const TYPE_KEYS = { unique: 'c2q.tUnique', infinite: 'c2q.tInfinite', none: 'c2q.tNone' };

const S = { M: START.map(r => r.slice()), history: [], lastOp: null };

const nRows = () => S.M.length;
const nVars = () => S.M[0].length - 1;

/** Đọc phép biến đổi đang chọn trên thanh điều khiển. */
function currentOp() {
  const type = $('#i2-op').value;
  const i = Number($('#i2-i').value);
  const j = Number($('#i2-j').value);
  if (type === 'swap') return { type: 'swap', i, j };
  const k = parseNumber($('#i2-k').value);
  if (k === null || (type === 'scale' && k === 0)) return null;
  return type === 'scale' ? { type: 'scale', i, k } : { type: 'add', i, j, k };
}

function fillRowSelects() {
  for (const sel of ['#i2-i', '#i2-j']) {
    const node = $(sel);
    const keep = node.value;
    node.innerHTML = '';
    for (let r = 0; r < nRows(); r++) {
      const opt = el('option', null, 'R' + (r + 1));
      opt.value = String(r);
      node.appendChild(opt);
    }
    node.value = keep && Number(keep) < nRows() ? keep : String(sel === '#i2-i' ? 1 : 0);
  }
}

/** Ẩn/hiện ô hệ số và ô hàng nguồn theo loại phép đang chọn. */
function syncControls() {
  const type = $('#i2-op').value;
  $('#i2-wrap-k').style.display = type === 'swap' ? 'none' : '';
  $('#i2-wrap-j').style.display = type === 'scale' ? 'none' : '';
  $('#i2-lbl-i').textContent = T('c2.rowI');
  $('#i2-lbl-j').textContent = T(type === 'swap' ? 'c2.rowJSwap' : 'c2.rowJ');
  const op = currentOp();
  $('#i2-preview').textContent = op ? formatRowOp(op) : '';
}

function renderHistory() {
  const host = $('#i2-history');
  host.innerHTML = '';
  if (!S.history.length) {
    host.appendChild(el('p', 'small muted', T('c2.historyEmpty')));
    return;
  }
  S.history.forEach((h, idx) => {
    const box = el('div', 'step done');
    box.appendChild(el('div', 'opline', (idx + 1) + '. ' + h.formula));
    host.appendChild(box);
  });
}

function renderStatus() {
  const done = isEchelon(S.M, nVars());
  const badge = $('#i2-status');
  badge.textContent = T(done ? 'c2.echelonYes' : 'c2.echelonNo');
  badge.className = 'badge ' + (done ? 'ok' : 'warn');

  const cls = classifyFrom(S.M, nVars());
  renderReadout($('#i2-out'), [
    [T('c2.lblRank'), cls.rankA],
    [T('c2.lblRankAug'), cls.rankAug],
    [T('c2.lblVars'), cls.nVars],
    [T('c2.lblFree'), cls.freeCount],
    [T('c2.lblType'), T(TYPE_KEYS[cls.type]), done ? 'sum' : ''],
  ]);
}

function refresh() {
  renderMatrix($('#i2-matrix'), S.M, { changed: changedRows(S.lastOp) });
  renderStatus();
  renderHistory();
  syncControls();
}

function apply() {
  const op = currentOp();
  const err = $('#i2-err');
  err.textContent = '';
  if (!op) { err.textContent = T('c2.badFactor'); return; }
  try {
    const next = applyRowOp(S.M, op);
    S.history.push({ op, formula: formatRowOp(op), before: S.M });
    S.M = next;
    S.lastOp = op;
    refresh();
  } catch (e) {
    err.textContent = T('err.prefix') + tError(e);
  }
}

function undo() {
  const last = S.history.pop();
  if (!last) return;
  S.M = last.before;
  S.lastOp = S.history.at(-1)?.op || null;
  $('#i2-err').textContent = '';
  refresh();
}

/** Gợi ý: chạy khử xuôi trên ma trận hiện tại và lấy bước đầu tiên. */
function hint() {
  const { steps } = forward(S.M);
  const next = steps.find(s => s.op);
  $('#i2-err').textContent = '';
  $('#i2-preview').textContent = next
    ? T('c2.hintSuggest', { formula: next.formula })
    : T('c2.hintDone');
  if (next && next.op) {
    $('#i2-op').value = next.op.type;
    fillRowSelects();
    $('#i2-i').value = String(next.op.i);
    if (next.op.j != null) $('#i2-j').value = String(next.op.j);
    if (next.op.k != null) $('#i2-k').value = String(next.op.k);
    $('#i2-wrap-k').style.display = next.op.type === 'swap' ? 'none' : '';
    $('#i2-wrap-j').style.display = next.op.type === 'scale' ? 'none' : '';
  }
}

function reset() {
  S.M = START.map(r => r.slice());
  S.history = [];
  S.lastOp = null;
  $('#i2-err').textContent = '';
  refresh();
}

export function setupCh2InteractivePage() {
  fillRowSelects();
  $('#i2-op').addEventListener('change', syncControls);
  ['#i2-i', '#i2-j', '#i2-k'].forEach(sel => $(sel).addEventListener('input', syncControls));
  $('#i2-apply').addEventListener('click', apply);
  $('#i2-undo').addEventListener('click', undo);
  $('#i2-hint').addEventListener('click', hint);
  $('#i2-reset').addEventListener('click', reset);
  onLangChange(refresh);
  refresh();
}
