import { $, el } from './dom-helpers.js';
import { toDecimal, convertBase, intToBaseSteps, fracToBaseSteps, splitNumber } from '../logic/number-systems.js';
import { diminishedComplement, radixComplement, subtractByComplement, subtractValue, complementResultValue } from '../logic/complements.js';
import { FORMATS, range, encode, decode, addTwos, subTwos, compareFormats } from '../logic/signed-binary.js';

/* Chương 1 — Tương tác: bộ chuyển đổi cơ số, complement & trừ bằng
   complement, số nhị phân có dấu + phát hiện tràn số. */

const FORMAT_LABEL = {
  magnitude: 'Signed-magnitude',
  ones: "Signed 1's complement",
  twos: "Signed 2's complement",
};

const line = (host, label, value, cls) => {
  const d = el('div');
  d.innerHTML = '<span class="muted">' + label + '</span> <span class="' + (cls || 'hl') + '">' + value + '</span>';
  host.appendChild(d);
};

/* ---------------- 1. Bộ chuyển đổi cơ số ---------------- */
function renderConverter() {
  const raw = $('#i1-in').value.trim();
  const from = +$('#i1-from').value, to = +$('#i1-to').value;
  const out = $('#i1-out'), all = $('#i1-all');
  out.innerHTML = ''; all.innerHTML = '';
  if (!raw) { $('#i1-err').textContent = 'Nhập một số.'; return; }

  let res, dec;
  try {
    dec = toDecimal(raw, from);
    res = convertBase(raw, from, to);
  } catch (e) {
    $('#i1-err').textContent = 'Lỗi: ' + e.message;
    return;
  }
  $('#i1-err').textContent = '';

  [...res].forEach(ch => out.appendChild(el('span', ch === '.' ? null : 'act', ch)));

  line(all, 'Giá trị thập phân:', String(dec));
  const { intPart, fracPart } = splitNumber(raw);
  const i = Math.floor(dec);
  line(all, 'Phần nguyên ' + i + ' chia liên tiếp cho ' + to + ':',
    intToBaseSteps(i, to).steps.map(s => s.remainder).reverse().join(' ') + '  (đọc từ dưới lên)');
  if (fracPart || dec % 1) {
    const f = fracToBaseSteps(dec - i, to);
    line(all, 'Phần lẻ nhân liên tiếp với ' + to + ':',
      (f.digits || '(hết)') + (f.exact ? '' : '  — cắt bớt vì lặp vô hạn'));
  }
  const others = [2, 8, 10, 16].filter(r => r !== to);
  line(all, 'Các cơ số khác:',
    others.map(r => r + ': ' + convertBase(raw, from, r)).join('   ·   '), 'muted');
}

/* ---------------- 2. Complement & trừ bằng complement ---------------- */
function renderComplement() {
  const M = $('#i2-m').value.trim(), N = $('#i2-n').value.trim();
  const r = +$('#i2-r').value;
  const steps = $('#i2-steps');
  steps.innerHTML = ''; $('#i2-comp').textContent = ''; $('#i2-check').textContent = '';
  if (!M || !N) { $('#i2-err').textContent = 'Nhập cả M và N.'; return; }

  let dim, rad, sub;
  try {
    dim = diminishedComplement(N, r);
    rad = radixComplement(N, r);
    sub = subtractByComplement(M, N, r);
  } catch (e) {
    $('#i2-err').textContent = 'Lỗi: ' + e.message;
    return;
  }
  $('#i2-err').textContent = '';

  $('#i2-comp').textContent = '(' + (r - 1) + ")'s complement của N = " + dim.digits
    + '   ·   ' + r + "'s complement của N = " + rad.digits;

  sub.steps.forEach(s => line(steps, s.label + ':', s.value));

  const got = complementResultValue(sub, r);
  const want = subtractValue(M, N, r);
  const c = $('#i2-check');
  c.className = 'small ' + (got === want ? 'ok' : 'bad');
  const dec = v => String(v).replace('-', '−');          // dùng nhất quán dấu trừ Unicode
  c.textContent = (got === want ? '✔ ' : '✘ ') + 'M − N = ' + (sub.negative ? '−' : '') + sub.digits
    + ' (cơ số ' + r + ') = ' + dec(got) + ' ở hệ thập phân'
    + (got === want ? '.' : ', nhưng phép trừ trực tiếp cho ' + dec(want) + '.');
}

