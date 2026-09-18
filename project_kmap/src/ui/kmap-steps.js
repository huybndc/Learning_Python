import { $ } from './dom-helpers.js';
import { HUES } from './dom-helpers.js';
import { K } from './kmap-state.js';
import { drawGroups } from './kmap-common.js';
import { buildExplain } from '../logic/kmap-explain.js';
import { varNames } from '../logic/quine-mccluskey.js';
import { t as T } from '../i18n/index.js';

/* Giải thích từng bước: mỗi bước là MỘT dòng F = … cộng một câu lý do. */

export function buildSteps(values, n) {
  const { steps } = buildExplain(values, n);
  return steps.map((s, i) => ({
    ...s,
    groups: s.imps.map((imp, k) => ({
      id: 'e' + i + '-' + k,
      imp,
      essential: s.essential.includes(k),
      hue: HUES[k % HUES.length],
    })),
  }));
}

/** Một dòng chi tiết ở bước cuối: giữ biến nào, bỏ biến nào. */
function detailLine(d, n) {
  const names = varNames(n);
  const keep = d.keep.map(k => names[k.k] + ' = ' + k.value).join(', ');
  const drop = d.drop.map(k => names[k]).join(', ');
  return keep
    ? T('step.detail', { term: d.term, cells: '{' + d.cells.join(', ') + '}', keep, drop: drop || '—' })
    : T('step.detailNoKeep', { term: d.term, cells: '{' + d.cells.join(', ') + '}' });
}

export function renderStep() {
  const box = $('#st-box');
  if (K.stepIdx < 0) {
    box.innerHTML = '<span class="muted">' + T('kmap.stepIdle') + '</span>';
    $('#st-count').textContent = '';
  } else {
    const s = K.steps[K.stepIdx];
    let html = '<h4>' + T(s.key) + '</h4>'
      + '<div class="stepf mono">F = ' + s.formula + '</div>'
      + '<div class="small muted" style="margin-top:4px">' + T(s.reasonKey, s.reasonParams) + '</div>';
    if (s.detail) {
      html += '<div class="small" style="margin-top:8px">'
        + s.detail.map(d => '· ' + detailLine(d, K.n)).join('<br>') + '</div>';
    }
    box.innerHTML = html;
    $('#st-count').textContent = T('kmap.stepCount', { i: K.stepIdx + 1, n: K.steps.length });
  }
  $('#st-prev').disabled = K.stepIdx < 0;
  $('#st-next').disabled = K.steps && K.stepIdx >= K.steps.length - 1;
}

export function stepGo(delta) {
  if (!K.steps || !K.steps.length) return;
  K.stepIdx = Math.max(-1, Math.min(K.steps.length - 1, K.stepIdx + delta));
  drawGroups(K.view, K.stepIdx >= 0 ? K.steps[K.stepIdx].groups : K.groups, K.n);
  renderStep();
}
