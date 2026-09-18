import { impCovers } from '../../src/logic/quine-mccluskey.js';

/**
 * Đánh giá kết quả minimizeSOP ở mức implicant (không qua parser biểu thức):
 * F(m) = 1 ⇔ có ít nhất một term phủ m.
 */
export function evalSOP(S, n) {
  const out = new Array(1 << n);
  for (let m = 0; m < (1 << n); m++) out[m] = S.terms.some(t => impCovers(t.imp, m)) ? 1 : 0;
  return out;
}

/**
 * Đánh giá kết quả minimizePOS: các term là implicant của F',
 * nên F(m) = 0 ⇔ có term phủ m.
 */
export function evalPOS(P, n) {
  const out = new Array(1 << n);
  for (let m = 0; m < (1 << n); m++) out[m] = P.terms.some(t => impCovers(t.imp, m)) ? 0 : 1;
  return out;
}

/** Hàm ngẫu nhiên có ~12% don't care, giống bản gốc. */
export function randomFunction(n, rnd = Math.random) {
  const size = 1 << n;
  const values = new Array(size);
  for (let m = 0; m < size; m++) {
    const r = rnd();
    values[m] = r < 0.12 ? 2 : (r < 0.56 ? 1 : 0);
  }
  return values;
}

/** Bộ sinh số giả ngẫu nhiên có seed, để test tái lập được khi fail. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
