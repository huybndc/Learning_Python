import { $, el } from './dom-helpers.js';
import {
  toBits, grayList, diffPositions, binToGraySteps, grayToBinSteps,
} from '../logic/gray.js';

/* =====================================================================
   PHẦN 1 — GRAY CODE
   ===================================================================== */

/** Bảng Decimal | Binary | Gray, highlight bit đổi so với hàng trước (vòng tròn). */
function renderGrayTable() {
  const n = +$('#g-n').value;
  const list = grayList(n);
  const t = $('#g-table');
  t.innerHTML = '';
  const thead = el('thead');
  const hr = el('tr');
  ['Decimal', 'Binary', 'Gray code'].forEach(h => hr.appendChild(el('th', null, h)));
  thead.appendChild(hr); t.appendChild(thead);
  const tb = el('tbody');
  list.forEach((g, i) => {
    const prev = list[(i - 1 + list.length) % list.length];   // hàng đầu so với hàng cuối
    const changed = new Set(diffPositions(prev, g));
    const tr = el('tr');
    tr.appendChild(el('td', null, String(i)));
    tr.appendChild(el('td', null, toBits(i, n)));
    const td = el('td');
    [...g].forEach((bit, k) => {
      const s = el('span', changed.has(k) ? 'bitchg' : null, bit);
      td.appendChild(s);
    });
    tr.appendChild(td);
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  $('#g-cyclic').textContent = 'Tổng cộng ' + list.length + ' mã, mỗi bước (kể cả từ hàng cuối quay về hàng đầu) đổi đúng 1 bit ⇒ đây là một chu trình Hamilton trên siêu khối ' + n + ' chiều.';
}

/* ------------- Reflect and prefix (có animation) ------------- */
const gb = { k: 1, phase: 0 };                   // k = số bit của danh sách gốc; phase 0=ổn định,1=đã lật,2=đã thêm tiền tố
const GB_MAX = 5;                                // số bit tối đa được dựng
/** Số bit đang hiển thị: ở phase 2 đã thêm tiền tố nên là k+1. */
function gbShownBits() { return gb.phase === 2 ? gb.k + 1 : gb.k; }
/** Đã tới giới hạn chưa (không thể bước tiếp nữa). */
function gbAtMax() { return gb.phase === 2 && gb.k + 1 >= GB_MAX; }

function gbRender(justChanged) {
  const box = $('#gb-list');
  box.innerHTML = '';
  const base = grayList(gb.k);
  let items;
  if (gb.phase === 0) {
    items = base.map(s => ({ s, mirror: false, pfx: null }));
    $('#gb-msg').innerHTML = '<b>Gray ' + gb.k + ' bit</b> — ' + base.length + ' mã. Bấm <b>Bước tiếp</b> để lật ngược danh sách và thêm vào cuối.';
  } else if (gb.phase === 1) {
    items = base.map(s => ({ s, mirror: false, pfx: null }))
      .concat(base.slice().reverse().map(s => ({ s, mirror: true, pfx: null })));
    $('#gb-msg').innerHTML = '<b>Bước 1 — reflect:</b> chép danh sách rồi <b>lật ngược</b> (phần tô vàng). Hai dòng sát chỗ nối là <span class="mono">' +
      base[base.length - 1] + '</span> và <span class="mono">' + base[base.length - 1] + '</span> — giống hệt nhau.';
  } else {
    items = base.map(s => ({ s, mirror: false, pfx: '0' }))
      .concat(base.slice().reverse().map(s => ({ s, mirror: true, pfx: '1' })));
    $('#gb-msg').innerHTML = '<b>Bước 2 — prefix:</b> nửa trên thêm <b class="mono">0</b>, nửa dưới thêm <b class="mono">1</b>. ' +
      'Chỗ nối giờ là <span class="mono">0' + base[base.length - 1] + '</span> → <span class="mono">1' + base[base.length - 1] + '</span>: chỉ khác bit tiền tố ⇒ vẫn đúng quy tắc 1 bit. Đã có <b>Gray ' + (gb.k + 1) + ' bit</b>.';
  }
  items.forEach((it, i) => {
    const d = el('div', 'gb-item' + (it.mirror ? ' mirror' : '') + (justChanged && i >= base.length ? ' fresh' : ''));
    d.appendChild(el('span', 'idx', String(i)));
    const code = el('span');
    if (it.pfx) { const p = el('span', 'pfx p' + it.pfx, it.pfx); code.appendChild(p); }
    code.appendChild(el('span', null, it.s));
    d.appendChild(code);
    box.appendChild(d);
    if (gb.phase > 0 && i === base.length - 1) box.appendChild(el('div', 'gb-mid'));  // ranh giới nửa trên / nửa lật
  });
  $('#gb-state').textContent = 'n = ' + gbShownBits() + (gbAtMax() ? ' (tối đa)' : '');
  $('#gb-next').disabled = gbAtMax();
}

function gbNext() {
  if (gbAtMax()) return;
  if (gb.phase === 2) { gb.k++; gb.phase = 1; }   // danh sách đã prefix trở thành gốc của vòng sau
  else gb.phase++;
  gbRender(true);
}

/* ------------- Bộ chuyển đổi Binary ↔ Gray ------------- */
let convDir = 'b2g';

function renderConverter() {
  const raw = $('#conv-in').value.replace(/\s+/g, '');
  const errBox = $('#conv-err'), stepBox = $('#conv-steps'), outBox = $('#conv-out');
  stepBox.innerHTML = ''; outBox.innerHTML = '';
  $('#conv-lab').textContent = convDir === 'b2g' ? 'Binary' : 'Gray';
  $('#conv-outlab').textContent = convDir === 'b2g' ? 'Gray code:' : 'Binary:';
  $('#conv-formula').textContent = convDir === 'b2g'
    ? 'g[i] = b[i-1] XOR b[i]   (bit trái là trọng số cao; b[-1] coi như 0)'
    : 'b[i] = b[i-1] XOR g[i]   (dùng bit binary vừa tính ở bước trước)';

  if (!/^[01]+$/.test(raw)) { errBox.textContent = raw === '' ? 'Nhập một chuỗi bit.' : 'Chỉ được dùng ký tự 0 và 1.'; return; }
  if (raw.length > 12) { errBox.textContent = 'Tối đa 12 bit.'; return; }
  errBox.textContent = '';

  const steps = convDir === 'b2g' ? binToGraySteps(raw) : grayToBinSteps(raw);
  const result = steps.map(s => s.r).join('');
  const srcName = convDir === 'b2g' ? 'b' : 'g';
  const accName = convDir === 'b2g' ? 'b' : 'b';

  steps.forEach(s => {
    const line = el('div');
    const lhs = (convDir === 'b2g' ? 'g' : 'b') + '[' + s.i + ']';
    const left = s.first ? '0' : accName + '[' + (s.i - 1) + ']=' + s.a;
    const right = srcName + '[' + s.i + ']=' + s.b;
    line.innerHTML = lhs + ' = ' + left + ' ⊕ ' + right + ' = <span class="hl">' + s.r + '</span>' +
      (s.first ? '  <span class="muted">(bit đầu: không có bit trái ⇒ XOR với 0)</span>' : '');
    stepBox.appendChild(line);
  });
  [...result].forEach(b => outBox.appendChild(el('span', 'act', b)));
  const dec = parseInt(convDir === 'b2g' ? raw : result, 2);
  const extra = el('div', 'small muted');
  extra.style.marginTop = '6px';
  extra.textContent = 'Giá trị thập phân: ' + dec + (convDir === 'b2g' ? '  (binary ' + raw + ')' : '  (binary ' + result + ')');
  stepBox.appendChild(extra);
}

export function setupGrayPage() {
  $('#g-n').addEventListener('change', renderGrayTable);
  renderGrayTable();
  $('#gb-next').addEventListener('click', gbNext);
  $('#gb-reset').addEventListener('click', () => { gb.k = 1; gb.phase = 0; gbRender(false); });
  gbRender(false);
  document.querySelectorAll('#conv-dir button').forEach(b => b.addEventListener('click', () => {
    convDir = b.dataset.d;
    document.querySelectorAll('#conv-dir button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderConverter();
  }));
  $('#conv-in').addEventListener('input', renderConverter);
  renderConverter();
}
