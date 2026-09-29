/* ---------------------------------------------------------------
   KIỂM PHÉP TÍNH TRONG CÂU KHÁI NIỆM DISCRETE — thuần, chạy lại bằng chính bộ giải của app.
     prop     { a, b, rel }           rel: equiv | implies (a ⇒ b, không ngược) | implied | neither
     classify { expr, kind }          tautology | contradiction | contingent
     inverse  { a, n, inv }           a⁻¹ mod n (null = không có)
     power    { a, k, n, value }      aᵏ mod n
     gcd      { a, b, gcd, s?, t? }   gcd và (nếu có) s·a + t·b = gcd
     phi      { n, value }
     graph    { edges, bipartite?, euler?, components? }   edges kiểu "ab, bc"; euler: circuit | path | none
     degseq   { seq, ok }             Havel–Hakimi
   --------------------------------------------------------------- */

import { parseProp, classify, truthColumn, varsOf } from './prop-logic.js';
import { gcd, modInverse, modPow, phi } from './number-theory.js';
import { parseEdges, twoColor, eulerKind, components, havelHakimi } from './graph.js';

const fail = reason => ({ ok: false, reason });
const expect = (got, want, label) => (got === want ? { ok: true } : fail(`${label} = ${got}`));

/** a ⇒ b ⇔ không dòng nào a đúng mà b sai (trên hợp các biến). */
function relation(a, b) {
  const vars = [...new Set([...varsOf(a), ...varsOf(b)])].sort();
  const [ca, cb] = [truthColumn(a, vars), truthColumn(b, vars)];
  const ab = ![...ca].some((x, i) => x === '1' && cb[i] === '0');
  const ba = ![...cb].some((x, i) => x === '1' && ca[i] === '0');
  return ab && ba ? 'equiv' : ab ? 'implies' : ba ? 'implied' : 'neither';
}

const CHECKS = {
  prop: ({ a, b, rel }) => expect(relation(parseProp(a), parseProp(b)), rel, 'rel'),
  classify: ({ expr, kind }) => expect(classify(parseProp(expr)), kind, expr),
  inverse: ({ a, n, inv }) => expect(modInverse(a, n), inv, `${a}⁻¹ mod ${n}`),
  power: ({ a, k, n, value }) => expect(modPow(a, k, n).value, value, `${a}^${k} mod ${n}`),
  gcd({ a, b, gcd: g, s, t }) {
    if (gcd(a, b) !== g) return fail(`gcd = ${gcd(a, b)}`);
    return s === undefined || s * a + t * b === g ? { ok: true } : fail(`${s}·${a} + ${t}·${b} ≠ ${g}`);
  },
  phi: ({ n, value }) => expect(phi(n), value, `φ(${n})`),
  graph({ edges, bipartite, euler, components: k }) {
    const g = parseEdges(edges);
    const got = { bipartite: twoColor(g).ok, euler: eulerKind(g).kind, components: components(g).length };
    const bad = Object.entries({ bipartite, euler, components: k }).filter(([key, v]) => v !== undefined && got[key] !== v);
    return bad.length ? fail(bad.map(([key]) => `${key} = ${got[key]}`).join(', ')) : { ok: true };
  },
  degseq: ({ seq, ok }) => expect(havelHakimi(seq).ok, ok, 'graphic'),
};

/** @returns {{ ok: boolean, reason?: string }} */
export function verifyCheck(check) {
  const fn = CHECKS[check?.type];
  if (!fn) return fail(`unknown check type: ${check?.type}`);
  try { return fn(check); } catch (e) { return fail(`cannot run: ${e.key ?? e.message}`); }
}

export const CHECK_TYPES = Object.keys(CHECKS);
