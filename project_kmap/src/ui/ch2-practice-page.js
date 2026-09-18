import { $, el } from './dom-helpers.js';
import { makeQuestion, checkAnswer } from '../logic/ch2-quiz.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';

/* Chương 2 — Luyện tập: nhận diện cổng, chuyển sang NAND, tìm hàm bù. */

const Q = { current: null, right: 0, total: 0, answered: false };

/** Gợi ý của câu hiện tại, đã dịch. */
const hintText = () => T(Q.current.hintKey, Q.current.hintParams);

function newQuestion() {
  Q.current = makeQuestion($('#q2-kind').value);
  Q.answered = false;
  $('#q2-text').textContent = T(Q.current.textKey, Q.current.textParams);
  $('#q2-ans').value = '';
  $('#q2-result').innerHTML = '';
  $('#q2-ans').focus();
}

function say(cls, html) {
  const d = el('div', 'msg ' + cls);
  d.innerHTML = html;
  $('#q2-result').appendChild(d);
}

function updateScore() {
  $('#q2-score').textContent = Q.total ? T('common.score', { right: Q.right, total: Q.total }) : '';
}

function check() {
  if (!Q.current) return;
  const given = $('#q2-ans').value.trim();
  $('#q2-result').innerHTML = '';
  if (!given) { say('warn', T('common.noAnswer')); return; }

  const r = checkAnswer(Q.current, given);
  if (!Q.answered) {
    Q.answered = true;
    Q.total++;
    if (r.ok) Q.right++;
    updateScore();
  }

  if (r.ok) {
    const extra = r.reason === 'truthtable' && given !== Q.current.answer
      ? T('c2q.equivalent', { answer: Q.current.answer }) : '';
    say('ok', T('common.correct') + extra);
  } else if (r.reason === 'parse') {
    say('bad', T('c2q.parseFail', { message: tError(r.error) }));
    say('warn', T('common.hint', { hint: hintText() }));
  } else {
    say('bad', T('common.wrong', { given }));
    say('warn', T('common.hint', { hint: hintText() }));
  }
}

function showAnswer() {
  if (!Q.current) return;
  if (!Q.answered) { Q.answered = true; Q.total++; updateScore(); }
  $('#q2-result').innerHTML = '';
  say('ok', T('common.answerIs', { answer: Q.current.answer })
    + '<br><span class="small muted">' + hintText() + '</span>');
}

export function setupCh2PracticePage() {
  $('#q2-new').addEventListener('click', newQuestion);
  $('#q2-kind').addEventListener('change', newQuestion);
  $('#q2-check').addEventListener('click', check);
  $('#q2-show').addEventListener('click', showAnswer);
  $('#q2-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  onLangChange(() => {
    $('#q2-text').textContent = T(Q.current.textKey, Q.current.textParams);
    updateScore();
  });
  newQuestion();
}