/* ---------------- 3. Số có dấu & phép cộng ---------------- */
function renderSigned() {
  const w = +$('#i3-w').value;
  const raw = $('#i3-v').value.trim();
  const t = $('#i3-table');
  t.innerHTML = '';
  const v = Number(raw);
  if (raw === '' || !Number.isInteger(v)) {
    $('#i3-err').textContent = 'Nhập một số nguyên, ví dụ −9.';
    return;
  }
  $('#i3-err').textContent = '';

  const hr = el('tr');
  ['Dạng biểu diễn', 'Chuỗi ' + w + ' bit', 'Khoảng biểu diễn được'].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  compareFormats(v, w).forEach(({ format, bits }) => {
    const { min, max } = range(format, w);
    const tr = el('tr');
    tr.appendChild(el('td', null, FORMAT_LABEL[format]));
    tr.appendChild(el('td', bits ? 'val-1' : 'bad', bits || 'không biểu diễn được'));
    tr.appendChild(el('td', 'muted', min + ' … ' + max));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
}

let signedOp = 'add';

function renderSignedAdd() {
  const w = +$('#i3-w').value;
  const a = Number($('#i3-a').value.trim()), b = Number($('#i3-b').value.trim());
  const host = $('#i3-add');
  host.innerHTML = ''; $('#i3-ov').textContent = '';
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    $('#i3-aerr').textContent = 'A và B phải là số nguyên.';
    return;
  }
  let A, B, r;
  try {
    A = encode(a, 'twos', w);
    B = encode(b, 'twos', w);
    r = signedOp === 'add' ? addTwos(A, B) : subTwos(A, B);
  } catch (e) {
    $('#i3-aerr').textContent = 'Lỗi: ' + e.message;
    return;
  }
  $('#i3-aerr').textContent = '';

  if (signedOp === 'sub') {
    line(host, "2's complement của B:", r.negB + '  (' + decode(r.negB, 'twos') + ')');
  }
  r.steps.forEach(s => line(host, s.label + ':', s.value));
  line(host, 'Nhớ ra ngoài (end carry):', String(r.carryOut) + (r.carryOut ? '  — bị bỏ đi' : ''), 'muted');

  const exact = signedOp === 'add' ? a + b : a - b;
  const ov = $('#i3-ov');
  ov.className = 'small ' + (r.overflow ? 'bad' : 'ok');
  ov.textContent = r.overflow
    ? '✘ Tràn số (overflow): hai toán hạng cùng dấu nhưng kết quả khác dấu. '
      + 'Giá trị đúng là ' + exact + ', vượt khoảng ' + range('twos', w).min + '…' + range('twos', w).max + ' của ' + w + ' bit.'
    : '✔ Không tràn số — kết quả ' + r.value + ' đúng bằng ' + exact + '.';
}

export function setupCh1InteractivePage() {
  ['#i1-in', '#i1-from', '#i1-to'].forEach(s => {
    $(s).addEventListener('input', renderConverter);
    $(s).addEventListener('change', renderConverter);
  });
  ['#i2-m', '#i2-n', '#i2-r'].forEach(s => {
    $(s).addEventListener('input', renderComplement);
    $(s).addEventListener('change', renderComplement);
  });
  ['#i3-v', '#i3-w'].forEach(s => {
    $(s).addEventListener('input', () => { renderSigned(); renderSignedAdd(); });
    $(s).addEventListener('change', () => { renderSigned(); renderSignedAdd(); });
  });
  ['#i3-a', '#i3-b'].forEach(s => $(s).addEventListener('input', renderSignedAdd));
  document.querySelectorAll('#i3-op button').forEach(b => b.addEventListener('click', () => {
    signedOp = b.dataset.op;
    document.querySelectorAll('#i3-op button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderSignedAdd();
  }));

  renderConverter();
  renderComplement();
  renderSigned();
  renderSignedAdd();
}

export { FORMATS };
