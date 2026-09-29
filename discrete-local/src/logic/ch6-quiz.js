/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D6 — Chia hết, gcd, Euclid & Pulverizer (MCS 9.1–9.2). Thuần.
   Bézout có VÔ SỐ cặp (s, t) đúng ⇒ chấm bằng cách kiểm s·a + t·b = gcd, không so chuỗi.
   --------------------------------------------------------------- */

import { euclid, pulverize, gcd, lcm } from './number-theory.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, int } from '@shared/logic/shuffle.js';
import { parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['gcd', 'bezout', 'lcm'];
export const SECONDS = { gcd: 60, bezout: 150, lcm: 60 };

/** Cặp số có gcd "đáng tính" (không phải 1 quá thường, không bội nhau quá dễ). */
function pair(rnd, big = 999) {
  for (;;) {
    const g = pick([1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 17, 21], rnd);
    const a = g * int(3, Math.floor(big / g), rnd), b = g * int(2, Math.floor(big / g), rnd);
    if (a !== b && a % b !== 0 && b % a !== 0 && a > 20 && b > 10) return a > b ? [a, b] : [b, a];
  }
}

const euclidLines = (a, b) => euclid(a, b).steps.map(s => `${s.a} = ${s.q}·${s.b} + ${s.r}`);

function makeGcd(rnd) {
  const [a, b] = pair(rnd);
  const g = gcd(a, b);
  return {
    kind: 'gcd', format: 'number', textKey: 'c6q.qGcd', textParams: { a, b }, answer: g,
    hintKey: 'c6q.hGcd', meta: { a, b },
    work: [L('s6.euclid'), ...euclidLines(a, b), L('s6.lastNonZero', {}, `gcd(${a}, ${b}) = ${g}`)],
  };
}

function makeBezout(rnd) {
  const [a, b] = pair(rnd, 300);
  const p = pulverize(a, b);
  const sgn = x => (x < 0 ? `(${x})` : String(x));
  return {
    kind: 'bezout', format: 'text', textKey: 'c6q.qBezout', textParams: { a, b, g: p.gcd },
    answer: [p.s, p.t], answerText: `s = ${p.s}, t = ${p.t}`,
    hintKey: 'c6q.hBezout', meta: { a, b },
    work: [
      L('s6.pulver', { a, b }),
      ...p.rows.slice(2, -1).map(r => `${r.r} = ${sgn(r.s)}·${a} + ${sgn(r.t)}·${b}   (q = ${r.q})`),
      L('s6.check', {}, `${sgn(p.s)}·${a} + ${sgn(p.t)}·${b} = ${p.s * a + p.t * b}`),
      L('s6.many', { a2: b / p.gcd, b2: a / p.gcd }),
    ],
  };
}

function makeLcm(rnd) {
  const [a, b] = pair(rnd, 200);
  const g = gcd(a, b);
  return {
    kind: 'lcm', format: 'number', textKey: 'c6q.qLcm', textParams: { a, b }, answer: lcm(a, b),
    hintKey: 'c6q.hLcm', meta: { a, b },
    work: [L('s6.euclid'), ...euclidLines(a, b), L('s6.lcmRule', {}, `lcm = ${a}·${b} / ${g} = ${lcm(a, b)}`)],
  };
}

const MAKERS = { gcd: makeGcd, bezout: makeBezout, lcm: makeLcm };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c6q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.kind === 'bezout') {
    const nums = String(given).replace(/[−–]/g, '-').match(/-?\d+/g);
    if (!nums || nums.length !== 2) return { retry: true, detailKey: 'c6q.needTwo' };
    const [s, t] = nums.map(Number);
    const { a, b } = q.meta;
    const v = s * a + t * b;
    return v === gcd(a, b) ? { ok: true } : { ok: false, detailKey: 'c6q.dBezout', detailParams: { v } };
  }
  const n = parseNumber(given);
  if (n === null) return { retry: true, detailKey: 'run.needNumber' };
  return { ok: n === q.answer };
}
