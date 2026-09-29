/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D7 — Đồng dư, nghịch đảo, lũy thừa mod, φ, RSA (MCS 9.6–9.11). Thuần.
   RSA theo các bước của GV (RSA.py): n = pq, φ = (p−1)(q−1), d = e⁻¹ mod φ, c = mᵉ mod n.
   --------------------------------------------------------------- */

import { mod, pulverize, modInverse, modPow, factorize, phi, rsaKeys, gcd } from './number-theory.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, int } from '@shared/logic/shuffle.js';
import { parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['mod', 'inverse', 'power', 'phi', 'rsa'];
export const GROUPS = [
  { id: 'g-mod', kinds: ['mod', 'inverse', 'power'] },
  { id: 'g-rsa', kinds: ['phi', 'rsa'] },
];
export const SECONDS = { mod: 40, inverse: 120, power: 150, phi: 60, rsa: 240 };

const PRIMES = [5, 7, 11, 13, 17, 19, 23, 29, 31];
const NONE = /^(none|no|không|khong|ko|x|—|-|∅)$/i;
const sgn = x => (x < 0 ? `(${x})` : String(x));
const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

/** Lời giải tìm a⁻¹ mod n bằng Pulverizer — dùng cho nghịch đảo lẫn khoá RSA d. */
function invLines(a, n) {
  const inv = modInverse(a, n);
  if (inv === null) return [L('s7.gcdNot1', { a, n, g: gcd(a, n) })];
  const p = pulverize(n, a);
  return [
    L('s6.pulver', { a: n, b: a }), ...p.rows.slice(2, -1).map(r => `${r.r} = ${sgn(r.s)}·${n} + ${sgn(r.t)}·${a}`),
    L('s7.readInverse', { t: p.t, n }, `${a}⁻¹ ≡ ${inv} (mod ${n})`), L('s7.checkInv', {}, `${a}·${inv} = ${a * inv} ≡ 1 (mod ${n})`),
  ];
}

/** Lời giải aᵏ mod n bằng bình phương liên tiếp — dùng cho cả lũy thừa lẫn mã hoá RSA. */
function powLines(a, k, n) {
  const r = modPow(a, k, n);
  return [
    L('s7.bits', { k }, `${k} = (${r.bits})₂ = ${r.used.map(i => 2 ** i).join(' + ')}`),
    L('s7.squares'), r.squares.map(s => `${a}${sup(2 ** s.i)} ≡ ${s.v}`).join(',   '),
    L('s7.multiply', {}, `${a}${sup(k)} ≡ ${r.used.map(i => r.squares[i].v).join(' · ')} ≡ ${r.value} (mod ${n})`),
  ];
}

function makeMod(rnd) {
  const n = int(3, 29, rnd);
  const a = pick([int(-300, -1, rnd), int(30, 999, rnd)], rnd);
  const r = mod(a, n), q = (a - r) / n;
  return {
    kind: 'mod', format: 'number', textKey: 'c7q.qMod', textParams: { a, n }, answer: r,
    hintKey: a < 0 ? 'c7q.hModNeg' : 'c7q.hMod', meta: { a, n },
    work: [L('s7.division', {}, `${a} = ${sgn(q)}·${n} + ${r}`), L('s7.range', { n1: n - 1 }, `${a} mod ${n} = ${r}`)],
  };
}

function makeInverse(rnd) {
  const n = int(7, 60, rnd);
  let a = int(2, n - 1, rnd);
  if (rnd() < 0.8) while (gcd(a, n) !== 1) a = int(2, n - 1, rnd);        // phần lớn có nghịch đảo
  const inv = modInverse(a, n);
  return {
    kind: 'inverse', format: 'text', textKey: 'c7q.qInverse', textParams: { a, n },
    answer: inv ?? 'none', answerText: inv === null ? 'c7q.none' : String(inv),
    hintKey: 'c7q.hInverse', meta: { a, n },
    work: invLines(a, n),
  };
}

function makePower(rnd) {
  const n = int(7, 47, rnd), a = int(2, n - 1, rnd), k = int(10, 60, rnd);
  return {
    kind: 'power', format: 'number', textKey: 'c7q.qPower', textParams: { a, k, n }, answer: modPow(a, k, n).value,
    hintKey: 'c7q.hPower', meta: { a, k, n }, work: powLines(a, k, n),
  };
}

function makePhi(rnd) {
  const n = pick([int(20, 200, rnd), pick(PRIMES, rnd) * pick(PRIMES, rnd), pick(PRIMES, rnd) ** 2], rnd);
  const f = factorize(n);
  const fmt = f.map(({ p, e }) => (e > 1 ? `${p}^${e}` : String(p))).join(' · ');
  return {
    kind: 'phi', format: 'number', textKey: 'c7q.qPhi', textParams: { n }, answer: phi(n),
    hintKey: 'c7q.hPhi', meta: { n },
    work: [
      L('s7.factor', {}, `${n} = ${fmt}`),
      L('s7.phiRule', {}, `φ(${n}) = ${f.map(({ p, e }) => (e > 1 ? `${p}^${e - 1}·(${p} − 1)` : `(${p} − 1)`)).join(' · ')} = ${phi(n)}`),
    ],
  };
}

/** RSA: tìm d (review 'rsaD') hoặc mã hoá m (review 'rsaEnc'). */
function makeRsa(rnd) {
  let p, q, e;
  do {
    p = pick(PRIMES, rnd); q = pick(PRIMES.filter(x => x !== p), rnd); e = pick([3, 5, 7, 11, 13, 17], rnd);
  } while (gcd(e, (p - 1) * (q - 1)) !== 1);
  const k = rsaKeys(p, q, e);
  if (rnd() < 0.5) {
    return {
      kind: 'rsa', format: 'number', review: 'rsaD', textKey: 'c7q.qRsaD', textParams: { p, q, e }, answer: k.d,
      hintKey: 'c7q.hRsaD', meta: { p, q, e, ask: 'd' }, formatKey: 'c7q.f_rsaD',
      work: [L('s7.rsaN', {}, `n = ${p}·${q} = ${k.n},  φ = ${p - 1}·${q - 1} = ${k.phi}`),
        L('s7.rsaD', {}, `d = ${e}⁻¹ mod ${k.phi}`), ...invLines(e, k.phi)],
    };
  }
  let m;
  do m = int(2, k.n - 1, rnd); while (gcd(m, k.n) !== 1 || modPow(m, 2, k.n).value === 1);   // tránh m² ≡ 1: ví dụ tầm thường
  const c = modPow(m, e, k.n).value;
  return {
    kind: 'rsa', format: 'number', review: 'rsaEnc', textKey: 'c7q.qRsaEnc', textParams: { n: k.n, e, m }, answer: c,
    hintKey: 'c7q.hRsaEnc', meta: { n: k.n, e, m, ask: 'c' }, formatKey: 'c7q.f_rsaEnc',
    work: [L('s7.rsaEnc', {}, `c = ${m}${sup(e)} mod ${k.n}`), ...powLines(m, e, k.n)],
  };
}

const MAKERS = { mod: makeMod, inverse: makeInverse, power: makePower, phi: makePhi, rsa: makeRsa };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c7q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  const g = String(given).trim();
  if (q.kind === 'inverse' && NONE.test(g)) return { ok: q.answer === 'none' };
  const n = parseNumber(g);
  if (n === null) return { retry: true, detailKey: q.kind === 'inverse' ? 'c7q.needInv' : 'run.needNumber' };
  if (q.kind === 'inverse' && q.answer !== 'none') {
    const { a, n: m } = q.meta;
    return mod(a * n, m) === 1 ? { ok: true } : { ok: false, detailKey: 'c7q.dInverse', detailParams: { a, x: n, m, r: mod(a * n, m) } };
  }
  return { ok: n === q.answer };
}

