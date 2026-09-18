import { $, el } from './dom-helpers.js';
import { makeQuestion, compareAnswer } from '../logic/ch1-quiz.js';

/* Chương 1 — Luyện tập: sinh đề ngẫu nhiên 4 dạng, chấm và gợi ý. */

const Q = { current: null, right: 0, total: 0, answered: false };

function newQuestion() {
  Q.current = makeQuestion($('#q-kind').value);
  Q.answered = false;
  $('#q-text').textContent = Q.current.text;
  $('#q-ans').value = '';
  $('#q-result').innerHTML = '';
  $('#q-ans').focus();
}

function say(cls, html) {
  const d = el('div', 'msg ' + cls);
  d.innerHTML = html;
  $('#q-result').appendChild(d);
}

function updateScore() {
  $('#q-score').textContent = Q.total ? 'Đúng ' + Q.right + '/' + Q.total + ' câu.' : '';
}

function check() {
  if (!Q.current) return;
  const given = $('#q-ans').value.trim();
  $('#q-result').innerHTML = '';
  if (!given) { say('warn', 'Chưa nhập đáp án.'); return; }

  const ok = compareAnswer(given, Q.current.answer);
  if (!Q.answered) {
    Q.answered = true;
    Q.total++;
    if (ok) Q.right++;
    updateScore();
  }
  if (ok) {
    say('ok', '✔ Đúng. Đáp án: <span class="mono">' + Q.current.answer + '</span>');
  } else {
    say('bad', '✘ Chưa đúng. Bạn trả lời <span class="mono">' + given + '</span>.');
    say('warn', 'Gợi ý: ' + Q.current.hint);
  }
}

function showAnswer() {
  if (!Q.current) return;
  if (!Q.answered) { Q.answered = true; Q.total++; updateScore(); }
  $('#q-result').innerHTML = '';
  say('ok', 'Đáp án: <span class="mono">' + Q.current.answer + '</span><br>'
    + '<span class="small muted">' + Q.current.hint + '</span>');
}

export function setupCh1PracticePage() {
  $('#q-new').addEventListener('click', newQuestion);
  $('#q-kind').addEventListener('change', newQuestion);
  $('#q-check').addEventListener('click', check);
  $('#q-show').addEventListener('click', showAnswer);
  $('#q-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  newQuestion();
}
