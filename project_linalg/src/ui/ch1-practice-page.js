import { $, el } from './dom-helpers.js';
import { t as T, onLangChange } from '../i18n/index.js';
import { makeQuestion, solutionDetail } from '../logic/ch1-quiz.js';
import { checkAnswer } from '../logic/answer-check.js';
import { fmtVec, fmt } from '../logic/num-format.js';

/* Chương 1 — Luyện tập: sinh đề 4 dạng, chấm theo giá trị số (có sai số),
   sai thì đưa gợi ý, xem đáp án thì kèm lời giải từng bước. */

const Q = { current: null, right: 0, total: 0, answered: false, last: null };

const answerText = q => (Array.isArray(q.answer) ? fmtVec(q.answer) : fmt(q.answer))
  + (q.kind === 'angle' ? '°' : '');

/** Lời giải một dòng, dựng từ số liệu logic/ trả về. */
function explainText(q) {
  const d = solutionDetail(q);
  switch (q.kind) {
    case 'combine':
      return T('c1q.expCombine', { a: d.parts[0], b: d.parts[1], r: d.result });
    case 'dot':
      return T('c1q.expDot', { parts: d.parts.join(' + '), r: d.result });
    case 'length':
      return T('c1q.expLength', { parts: d.parts.join(' + '), r: d.result });
    case 'angle':
      return T('c1q.expAngle', { d: d.parts[0], nv: d.parts[1], nw: d.parts[2], r: d.result });
    default:
      return '';
  }
}

function showQuestionText() {
  $('#q1-text').textContent = T(Q.current.textKey, Q.current.textParams);
  $('#q1-ans').placeholder = Array.isArray(Q.current.answer)
    ? T('common.vecAnswerPh') : T('common.numAnswerPh');
}

function newQuestion() {
  Q.current = makeQuestion($('#q1-kind').value);
  Q.answered = false;
  Q.last = null;
  showQuestionText();
  $('#q1-ans').value = '';
  $('#q1-result').innerHTML = '';
  $('#q1-ans').focus();
}

function say(cls, html) {
  const d = el('div', 'msg ' + cls);
  d.innerHTML = html;
  $('#q1-result').appendChild(d);
}

function updateScore() {
  $('#q1-score').textContent = Q.total ? T('common.score', { right: Q.right, total: Q.total }) : '';
}

/** Vẽ lại ô kết quả từ trạng thái đã lưu — gọi lại được khi đổi ngôn ngữ. */
function renderResult() {
  const box = $('#q1-result');
  box.innerHTML = '';
  if (!Q.last) return;
  const { type, given } = Q.last;
  if (type === 'empty') { say('warn', T('common.noAnswer')); return; }
  if (type === 'wrong') {
    say('bad', T('common.wrong', { given }));
    say('warn', T('common.hint', { hint: T(Q.current.hintKey, Q.current.hintParams) }));
    return;
  }
  const head = type === 'right' ? T('common.correct') + ' ' : '';
  say('ok', head + T('common.answerIs', { answer: answerText(Q.current) })
    + '<br><span class="small muted">' + explainText(Q.current) + '</span>');
}

function check() {
  if (!Q.current) return;
  const given = $('#q1-ans').value.trim();
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

export function setupCh1PracticePage() {
  $('#q1-new').addEventListener('click', newQuestion);
  $('#q1-kind').addEventListener('change', newQuestion);
  $('#q1-check').addEventListener('click', check);
  $('#q1-show').addEventListener('click', showAnswer);
  $('#q1-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  onLangChange(() => {
    if (!Q.current) return;
    showQuestionText();
    updateScore();
    renderResult();
  });
  newQuestion();
}
