import { $, el } from './dom-helpers.js';
import { makeQuestion, checkAnswer } from '../logic/ch2-quiz.js';

/* Chương 2 — Luyện tập: nhận diện cổng, chuyển sang NAND, tìm hàm bù. */

const Q = { current: null, right: 0, total: 0, answered: false };

function newQuestion() {
  Q.current = makeQuestion($('#q2-kind').value);
  Q.answered = false;
  $('#q2-text').textContent = Q.current.text;
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
  $('#q2-score').textContent = Q.total ? 'Đúng ' + Q.right + '/' + Q.total + ' câu.' : '';
}

function check() {
  if (!Q.current) return;
  const given = $('#q2-ans').value.trim();
  $('#q2-result').innerHTML = '';
  if (!given) { say('warn', 'Chưa nhập đáp án.'); return; }

  const r = checkAnswer(Q.current, given);
  if (!Q.answered) {
    Q.answered = true;
    Q.total++;
    if (r.ok) Q.right++;
    updateScore();
  }

  if (r.ok) {
    const extra = r.reason === 'truthtable' && given !== Q.current.answer
      ? ' (viết khác đáp án mẫu <span class="mono">' + Q.current.answer + '</span> nhưng tương đương)'
      : '';
    say('ok', '✔ Đúng.' + extra);
  } else if (r.reason === 'parse') {
    say('bad', '✘ Không đọc được biểu thức: ' + r.message);
    say('warn', 'Gợi ý: ' + Q.current.hint);
  } else {
    say('bad', '✘ Chưa đúng. Bạn trả lời <span class="mono">' + given + '</span>.');
    say('warn', 'Gợi ý: ' + Q.current.hint);
  }
}

function showAnswer() {
  if (!Q.current) return;
  if (!Q.answered) { Q.answered = true; Q.total++; updateScore(); }
  $('#q2-result').innerHTML = '';
  say('ok', 'Đáp án: <span class="mono">' + Q.current.answer + '</span><br>'
    + '<span class="small muted">' + Q.current.hint + '</span>');
}

export function setupCh2PracticePage() {
  $('#q2-new').addEventListener('click', newQuestion);
  $('#q2-kind').addEventListener('change', newQuestion);
  $('#q2-check').addEventListener('click', check);
  $('#q2-show').addEventListener('click', showAnswer);
  $('#q2-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  newQuestion();
}
