/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D2 — Vị từ & lượng từ (MCS 3.6; Rosen 1.4–1.5). Thuần.
   - truth:  ∀/∃ lồng nhau trên miền số nhỏ — tính bằng vét cạn, lời giải chỉ ra phần tử chứng minh / phản ví dụ.
   - negate: phủ định mệnh đề có lượng từ — nhiễu là lỗi thật (quên đổi ∀/∃, ¬(A → B) viết thành A → ¬B…),
             mọi nhiễu đều được máy kiểm là KHÔNG tương đương với đáp án (sameOnSamples).
   --------------------------------------------------------------- */

import { all, ex, atom, not, and, or, imp, negate, formatQ, sameOnSamples } from './quant.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, shuffle } from '@shared/logic/shuffle.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['truth', 'negate'];
export const SECONDS = { truth: 90, negate: 60 };

/* Quan hệ hai biến trên miền số — chữ hiện đúng như viết tay. */
const REL = [
  { s: 'x < y', f: (x, y) => x < y }, { s: 'x ≤ y', f: (x, y) => x <= y }, { s: 'x + y = 0', f: (x, y) => x + y === 0 },
  { s: 'x · y = 0', f: (x, y) => x * y === 0 }, { s: 'x ≠ y', f: (x, y) => x !== y }, { s: 'x = y²', f: (x, y) => x === y * y },
  { s: 'x + y > 2', f: (x, y) => x + y > 2 }, { s: 'x · y ≥ x', f: (x, y) => x * y >= x },
];
const DOMAINS = [[-2, -1, 0, 1, 2], [0, 1, 2, 3], [1, 2, 3, 4], [-1, 0, 1]];
/* Thứ tự lượng từ: [lượng từ ngoài, biến ngoài, lượng từ trong, biến trong] */
const ORDERS = [['all', 'x', 'ex', 'y'], ['ex', 'y', 'all', 'x'], ['ex', 'x', 'all', 'y'], ['all', 'y', 'ex', 'x'], ['all', 'x', 'all', 'y'], ['ex', 'x', 'ex', 'y']];
const Q = { all: '∀', ex: '∃' };
const set = d => `{${d.join(', ')}}`;

function makeTruth(rnd) {
  const rel = pick(REL, rnd), D = pick(DOMAINS, rnd), [qo, vo, qi, vi] = pick(ORDERS, rnd);
  const holds = (o, i) => (vo === 'x' ? rel.f(o, i) : rel.f(i, o));      // o = giá trị biến ngoài
  const inner = o => (qi === 'all' ? D.every(i => holds(o, i)) : D.some(i => holds(o, i)));
  const value = qo === 'all' ? D.every(inner) : D.some(inner);
  // lời giải: với từng giá trị biến ngoài, bên trong đúng/sai vì phần tử nào
  const why = o => {
    if (qi === 'ex') { const w = D.find(i => holds(o, i)); return w === undefined ? L('s2.noWitness', { o: `${vo} = ${o}`, v: vi }) : `${vo} = ${o}: ${vi} = ${w} ✓`; }
    const c = D.find(i => !holds(o, i)); return c === undefined ? `${vo} = ${o}: ∀${vi} ✓` : L('s2.counter', { o: `${vo} = ${o}`, c: `${vi} = ${c}` });
  };
  const text = `${Q[qo]}${vo} ${Q[qi]}${vi} (${rel.s})`;
  return {
    kind: 'truth', format: 'choice', textKey: 'c2q.qTruth', textParams: { f: text, d: set(D) },
    choices: ['c2q.true', 'c2q.false'], answer: value ? 0 : 1, hintKey: 'c2q.hTruth',
    meta: { f: text, d: D },
    work: [L(qo === 'all' ? 's2.outerAll' : 's2.outerEx', { v: vo }), ...D.map(why), L(value ? 's2.isTrue' : 's2.isFalse')],
  };
}

const P = atom('P', 'x'), Qx = atom('Q', 'x'), Qy = atom('Q', 'y'), R = atom('R', 'x', 'y'), Ryx = atom('R', 'y', 'x');
/* Mẫu cần phủ định — đủ các kiểu Rosen / MCS hay hỏi: một lượng từ với ∧ ∨ → và ¬ bên trong, kéo theo có lượng từ,
   hai lượng từ lồng (kể cả y đứng ngoài), lượng từ lồng có thêm điều kiện, tính đối xứng của quan hệ. */
const BASES = [
  // một lượng từ
  all('x', imp(P, Qx)), ex('x', and(P, Qx)), all('x', or(P, Qx)), ex('x', imp(P, Qx)), ex('x', or(P, Qx)),
  all('x', and(P, Qx)), all('x', not(P)), ex('x', and(P, not(Qx))), all('x', imp(P, not(Qx))),
  // hai lượng từ lồng
  all('x', ex('y', R)), ex('x', all('y', R)), ex('y', all('x', R)), all('y', ex('x', R)), ex('x', ex('y', R)),
  all('x', all('y', imp(R, P))), all('x', all('y', imp(R, Ryx))),
  // lượng từ trong một vế / kèm điều kiện
  all('x', imp(P, ex('y', R))), ex('x', and(P, all('y', R))), all('x', imp(P, all('y', R))),
  all('x', ex('y', and(R, Qy))), ex('x', all('y', imp(R, Qy))),
];

/** Các lỗi hay gặp khi phủ định (sai có hệ thống, không phải chọn bừa). */
function mistakes(f) {
  const keepQ = g => (g.t === 'all' || g.t === 'ex' ? { ...g, body: keepQ(g.body) } : negate(g));        // quên đổi ∀ ↔ ∃
  const flipOnly = g => (g.t === 'all' ? ex(g.v, flipOnly(g.body)) : g.t === 'ex' ? all(g.v, flipOnly(g.body)) : g);   // chỉ đổi lượng từ
  const impWrong = g => (g.t === 'all' ? ex(g.v, impWrong(g.body)) : g.t === 'ex' ? all(g.v, impWrong(g.body))
    : g.t === 'imp' ? imp(g.a, impWrong(g.b)) : negate(g));                                         // ¬(A → B) viết thành A → ¬B
  const outerOnly = g => (g.t === 'all' ? ex(g.v, g.body) : g.t === 'ex' ? all(g.v, g.body) : not(g));
  return [keepQ(f), flipOnly(f), impWrong(f), outerOnly(f), negate(flipOnly(f)), f];
}

function makeNegate(rnd) {
  const f = pick(BASES, rnd);
  const right = negate(f);
  const preds = { P: 1, Q: 1, R: 1 };
  const seen = new Set([formatQ(right)]);
  const wrong = [];
  for (const m of shuffle(mistakes(f), rnd)) {
    const s = formatQ(m);
    if (seen.has(s) || sameOnSamples(m, right, rnd, preds)) continue;         // nhiễu phải SAI thật
    seen.add(s); wrong.push(s);
    if (wrong.length === 3) break;
  }
  const choices = shuffle([formatQ(right), ...wrong], rnd);
  return {
    kind: 'negate', format: 'choice', mcq: true, textKey: 'c2q.qNegate', textParams: { f: formatQ(f) },
    choices, answer: choices.indexOf(formatQ(right)), hintKey: 'c2q.hNegate',
    meta: { f: formatQ(f) },
    work: [L('s2.negRules'), L('s2.negStart', {}, `¬(${formatQ(f)})`), L('s1.result', {}, formatQ(right))],
  };
}

const MAKERS = { truth: makeTruth, negate: makeNegate };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c2q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  return { ok: Number(given) === q.answer };
}
