import { $, el } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { splitAugmented } from '../logic/matrix.js';
import { solve, systemStrings, generalSolutionString, residual } from '../logic/linear-system.js';
import { systemOfType, TYPES } from '../logic/ch2-quiz.js';
import { fmt } from '../logic/num-format.js';
import { renderMatrix, renderMatrixInputs, changedRows } from './matrix-view.js';
import { state, setSystem } from './ch2-state.js';

/* Chương 2 — Ví dụ: đi từng bước qua phép khử Gauss. Mỗi bước hiện một công
   thức row-op và một câu lý do, đúng tinh thần "mỗi bước một dòng + một câu". */

const PRESETS = {
  u2: [[2, 1, 5], [1, -1, 1]],
  u3: [[1, 2, 3, 6], [2, 5, 2, 4], [6, -3, 1, 2]],
  inf: [[1, 2, 3], [2, 4, 6]],
  none: [[1, 2, 3], [2, 4, 7]],
};
const TYPE_KEYS = { unique: 'c2q.tUnique', infinite: 'c2q.tInfinite', none: 'c2q.tNone' };
const CONC_KEYS = { unique: 'c2.concUnique', infinite: 'c2.concInfinite', none: 'c2.concNone' };

const E = { steps: [], index: 0, result: null };

/** Gộp bước đầu + khử xuôi + khử ngược thành một mạch để bấm qua lại. */
function buildSteps(M) {
  const { A, b } = splitAugmented(M);
  const r = solve(A, b);
  E.result = r;
  E.steps = [
    { matrix: M, formula: '', reasonKey: 'c2.stepStartWhy', reasonParams: {}, titleKey: 'c2.stepStart', phase: 'forward' },
    ...r.forwardSteps.map(s => ({ ...s, phase: 'forward' })),
    ...r.backwardSteps.map(s => ({ ...s, phase: 'backward' })),
  ];
  E.index = 0;
}

function renderStep() {
  const s = E.steps[E.index];
  const n = E.steps.length;
  $('#e2-pos').textContent = T('common.stepPos', { i: E.index + 1, n });
  $('#e2-prev').disabled = E.index === 0;
  $('#e2-next').disabled = E.index === n - 1;

  const phaseKey = E.index === n - 1 ? 'c2.phaseDone'
    : s.phase === 'backward' ? 'c2.phaseBackward' : 'c2.phaseForward';
  const badge = $('#e2-phase');
  badge.textContent = T(phaseKey);
  badge.className = 'badge ' + (E.index === n - 1 ? 'ok' : '');

  renderMatrix($('#e2-matrix'), s.matrix, { pivot: s.pivot || null, changed: changedRows(s.op) });

  const box = $('#e2-step');
  box.innerHTML = '';
  box.className = 'step' + (E.index === E.steps.length - 1 ? ' done' : '');
  box.appendChild(el('div', 'opline', s.formula || T(s.titleKey || 'c2.stepStart')));
  box.appendChild(el('div', 'why', T(s.reasonKey, s.reasonParams)));
  renderConclusion();
}

function renderConclusion() {
  const host = $('#e2-concl');
  host.innerHTML = '';
  if (E.index !== E.steps.length - 1) return;

  const r = E.result;
  const { A, b } = splitAugmented(state.M);
  const line0 = el('p');
  line0.appendChild(el('span', 'badge ' + (r.type === 'unique' ? 'ok' : r.type === 'none' ? 'bad' : 'warn'),
    T(TYPE_KEYS[r.type])));
  host.appendChild(line0);

  const line = el('p', 'eqline l1');
  line.textContent = r.type === 'none'
    ? T(CONC_KEYS.none, { value: fmt(r.ref[r.badRow][A[0].length]) })
    : T(CONC_KEYS[r.type], { sol: generalSolutionString(r) });
  host.appendChild(line);

  host.appendChild(el('p', 'small muted', r.type === 'none'
    ? T('c2.rankLineNone', { rank: r.rankA, rankAug: r.rankAug })
    : T('c2.rankLine', { rank: r.rankA, n: r.nVars, free: r.freeCount })));
  if (r.type !== 'none') {
    const x = r.type === 'unique' ? r.solution : r.particular;
    host.appendChild(el('p', 'small muted', T('c2.checkLine', { res: fmt(residual(A, x, b)) })));
  }
}

function showSystem() {
  const { A, b } = splitAugmented(state.M);
  $('#e2-system').textContent = systemStrings(A, b).join('   ·   ');
}

/** Nhận ma trận mới: dựng lại các bước, vẽ lại, và báo cho card vẽ hình. */
function useSystem(M, rebuildInputs = true) {
  setSystem(M);
  if (rebuildInputs) renderMatrixInputs($('#e2-input'), M, onEdit);
  buildSteps(M);
  showSystem();
  renderStep();
}

function onEdit(M) {
  $('#e2-err').textContent = M ? '' : T('c2.errMatrix');
  if (!M) return;
  setSystem(M);
  buildSteps(M);
  showSystem();
  renderStep();
}

export function setupCh2ExamplePage() {
  $('#e2-preset').addEventListener('change', e => {
    $('#e2-err').textContent = '';
    useSystem(PRESETS[e.target.value].map(r => r.slice()));
  });
  $('#e2-random').addEventListener('click', () => {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const n = Math.random() < 0.5 ? 2 : 3;
    const { A, b } = systemOfType(type, n, Math.random);
    $('#e2-err').textContent = '';
    useSystem(A.map((row, i) => [...row, b[i]]));
  });
  $('#e2-prev').addEventListener('click', () => { E.index = Math.max(0, E.index - 1); renderStep(); });
  $('#e2-next').addEventListener('click', () => {
    E.index = Math.min(E.steps.length - 1, E.index + 1);
    renderStep();
  });
  onLangChange(() => { showSystem(); renderStep(); });
  useSystem(PRESETS.u3.map(r => r.slice()));
}
