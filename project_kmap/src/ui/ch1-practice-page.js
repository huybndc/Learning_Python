import { $, el } from './dom-helpers.js';
import { makeQuestion, compareAnswer } from '../logic/ch1-quiz.js';
import { t as T, tError, onLangChange } from '../i18n/index.js';

/* Chương 1 — Luyện tập: sinh đề ngẫu nhiên 4 dạng, chấm và gợi ý. */

const Q = { current: null, right: 0, total: 0, answered: false };

/** Tham số đề bài, dịch sẵn các tham số vốn là khoá (base.*, c1.fmt*). */
function textParams() {
  const p = { ...Q.current.textParams };
  ['from', 'to', 'format'].forEach(k => { if (typeof p[k] === 'string' && p[k].includes('.')) p[k] = T(p[k]); });
  return p;
}

/** Gợi ý của câu hiện tại, đã dịch (tham số có thể là khoá lồng). */
function hintText() {
  const p = { ...Q.current.hintParams };
  if (p.format) p.format = T(p.format);
  return T(Q.current.hintKey, p);
}

function newQuestion() {
  Q.current = makeQuestion($('#q-kind').value);
  Q.answered = false;
  $('#q-text').textContent = T(Q.current.textKey, textParams());
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
  $('#q-score').textContent = Q.total ? T('common.score', { right: Q.right, total: Q.total }) : '';
}

function check() {
  if (!Q.current) return;
  const given = $('#q-ans').value.trim();
  $('#q-result').innerHTML = '';
  if (!given) { say('warn', T('common.noAnswer')); return; }

  const ok = compareAnswer(given, Q.current.answer);
  if (!Q.answered) {
    Q.answered = true;
    Q.total++;
    if (ok) Q.right++;
    updateScore();
  }
  if (ok) {
    say('ok', T('common.correct') + ' ' + T('common.answerIs', { answer: Q.current.answer }));
  } else {
    say('bad', T('common.wrong', { given }));
    say('warn', T('common.hint', { hint: hintText() }));
  }
}

function showAnswer() {
  if (!Q.current) return;
  if (!Q.answered) { Q.answered = true; Q.total++; updateScore(); }
  $('#q-result').innerHTML = '';
  say('ok', T('common.answerIs', { answer: Q.current.answer })
    + '<br><span class="small muted">' + hintText() + '</span>');
}

export function setupCh1PracticePage() {
  $('#q-new').addEventListener('click', newQuestion);
  $('#q-kind').addEventListener('change', newQuestion);
  $('#q-check').addEventListener('click', check);
  $('#q-show').addEventListener('click', showAnswer);
  $('#q-ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  onLangChange(() => {
    $('#q-text').textContent = T(Q.current.textKey, textParams());
    updateScore();
  });
  newQuestion();
}
