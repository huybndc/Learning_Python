import { $, el } from './dom-helpers.js';
import {  CODE_TABLES, encodeDecimal, codeTable, isSelfComplementing,
  addBcd, withParity, checkParity, asciiBits,
} from '../logic/binary-codes.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';

/* Chương 1 — Ví dụ minh hoạ §1.7–1.9: bảng mã thập phân, cộng BCD có hiệu
   chỉnh +6, và bit parity (có thao tác lật bit để thấy giới hạn của parity). */

const TABLES = ['bcd', '2421', 'excess3'];

/* ---------------- §1.7 bảng mã ---------------- */
function renderCodes() {
  const raw = $('#e4-dec').value.trim();
  const host = $('#e4-groups');
  host.innerHTML = ''; $('#e4-note').textContent = '';
  if (!/^\d+$/.test(raw)) {
    $('#e4-err').textContent = T('err.decimalOnly');
    return;
  }
  $('#e4-err').textContent = '';

  TABLES.forEach(t => {
    const groups = encodeDecimal(raw, t);
    const wrap = el('div', 'row tight');
    wrap.style.margin = '5px 0';
    const lab = el('b', 'small', T(CODE_TABLES[t].nameKey) + ':');
    lab.style.minWidth = '9.5em';
    wrap.appendChild(lab);
    groups.forEach(g => {
      const box = el('span', 'bitgroup');
      box.appendChild(el('span', 'mono small', g.bits));
      box.appendChild(el('span', 'mono gdigit', String(g.digit)));
      wrap.appendChild(box);
    });
    host.appendChild(wrap);
  });

  const bin = Number(raw).toString(2);
  $('#e4-note').innerHTML = T('c1.codeNote', {
    raw, sub10: '₁₀', bin, bl: bin.length, bcd: raw.length * 4,
  });
}

function renderCodeTable() {
  const t = $('#e4-table');
  t.innerHTML = '';
  const hr = el('tr');
  [T('c1.colDigit2'), 'BCD (8421)', '2421', 'Excess-3'].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  codeTable().forEach(r => {
    const tr = el('tr');
    tr.appendChild(el('td', 'muted', String(r.digit)));
    tr.appendChild(el('td', null, r.bcd));
    tr.appendChild(el('td', null, r['2421']));
    tr.appendChild(el('td', null, r.excess3));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  const foot = el('tr');
  foot.appendChild(el('td', 'small muted', T('c1.selfCompl')));
  TABLES.forEach(name => {
    const yes = isSelfComplementing(name);
    foot.appendChild(el('td', 'small ' + (yes ? 'ok' : 'muted'), T(yes ? 'c1.yes' : 'c1.no')));
  });
  tb.appendChild(foot);
}

/* ---------------- §1.7 cộng BCD ---------------- */
function renderBcdAdd() {
  const a = $('#e5-a').value.trim(), b = $('#e5-b').value.trim();
  const t = $('#e5-table');
  t.innerHTML = ''; $('#e5-out').textContent = '';
  let r;
  try {
    r = addBcd(a, b);
  } catch (e) {
    $('#e5-err').textContent = T('err.prefix') + tError(e);
    return;
  }
  $('#e5-err').textContent = '';

  const hr = el('tr');
  [T('c1.colCol'), 'a', 'b', T('c1.colCarryIn'), T('c1.colBinSum'),
    T('c1.colNeedFix'), T('c1.colDigit'), T('c1.colCarryOut')].forEach(h => hr.appendChild(el('th', null, h)));
  t.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  r.cols.forEach((c, i) => {
    const tr = el('tr');
    tr.appendChild(el('td', 'muted', String(r.cols.length - i)));
    tr.appendChild(el('td', null, String(c.a)));
    tr.appendChild(el('td', null, String(c.b)));
    tr.appendChild(el('td', 'muted', String(c.carryIn)));
    tr.appendChild(el('td', null, c.raw + '  (' + (c.a + c.b + c.carryIn) + ')'));
    tr.appendChild(el('td', c.needsFix ? 'warn' : 'muted', c.needsFix ? '✔ +0110' : '—'));
    tr.appendChild(el('td', 'val-1', c.fixed + '  (' + c.digit + ')'));
    tr.appendChild(el('td', 'muted', String(c.carry)));
    if (c.needsFix) tr.classList.add('on');
    tb.appendChild(tr);
  });
  t.appendChild(tb);

  $('#e5-out').textContent = T('c1.bcdOut', { a, b, r: r.digits })
    + (r.carryOut ? T('c1.bcdCarry') : '');
}

/* ---------------- §1.9 parity ---------------- */
let parityKind = 'even';
let sentBits = '';

function renderParity() {
  const ch = $('#e6-ch').value;
  const steps = $('#e6-steps');
  steps.innerHTML = ''; $('#e6-bits').innerHTML = ''; $('#e6-check').textContent = '';
  if (!ch) { $('#e6-err').textContent = T('c1.parityErr'); return; }
  let base;
  try {
    base = asciiBits(ch);
  } catch (e) {
    $('#e6-err').textContent = T('err.prefix') + tError(e);
    return;
  }
  $('#e6-err').textContent = '';

  sentBits = withParity(base, parityKind);
  const ones = [...base].filter(b => b === '1').length;

  const line = (l, v) => {
    const d = el('div');
    d.innerHTML = '<span class="muted">' + l + '</span> <span class="hl">' + v + '</span>';
    steps.appendChild(d);
  };
  line(T('c1.parityAscii', { ch }), base);
  line(T('c1.parityOnes'), T(ones % 2 === 0 ? 'c1.parityEven' : 'c1.parityOdd', { n: ones }));
  line(T('c1.parityBit', { kind: parityKind }), sentBits[7]);
  line(T('c1.paritySent'), sentBits);

  paintBits(sentBits);
}

function paintBits(bits) {
  const host = $('#e6-bits');
  host.innerHTML = '';
  [...bits].forEach((b, i) => {
    const sp = el('span', b === '1' ? 'act' : null, b);
    sp.style.cursor = 'pointer';
    sp.title = i === 7 ? T('c1.parityBitTitle') : T('c1.dataBitTitle', { i });
    sp.addEventListener('click', () => {
      const flipped = bits.slice(0, i) + (bits[i] === '0' ? '1' : '0') + bits.slice(i + 1);
      paintBits(flipped);
      reportParity(flipped);
    });
    host.appendChild(sp);
  });
  reportParity(bits);
}

function reportParity(bits) {
  const ok = checkParity(bits, parityKind);
  const changed = [...bits].filter((b, i) => b !== sentBits[i]).length;
  const c = $('#e6-check');
  c.className = 'small ' + (changed === 0 ? 'muted' : (ok ? 'bad' : 'ok'));
  if (changed === 0) c.textContent = T('c1.parityIntact');
  else c.textContent = T(ok ? 'c1.parityMissed' : 'c1.parityCaught', { n: changed });
}

export function setupCh1CodesPage() {
  $('#e4-dec').addEventListener('input', renderCodes);
  ['#e5-a', '#e5-b'].forEach(s => $(s).addEventListener('input', renderBcdAdd));
  $('#e6-ch').addEventListener('input', renderParity);
  document.querySelectorAll('#e6-kind button').forEach(b => b.addEventListener('click', () => {
    parityKind = b.dataset.k;
    document.querySelectorAll('#e6-kind button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderParity();
  }));

  onLangChange(() => { renderCodes(); renderCodeTable(); renderBcdAdd(); renderParity(); });
  renderCodes();
  renderCodeTable();
  renderBcdAdd();
  renderParity();
}
