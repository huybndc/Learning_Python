import { $, el } from './dom-helpers.js';
import { checkDerivation } from '../logic/boolean-algebra.js';
import { DERIVATIONS, derivation } from '../logic/boolean-examples.js';
import { complementByDeMorgan, complementByDual, verifyComplement } from '../logic/boolean-complement.js';
import { exprTruthTable } from '../logic/expr-parser.js';
import { varNames } from '../logic/quine-mccluskey.js';
import { toBits } from '../logic/gray.js';

/* Chương 2 — Ví dụ minh hoạ: Example 2.1 (rút gọn bằng định lý) và
   Example 2.2–2.3 (lấy hàm bù bằng hai cách). */

/* ---------------- Example 2.1 ---------------- */
function renderDerivation() {
  const d = derivation($('#d-pick').value);
  const r = checkDerivation(d.from, d.steps, d.n);

  $('#d-vars').textContent = 'Đổi tên biến: ' + d.vars;

  const t = $('#d-table');
  t.innerHTML = '';
  const hr = el('tr');
  ['Bước', 'Biểu thức', 'Định lý dùng', 'Giải thích'].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);

  const tb = el('tbody');
  const row = (no, expr, by, note) => {
    const tr = el('tr');
    tr.appendChild(el('td', 'muted', no));
    tr.appendChild(el('td', 'val-1', expr));
    tr.appendChild(el('td', null, by));
    const td = el('td', 'small');
    td.style.textAlign = 'left';
    td.style.whiteSpace = 'normal';
    td.textContent = note;
    tr.appendChild(td);
    tb.appendChild(tr);
  };
  row('—', r.from, 'đề bài', 'Biểu thức ban đầu.');
  r.steps.forEach((s, i) => row(String(i + 1), s.expr, s.by + ': ' + s.law, s.note));
  t.appendChild(tb);

  const cf = r.statsFrom, ct = r.statsTo;
  $('#d-cost').innerHTML = (cf && ct)
    ? 'Chi phí: <b>' + cf.terms + ' term / ' + cf.literals + ' literal</b> → <b>'
      + ct.terms + ' term / ' + ct.literals + ' literal</b>.'
    : 'Chi phí: không đếm được (biểu thức có ngoặc ⇒ chưa ở dạng SOP phẳng).';

  const v = $('#d-verify');
  v.className = 'small ' + (r.ok ? 'ok' : 'bad');
  v.textContent = r.ok
    ? '✔ Mọi bước đều giữ nguyên bảng chân trị.'
    : '✘ ' + r.errors.join('; ');
}

/* ---------------- Example 2.2–2.3 ---------------- */
function stepList(host, steps) {
  host.innerHTML = '';
  steps.forEach((s, i) => {
    const line = el('div');
    line.style.margin = '6px 0';
    line.appendChild(el('div', 'mono', (i + 1) + '. ' + s.expr));
    line.appendChild(el('div', 'small muted', s.note));
    host.appendChild(line);
  });
}

function renderComplement() {
  const expr = $('#c-expr').value.trim();
  const n = +$('#c-n').value;
  const err = $('#c-err');
  const clear = () => {
    $('#c-dm').innerHTML = ''; $('#c-du').innerHTML = '';
    $('#c-check').textContent = ''; $('#c-tt').innerHTML = '';
  };
  if (!expr) { err.textContent = 'Nhập một biểu thức, ví dụ A + B\'C.'; clear(); return; }

  let dm, du;
  try {
    dm = complementByDeMorgan(expr, n);
    du = complementByDual(expr, n);
  } catch (e) {
    err.textContent = 'Lỗi: ' + e.message;
    clear();
    return;
  }
  err.textContent = '';

  stepList($('#c-dm'), dm.steps);
  stepList($('#c-du'), du.steps);

  const same = dm.result === du.result;
  const okDm = verifyComplement(expr, dm.result, n);
  const c = $('#c-check');
  c.className = 'small ' + (same && okDm ? 'ok' : 'bad');
  c.innerHTML = same && okDm
    ? '✔ Hai cách cho cùng kết quả <span class="mono">F′ = ' + dm.result
      + '</span>, và đúng bằng phủ định của F trên mọi dòng.'
    : '✘ Hai cách cho kết quả khác nhau hoặc sai: DeMorgan = ' + dm.result + ', dual = ' + du.result;

  renderTruthTable(expr, dm.result, n);
}

/** Bảng chân trị đối chiếu F và F′. */
function renderTruthTable(expr, comp, n) {
  const host = $('#c-tt');
  host.innerHTML = '';
  const f = exprTruthTable(expr, n);
  const g = exprTruthTable(comp, n);
  const hr = el('tr');
  varNames(n).forEach(v => hr.appendChild(el('th', null, v)));
  hr.appendChild(el('th', null, 'F'));
  hr.appendChild(el('th', null, 'F′'));
  host.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  for (let m = 0; m < (1 << n); m++) {
    const tr = el('tr');
    [...toBits(m, n)].forEach(b => tr.appendChild(el('td', null, b)));
    tr.appendChild(el('td', f[m] ? 'val-1' : 'val-0', String(f[m])));
    tr.appendChild(el('td', g[m] ? 'val-1' : 'val-0', String(g[m])));
    tb.appendChild(tr);
  }
  host.appendChild(tb);
}

export function setupCh2ExamplePage() {
  const pick = $('#d-pick');
  DERIVATIONS.forEach(d => {
    const o = el('option', null, '(' + d.id.slice(-1) + ') ' + d.title);
    o.value = d.id;
    pick.appendChild(o);
  });
  pick.addEventListener('change', renderDerivation);
  renderDerivation();

  $('#c-expr').addEventListener('input', renderComplement);
  $('#c-n').addEventListener('change', renderComplement);
  renderComplement();
}
