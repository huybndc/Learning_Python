import { $, el } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { makeQuestion, solutionDetail, TYPES } from '../logic/ch2-quiz.js';
import { checkAnswer } from '../logic/answer-check.js';
import { systemStrings, generalSolutionString, solve, varNames } from '../logic/linear-system.js';
import { fmtVec } from '../logic/num-format.js';

/* Chương 2 — Luyện tập: 4 dạng. Câu phân loại nghiệm dùng ô chọn (đáp án là
   một trong ba loại), các câu còn lại nhập số. */

const TYPE_KEYS = { unique: 'c2q.tUnique', infinite: 'c2q.tInfinite', none: 'c2q.tNone' };
const Q = { current: null, right: 0, total: 0, answered: false, last: null };

const isChoice = q => q.kind === 'classify';

const answerText = q => (isChoice(q) ? T(TYPE_KEYS[q.answer])
  : Array.isArray(q.answer) ? fmtVec(q.answer) : String(q.answer));

const givenValue = () => (isChoice(Q.current) ? $('#q2-choice').value : $('#q2-ans').value.trim());

/** Lời giải một dòng, dựng từ số liệu logic/ trả về. */
function explainText(q) {
  const d = solutionDetail(q);
  if (q.kind === 'rank') return T('c2q.expRank', { rank: d.rank });
  if (isChoice(q)) {
    return d.type === 'none'
      ? T('c2q.expClassifyNone', { rank: d.rank, rankAug: d.rankAug })
      : T('c2q.expClassify', { rank: d.rank, n: d.nVars, type: T(TYPE_KEYS[d.type]) });
  }
  return T('c2q.expSolve', { sol: generalSolutionString(solve(q.meta.A, q.meta.b)) });
}

function fillChoices() {
  const sel = $('#q2-choice');
  sel.innerHTML = '';
  for (const t of TYPES) {
    const opt = el('option', null, T(TYPE_KEYS[t]));
    opt.value = t;
    sel.appendChild(opt);
  }
}

function showQuestion() {
  const q = Q.current;
  $('#q2-text').textContent = T(q.textKey, { ...q.textParams, names: varNames(q.meta.n).join(', ') });
  const host = $('#q2-system');
  host.innerHTML = '';
  for (const line of systemStrings(q.meta.A, q.meta.b)) host.appendChild(el('div', 'eqline', line));
  $('#q2-ans').style.display = isChoice(q) ? 'none' : '';
  $('#q2-choice').style.display = isChoice(q) ? '' : 'none';
  if (isChoice(q)) fillChoices();
  $('#q2-ans').placeholder = Array.isArray(q.answer) ? T('common.vecAnswerPh') : T('common.numAnswerPh');
}

function newQuestion() {
  Q.current = makeQuestion($('#q2-kind').value);
  Q.answered = false;
  Q.last = null;
  showQuestion();
  $('#q2-ans').value = '';
  $('#q2-result').innerHTML = '';
  if (!isChoice(Q.current)) $('#q2-ans').focus();
}

function say(cls, html) {
  const d = el('div', 'msg ' + cls);
  d.innerHTML = html;
  $('#q2-result').appendChild(d);
}

function updateScore() {
  $('#q2-score').textContent = Q.total ? T('common.score', { right: Q.right, total: Q.total }) : '';
}

/** Vẽ lại ô kết quả từ trạng thái đã lưu — gọi lại được khi đổi ngôn ngữ. */
function renderResult() {
  $('#q2-result').innerHTML = '';
  if (!Q.last) return;
  const { type, given } = Q.last;
  if (type === 'empty') { say('warn', T('common.noAnswer')); return; }
  if (type === 'wrong') {
    // câu chọn lưu khoá loại nghiệm, dịch ở đây để đổi ngôn ngữ là đổi theo
    const shown = isChoice(Q.current) && TYPE_KEYS[given] ? T(TYPE_KEYS[given]) : given;
    say('bad', T('common.wrong', { given: shown }));
    say('warn', T('common.hint', { hint: T(Q.current.hintKey, Q.current.hintParams) }));
    return;
  }
  const head = type === 'right' ? T('common.correct') + ' ' : '';
  say('ok', head + T('common.answerIs', { answer: answerText(Q.current) })
    + '<br><span class="small muted">' + explainText(Q.current) + '</span>');
}

function check() {
  if (!Q.current) return;
  const given = givenValue();
  if (!given) { Q.last = { type: 'empty' }; renderResult(); return; }

  const ok = checkAnswer(given, Q.current.answer, Q.current.tol);
  if (!Q.answered) {
    Q.answered = true;
    Q.total++;
    if (ok) Q.right++;
    updateScore();
  }
  Q.last = { type: ok ? 'right' : 'wrong', given };
  renderResult();
}

function showAnswer() {
  if (!Q.current) return;
  if (!Q.answered) { Q.answered = true; Q.total++; updateScore(); }
  Q.last = { type: 'shown' };
  renderResult();
}

export function setupCh2PracticePage() {
  $('#q2-new').addEventListener('click', newQuestion);
  $('#q2-kind').addEventListener('change', newQuestion);
  $('#q2-check').addEventListener('click', check);
  $('#q2-show').addEventListener('click', showAnswer);
  $('#q2-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  onLangChange(() => {
    if (!Q.current) return;
    showQuestion();
    updateScore();
    renderResult();
  });
  newQuestion();
}
