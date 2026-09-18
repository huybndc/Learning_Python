import { $, el, HUES } from './dom-helpers.js';
import { K } from './kmap-state.js';
import { buildMap, paintValues, drawGroups, setHot } from './kmap-common.js';
import { buildSteps, renderStep, stepGo } from './kmap-steps.js';
import {
  varNames, minimizeSOP, minimizePOS, totalLiterals,
  impCovers, implicantMinterms,
} from '../logic/quine-mccluskey.js';
import { toBits } from '../logic/gray.js';
import { formatSpec, parseSpec } from '../logic/expr-parser.js';
import { randomValues } from '../logic/random-function.js';

/* =====================================================================
   PHẦN 2 — TAB K-MAP
   ===================================================================== */

/** Đổi giá trị ô theo vòng 0 → 1 → X → 0. */
export function cycleValue(v) { return (v + 1) % 3; }

export function kSetN(n) {
  K.n = n;
  K.values = new Array(1 << n).fill(0);
  K.stepIdx = -1;
  kBuild();
  kRefresh();
}

export function kBuild() {
  K.view = buildMap($('#k-maps'), K.n,
    m => { K.values[m] = cycleValue(K.values[m]); K.stepIdx = -1; kRefresh(); },
    m => {                                                 // hover ô → highlight nhóm chứa ô đó
      if (m === null) { setHot($('#k-maps'), null); return; }
      const ids = new Set(K.groups.filter(g => !g.hidden && impCovers(g.imp, m)).map(g => g.id));
      setHot($('#k-maps'), ids);
    });
}

/** Truth table có thể click để sửa. */
export function renderTruthTable() {
  const host = $('#k-tt');
  const names = varNames(K.n);
  host.innerHTML = '';
  const t = el('table', 'grid');
  const hr = el('tr');
  names.forEach(v => hr.appendChild(el('th', null, v)));
  hr.appendChild(el('th', null, 'm'));
  hr.appendChild(el('th', null, 'F'));
  t.appendChild(el('thead')).appendChild(hr);
  const tb = el('tbody');
  for (let m = 0; m < (1 << K.n); m++) {
    const tr = el('tr', 'tt-row' + (K.values[m] === 1 ? ' on' : ''));
    tr.dataset.m = m;
    [...toBits(m, K.n)].forEach(b => tr.appendChild(el('td', null, b)));
    tr.appendChild(el('td', 'muted', String(m)));
    const v = K.values[m];
    tr.appendChild(el('td', v === 1 ? 'val-1' : v === 2 ? 'val-x' : 'val-0', v === 2 ? 'X' : String(v)));
    tr.addEventListener('click', () => { K.values[m] = cycleValue(K.values[m]); K.stepIdx = -1; kRefresh(); });
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  host.appendChild(t);
}

/** Dựng các chip term có hover đồng bộ với K-map. */
export function renderExpr(host, terms, groups, emptyText) {
  host.innerHTML = '';
  if (!terms.length) { host.appendChild(el('span', 'mono', emptyText)); return; }
  terms.forEach((t, i) => {
    if (i) host.appendChild(el('span', 'plus', groups[i].joiner));
    const chip = el('span', 'term' + (t.essential ? ' ess' : ''), t.text);
    chip.style.setProperty('--gh', groups[i].hue);
    chip.dataset.gid = groups[i].id;
    chip.title = (t.essential ? 'Essential prime implicant' : 'Prime implicant') +
      ' — phủ các ô: ' + implicantMinterms(t.imp, K.n).join(', ');
    chip.addEventListener('mouseenter', () => setHot($('#k-maps'), new Set([groups[i].id])));
    chip.addEventListener('mouseleave', () => setHot($('#k-maps'), null));
    host.appendChild(chip);
  });
}

/** Tính lại toàn bộ tab K-map. */
export function kRefresh() {
  const S = minimizeSOP(K.values, K.n);
  const P = minimizePOS(K.values, K.n);

  // nhóm hiển thị của SOP (luôn vẽ) và của POS (ẩn, chỉ hiện khi hover)
  const sopGroups = S.terms.map((t, i) => ({ id: 's' + i, imp: t.imp, essential: t.essential, hue: HUES[i % HUES.length], joiner: ' + ' }));
  const posGroups = P.terms.map((t, i) => ({ id: 'p' + i, imp: t.imp, essential: t.essential, hue: HUES[(i + 5) % HUES.length], hidden: true, joiner: ' · ' }));
  K.groups = sopGroups.concat(posGroups);

  paintValues(K.view, K.values);
  const drawn = (K.stepIdx >= 0 && K.steps) ? K.steps[K.stepIdx].groups : K.groups;
  drawGroups(K.view, drawn, K.n);

  renderExpr($('#k-sop'), S.terms, sopGroups, '0  (hàm luôn bằng 0)');
  renderExpr($('#k-pos'), P.terms, posGroups, '1  (hàm luôn bằng 1)');
  if (S.terms.length === 1 && S.terms[0].text === '1') $('#k-sop').innerHTML = '<span class="mono">1  (hàm luôn bằng 1)</span>';
  if (P.terms.length === 1 && P.terms[0].text === '0') $('#k-pos').innerHTML = '<span class="mono">0  (hàm luôn bằng 0)</span>';

  $('#k-cost').textContent = 'SOP: ' + S.terms.length + ' term / ' + totalLiterals(S.terms, K.n) + ' literal · ' +
    'POS: ' + P.terms.length + ' term / ' + totalLiterals(P.terms, K.n) + ' literal · ' +
    'tổng cộng ' + S.pis.length + ' prime implicant của F.';

  // legend
  const lg = $('#k-legend'); lg.innerHTML = '';
  sopGroups.forEach((g, i) => {
    const d = el('span', 'lg'); d.style.setProperty('--gh', g.hue);
    d.appendChild(el('span', 'sw'));
    d.appendChild(el('span', null, S.terms[i].text + (S.terms[i].essential ? ' (essential)' : '')));
    lg.appendChild(d);
  });
  if (!sopGroups.length) lg.appendChild(el('span', 'small muted', 'Không có nhóm nào (hàm bằng 0).'));

  renderTruthTable();
  $('#k-spec').value = formatSpec(K.values);
  K.steps = buildSteps(K.values, K.n, sopGroups);
  renderStep();
}


export function setupKmapPage() {
  $('#k-n').addEventListener('change', () => kSetN(+$('#k-n').value));
  $('#k-clear').addEventListener('click', () => { K.values.fill(0); K.stepIdx = -1; kRefresh(); });
  $('#k-rand').addEventListener('click', () => { K.values = randomValues(K.n, true); K.stepIdx = -1; kRefresh(); });
  $('#k-apply').addEventListener('click', applySpec);
  $('#k-spec').addEventListener('keydown', e => { if (e.key === 'Enter') applySpec(); });
  $('#st-next').addEventListener('click', () => stepGo(1));
  $('#st-prev').addEventListener('click', () => stepGo(-1));
  $('#st-reset').addEventListener('click', () => { K.stepIdx = -1; stepGo(0); });
  kSetN(4);
  K.values = [1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0];   // ví dụ mở đầu
  kRefresh();
}

export function applySpec() {
  const err = $('#k-specerr');
  try {
    K.values = parseSpec($('#k-spec').value, K.n);
    K.stepIdx = -1;
    err.textContent = '';
    kRefresh();
  } catch (e) {
    err.textContent = 'Lỗi: ' + e.message;
  }
}
