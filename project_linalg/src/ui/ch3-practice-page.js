import { $, el } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { makeQuestion, solutionDetail } from '../logic/ch3-quiz.js';
import { checkAnswer } from '../logic/answer-check.js';
import { fmt } from '../logic/num-format.js';
import { SPAN_KIND_KEYS } from './span-draw.js';

/* Chương 3 — Luyện tập: ba dạng chọn đáp án, một dạng nhập số. */

const YESNO_KEYS = { yes: 'c3.yes', no: 'c3.no' };
const CHOICE_KEYS = { ...YESNO_KEYS, ...SPAN_KIND_KEYS };
const Q = { current: null, right: 0, total: 0, answered: false, last: null };

const isChoice = q => Array.isArray(q.choices);
const labelOf = value => (CHOICE_KEYS[value] ? T(CHOICE_KEYS[value]) : String(value));
const answerText = q => (isChoice(q) ? labelOf(q.answer) : fmt(q.answer));
const givenValue = () => (isChoice(Q.current) ? $('#q3-choice').value : $('#q3-ans').value.trim());

/** Lời giải một dòng, dựng từ số liệu logic/ trả về. */
function explainText(q) {
  const d = solutionDetail(q);
  switch (q.kind) {
    case 'independent':
      return T('c3q.expIndependent', {
        rank: d.rank, count: d.count, verdict: labelOf(q.answer),
      });
    case 'spankind':
      return T('c3q.expSpanKind', { rank: d.rank, kind: T(SPAN_KIND_KEYS[d.spanKind]) });
    case 'inspan':
      return q.answer === 'yes'
        ? T('c3q.expInSpanYes', { coefs: d.coefs.map(c => fmt(c)).join(', ') })
        : T('c3q.expInSpanNo', { rank: d.rank });
    case 'nulldim':
      return T('c3q.expNullDim', { count: d.count, rank: d.rank, nul: d.nullDim });
    default:
      return '';
  }
}

function fillChoices() {
  const sel = $('#q3-choice');
  sel.innerHTML = '';
  for (const c of Q.current.choices) {
    const opt = el('option', null, labelOf(c));
    opt.value = c;
    sel.appendChild(opt);
  }
}

function showQuestion() {
  const q = Q.current;
  $('#q3-text').textContent = T(q.textKey, q.textParams);
  $('#q3-ans').style.display = isChoice(q) ? 'none' : '';
  $('#q3-choice').style.display = isChoice(q) ? '' : 'none';
  // câu không phải dạng chọn: dọn sạch ô chọn đang ẩn, đừng để sót nhãn câu trước
  if (isChoice(q)) fillChoices(); else $('#q3-choice').innerHTML = '';
  $('#q3-ans').placeholder = T('common.numAnswerPh');
}

function newQuestion() {
  Q.current = makeQuestion($('#q3-kind').value);
  Q.answered = false;
  Q.last = null;
  showQuestion();
  $('#q3-ans').value = '';
  $('#q3-result').innerHTML = '';
  if (!isChoice(Q.current)) $('#q3-ans').focus();
}

function say(cls, html) {
  const d = el('div', 'msg ' + cls);
  d.innerHTML = html;
  $('#q3-result').appendChild(d);
}

function updateScore() {
  $('#q3-score').textContent = Q.total ? T('common.score', { right: Q.right, total: Q.total }) : '';
}

/** Vẽ lại ô kết quả từ trạng thái đã lưu — gọi lại được khi đổi ngôn ngữ. */
function renderResult() {
  $('#q3-result').innerHTML = '';
  if (!Q.last) return;
  const { type, given } = Q.last;
  if (type === 'empty') { say('warn', T('common.noAnswer')); return; }
  if (type === 'wrong') {
    say('bad', T('common.wrong', { given: isChoice(Q.current) ? labelOf(given) : given }));
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

export function setupCh3PracticePage() {
  $('#q3-new').addEventListener('click', newQuestion);
  $('#q3-kind').addEventListener('change', newQuestion);
  $('#q3-check').addEventListener('click', check);
  $('#q3-show').addEventListener('click', showAnswer);
  $('#q3-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  onLangChange(() => {
    if (!Q.current) return;
    showQuestion();
    updateScore();
    renderResult();
  });
  newQuestion();
}
