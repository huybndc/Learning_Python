/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D3 — Tập hợp, hàm (MCS 4; Rosen 2.1–2.3). Thuần.
   - setop: A ∪ B, A ∩ B, A − B, A ⊕ B, phần bù trong U — trả lời bằng danh sách phần tử.
   - count: |P(A)|, |A × B|, |A ∪ B| bằng bao hàm–loại trừ.
   - func:  một ánh xạ cho bằng mũi tên — có phải hàm? đơn ánh / toàn ánh / song ánh?
   --------------------------------------------------------------- */

import { fail } from '@shared/logic/app-error.js';
import { pick, int, shuffle } from '@shared/logic/shuffle.js';
import { parseIntSet, sameSet, parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['setop', 'count', 'func'];
export const SECONDS = { setop: 60, count: 60, func: 60 };

const setStr = a => `{${[...a].sort((x, y) => x - y).join(', ')}}`;
const sample = (pool, n, rnd) => shuffle(pool, rnd).slice(0, n).sort((x, y) => x - y);

const OPS = {
  union: { s: 'A ∪ B', f: (A, B) => [...new Set([...A, ...B])] },
  inter: { s: 'A ∩ B', f: (A, B) => A.filter(x => B.includes(x)) },
  diff: { s: 'A − B', f: (A, B) => A.filter(x => !B.includes(x)) },
  sym: { s: 'A ⊕ B', f: (A, B) => [...A.filter(x => !B.includes(x)), ...B.filter(x => !A.includes(x))] },
  comp: { s: 'Aᶜ', f: (A, B, U) => U.filter(x => !A.includes(x)) },
};

function makeSetop(rnd) {
  const U = [...Array(10).keys()].map(i => i + 1);
  const A = sample(U, int(3, 6, rnd), rnd), B = sample(U, int(3, 6, rnd), rnd);
  const op = pick(Object.keys(OPS), rnd);
  const ans = OPS[op].f(A, B, U).sort((x, y) => x - y);
  return {
    kind: 'setop', format: 'set', textKey: op === 'comp' ? 'c3q.qComp' : 'c3q.qSetop',
    textParams: { A: setStr(A), B: setStr(B), op: OPS[op].s, U: setStr(U) },
    answer: ans, answerText: setStr(ans), hintKey: 'c3q.h_' + op, meta: { A, B, op },
    work: [L('c3q.h_' + op), L('s1.result', {}, `${OPS[op].s} = ${setStr(ans)}`)],
  };
}

function makeCount(rnd) {
  const which = pick(['power', 'product', 'incl'], rnd);
  if (which === 'power') {
    const n = int(2, 7, rnd);
    const A = sample([...Array(9).keys()].map(i => i + 1), n, rnd);
    return { kind: 'count', format: 'number', textKey: 'c3q.qPower', textParams: { A: setStr(A) }, answer: 2 ** n,
      meta: { which, n }, work: [L('s3.power', { n }, `|P(A)| = 2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]} = ${2 ** n}`)] };
  }
  if (which === 'product') {
    const m = int(2, 6, rnd), n = int(2, 6, rnd);
    return { kind: 'count', format: 'number', textKey: 'c3q.qProduct', textParams: { m, n }, answer: m * n,
      meta: { which, m, n }, work: [L('s3.product', {}, `|A × B| = ${m} · ${n} = ${m * n}`)] };
  }
  const a = int(10, 40, rnd), b = int(10, 40, rnd), c = int(1, Math.min(a, b) - 1, rnd);
  return { kind: 'count', format: 'number', textKey: 'c3q.qIncl', textParams: { a, b, c }, answer: a + b - c,
    meta: { which, a, b, c }, work: [L('s3.incl', {}, `|A ∪ B| = ${a} + ${b} − ${c} = ${a + b - c}`)] };
}

/** Ánh xạ f: A → B cho bằng danh sách mũi tên; có thể cố tình không phải hàm (thiếu / thừa ảnh). */
function makeFunc(rnd) {
  const A = [1, 2, 3, 4].slice(0, int(3, 4, rnd)), B = ['a', 'b', 'c', 'd'].slice(0, int(3, 4, rnd));
  let arrows = A.map(x => [x, pick(B, rnd)]);
  const broken = rnd() < 0.2;
  if (broken) {
    if (rnd() < 0.5) arrows = arrows.slice(1);                               // phần tử 1 không có ảnh
    else arrows.push([arrows[0][0], B.find(y => y !== arrows[0][1])]);       // phần tử có hai ảnh
  } else if (rnd() < 0.5 && A.length === B.length) { const perm = shuffle(B, rnd); arrows = A.map((x, i) => [x, perm[i]]); }   // song ánh
  arrows = arrows.sort((p, q) => p[0] - q[0]);
  const isFunc = A.every(x => arrows.filter(([p]) => p === x).length === 1);
  const imgs = arrows.map(([, y]) => y);
  const inj = isFunc && new Set(imgs).size === imgs.length;
  const sur = isFunc && B.every(y => imgs.includes(y));
  const order = ['notfunc', 'neither', 'inj', 'sur', 'bij'];
  const kind = !isFunc ? 'notfunc' : inj && sur ? 'bij' : inj ? 'inj' : sur ? 'sur' : 'neither';
  const dup = imgs.find((y, i) => imgs.indexOf(y) !== i);
  const miss = B.find(y => !imgs.includes(y));
  return {
    kind: 'func', format: 'choice',
    textKey: 'c3q.qFunc', textParams: { A: `{${A.join(', ')}}`, B: `{${B.join(', ')}}`, f: arrows.map(([x, y]) => `${x} ↦ ${y}`).join(',  ') },
    choices: order.map(k => 'c3q.fn.' + k), answer: order.indexOf(kind), hintKey: 'c3q.hFunc', meta: { arrows },
    work: !isFunc
      ? [L('s3.notFunc')]
      : [dup ? L('s3.notInj', { y: dup }) : L('s3.isInj'), miss ? L('s3.notSur', { y: miss }) : L('s3.isSur')],
  };
}

const MAKERS = { setop: makeSetop, count: makeCount, func: makeFunc };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c3q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.format === 'choice') return { ok: Number(given) === q.answer };
  if (q.format === 'set') {
    if (/^\s*(∅|\{\s*\}|rỗng|empty)\s*$/i.test(String(given))) return { ok: q.answer.length === 0 };
    const list = parseIntSet(given);
    if (!list) return { retry: true, detailKey: 'run.needList' };
    return { ok: sameSet(list, q.answer) };
  }
  const n = parseNumber(given);
  if (n === null) return { retry: true, detailKey: 'run.needNumber' };
  return { ok: n === q.answer };
}
