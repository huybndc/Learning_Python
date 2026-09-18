import { $, el } from './dom-helpers.js';
import {
  intToBaseSteps, fracToBaseSteps, splitNumber,
  binaryToGrouped, MAX_FRAC_STEPS,
} from '../logic/number-systems.js';

/* Chương 1 — Ví dụ minh hoạ: tái hiện Example 1.1–1.3 và §1.4 dưới dạng
   bảng từng bước giống trong slide. */

/** Dựng bảng có 1 hàng header + nhiều hàng dữ liệu. */
function buildTable(host, headers, rows) {
  host.innerHTML = '';
  const hr = el('tr');
  headers.forEach(h => hr.appendChild(el('th', null, h)));
  host.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  rows.forEach(cells => {
    const tr = el('tr');
    cells.forEach(c => tr.appendChild(el('td', c.cls || null, c.text)));
    tb.appendChild(tr);
  });
  host.appendChild(tb);
}

/** Hiển thị lỗi và dọn kết quả cũ. */
function fail(errSel, outSel, msg, clear) {
  $(errSel).textContent = msg;
  $(outSel).textContent = '';
  clear();
}

/* ---------------- Ví dụ 1.1–1.2: chia lấy dư ---------------- */
function renderIntExample() {
  const raw = $('#e1-int').value.trim();
  const r = +$('#e1-base').value;
  const table = $('#e1-table');
  const clear = () => { table.innerHTML = ''; };

  const n = Number(raw);
  if (raw === '' || !Number.isInteger(n) || n < 0) {
    return fail('#e1-err', '#e1-out', 'Nhập một số nguyên không âm.', clear);
  }
  if (n > 1e9) return fail('#e1-err', '#e1-out', 'Số quá lớn (tối đa 1e9).', clear);
  $('#e1-err').textContent = '';

  const { digits, steps } = intToBaseSteps(n, r);
  buildTable(table, ['Phép chia', 'Thương', 'Dư', 'Chữ số'],
    steps.map((s, i) => [
      { text: s.value + ' ÷ ' + r },
      { text: String(s.quotient) },
      { text: String(s.remainder) },
      { text: s.digit + (i === 0 ? '  ← LSB' : i === steps.length - 1 ? '  ← MSB' : ''), cls: 'val-1' },
    ]));
  $('#e1-out').textContent = '(' + n + ')₁₀ = (' + digits + ')' + sub(r)
    + '   — đọc cột "Dư" từ dưới lên.';
}

/* ---------------- Ví dụ 1.3: nhân lấy phần nguyên ---------------- */
function renderFracExample() {
  const raw = $('#e2-frac').value.trim();
  const r = +$('#e2-base').value;
  const table = $('#e2-table');
  const clear = () => { table.innerHTML = ''; };

  const f = Number(raw);
  if (raw === '' || !(f > 0 && f < 1)) {
    return fail('#e2-err', '#e2-out', 'Nhập một số trong khoảng 0 < x < 1, ví dụ 0.6875.', clear);
  }
  $('#e2-err').textContent = '';

  const { digits, steps, exact } = fracToBaseSteps(f, r);
  buildTable(table, ['Phép nhân', 'Kết quả', 'Phần nguyên', 'Còn lại'],
    steps.map((s, i) => [
      { text: trim(s.value) + ' × ' + r },
      { text: trim(s.product) },
      { text: s.digit + (i === 0 ? '  ← chữ số đầu' : ''), cls: 'val-1' },
      { text: trim(s.rest) },
    ]));
  $('#e2-out').textContent = '(' + raw + ')₁₀ = (0.' + digits + ')' + sub(r)
    + (exact ? '   — dừng khi phần lẻ về 0.'
      : '   — phần lẻ lặp vô hạn, đã cắt ở ' + MAX_FRAC_STEPS + ' chữ số.');
}

/* ---------------- §1.4: gộp nhóm bit ---------------- */
let groupK = 3;

function renderGroupExample() {
  const raw = $('#e3-bin').value.trim();
  const host = $('#e3-groups');
  const clear = () => { host.innerHTML = ''; };
  let res;
  try {
    res = binaryToGrouped(raw, groupK);
  } catch (e) {
    return fail('#e3-err', '#e3-out', 'Lỗi: ' + e.message, clear);
  }
  $('#e3-err').textContent = '';

  host.innerHTML = '';
  const line = (label, groups) => {
    if (!groups.length) return;
    const wrap = el('div', 'row tight');
    wrap.style.margin = '4px 0';
    wrap.appendChild(el('b', 'small', label));
    groups.forEach(g => {
      const box = el('span', 'bitgroup');
      box.appendChild(el('span', 'mono small', g.bits));
      box.appendChild(el('span', 'mono gdigit', g.digit));
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  };
  line('Phần nguyên:', res.groups.int);
  line('Phần lẻ:', res.groups.frac);

  const { intPart, fracPart } = splitNumber(raw);
  const shown = fracPart ? intPart + '.' + fracPart : intPart;
  $('#e3-out').textContent = '(' + shown + ')₂ = (' + res.digits + ')' + sub(1 << groupK);
}

/** Chỉ số dưới cho cơ số, vd 2 → ₂. */
function sub(r) {
  const map = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  return [...String(r)].map(d => map[d]).join('');
}

/** Cắt bớt sai số dấu phẩy động khi hiển thị. */
function trim(x) {
  const s = x.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
  return s === '' ? '0' : s;
}

export function setupCh1ExamplePage() {
  ['#e1-int', '#e1-base'].forEach(sel => {
    $(sel).addEventListener('input', renderIntExample);
    $(sel).addEventListener('change', renderIntExample);
  });
  ['#e2-frac', '#e2-base'].forEach(sel => {
    $(sel).addEventListener('input', renderFracExample);
    $(sel).addEventListener('change', renderFracExample);
  });
  $('#e3-bin').addEventListener('input', renderGroupExample);
  document.querySelectorAll('#e3-k button').forEach(b => b.addEventListener('click', () => {
    groupK = +b.dataset.k;
    document.querySelectorAll('#e3-k button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderGroupExample();
  }));

  renderIntExample();
  renderFracExample();
  renderGroupExample();
}
