/* ---------------------------------------------------------------
   SỐ HỌC (MCS 9; Rosen 4) — thuần. Mỗi hàm trả kèm CÁC BƯỚC để lời giải
   và công cụ in lại được (bảng Euclid, Pulverizer, bình phương-và-nhân).
   Chỉ số nguyên an toàn của JS (đủ cho bài trên giấy, không dùng BigInt).
   --------------------------------------------------------------- */

import { fail } from '@shared/logic/app-error.js';

const assertInt = (...xs) => xs.forEach(x => { if (!Number.isSafeInteger(x)) fail('err.needInt'); });

/** a mod n luôn trong 0 … n−1 (kể cả a âm — khác toán tử % của JS). */
export function mod(a, n) {
  assertInt(a, n);
  if (n <= 0) fail('err.modPositive');
  return ((a % n) + n) % n;
}

/** Euclid: [{ a, b, q, r }] với a = q·b + r, tới khi r = 0; gcd = b của dòng cuối. */
export function euclid(a, b) {
  assertInt(a, b);
  let x = Math.abs(a), y = Math.abs(b);
  const steps = [];
  while (y !== 0) {
    const q = Math.floor(x / y), r = x % y;
    steps.push({ a: x, b: y, q, r });
    x = y; y = r;
  }
  return { gcd: x, steps };
}

export const gcd = (a, b) => euclid(a, b).gcd;
export const lcm = (a, b) => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b));

/**
 * Pulverizer (Euclid mở rộng): gcd = s·a + t·b. Bảng từng dòng giữ bất biến
 * r = s·a + t·b — đúng cách MCS 9.2.2 trình bày.
 * @returns {{ gcd, s, t, rows: {r, s, t, q}[] }}
 */
export function pulverize(a, b) {
  assertInt(a, b);
  const rows = [{ r: a, s: 1, t: 0, q: null }, { r: b, s: 0, t: 1, q: null }];
  while (rows.at(-1).r !== 0) {
    const [p, c] = rows.slice(-2);
    const q = Math.floor(p.r / c.r);
    rows.push({ r: p.r - q * c.r, s: p.s - q * c.s, t: p.t - q * c.t, q });
  }
  const g = rows.at(-2);
  return { gcd: g.r, s: g.s, t: g.t, rows };
}

/** Nghịch đảo của a mod n (0 … n−1) hoặc null khi gcd(a, n) ≠ 1. */
export function modInverse(a, n) {
  const p = pulverize(mod(a, n), n);
  return p.gcd === 1 ? mod(p.s, n) : null;
}

/**
 * aᵏ mod n bằng bình phương liên tiếp: bảng a^(2^i) mod n, rồi nhân các ô ứng với bit 1 của k.
 * @returns {{ value, bits: string, squares: {i, v}[], used: number[] }}
 */
export function modPow(a, k, n) {
  assertInt(a, k, n);
  if (k < 0) fail('err.needNonNeg');
  if (n <= 0) fail('err.modPositive');
  if ((n - 1) ** 2 > Number.MAX_SAFE_INTEGER) fail('err.tooBig');   // v·v phải còn chính xác
  const bits = k.toString(2);
  const squares = [];
  let v = mod(a, n);
  for (let i = 0; i < bits.length; i++) { squares.push({ i, v }); v = (v * v) % n; }
  const used = [...bits].reverse().flatMap((b, i) => (b === '1' ? [i] : []));
  const value = used.reduce((acc, i) => (acc * squares[i].v) % n, 1 % n);
  return { value, bits, squares, used };
}

/** Phân tích thừa số nguyên tố: [{ p, e }] tăng dần. */
export function factorize(n) {
  assertInt(n);
  if (n < 1) fail('err.needPositive');
  const out = [];
  let x = n;
  for (let p = 2; p * p <= x; p++) {
    let e = 0;
    while (x % p === 0) { x /= p; e++; }
    if (e) out.push({ p, e });
  }
  if (x > 1) out.push({ p: x, e: 1 });
  return out;
}

export const isPrime = n => n > 1 && factorize(n).length === 1 && factorize(n)[0].e === 1;

/** φ(n) = n · Π(1 − 1/p). */
export function phi(n) {
  return factorize(n).reduce((acc, { p, e }) => acc * (p - 1) * p ** (e - 1), 1);
}

/** Khoá RSA từ hai số nguyên tố p, q và số mũ công khai e (gcd(e, φ) phải = 1). */
export function rsaKeys(p, q, e) {
  const n = p * q, ph = (p - 1) * (q - 1);
  const d = modInverse(e, ph);
  if (d === null) fail('err.rsaE', { e, phi: ph });
  return { n, phi: ph, e, d };
}
