/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D5 — Bất biến & quy nạp mạnh (MCS 5.2–5.3, 6). Thuần.
   - jugs:   bài bình nước Die Hard — đong được đúng c lít? Bất biến: mọi lượng nước là bội của gcd(a, b).
             Đong được thì lời giải là chuỗi đổ nước NGẮN NHẤT (BFS trên trạng thái (x, y)).
   - stamps: tem a và b xu (nguyên tố cùng nhau) — trả đúng n xu được không / số lớn nhất KHÔNG trả được.
             Quy nạp mạnh: có a số liên tiếp trả được thì mọi số sau đều trả được (cộng thêm một tem a).
   --------------------------------------------------------------- */

import { gcd } from './number-theory.js';
import { fail } from '@shared/logic/app-error.js';
import { pick, int } from '@shared/logic/shuffle.js';
import { parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['jugs', 'stamps'];
export const SECONDS = { jugs: 90, stamps: 90 };

/** Chuỗi trạng thái ngắn nhất từ (0, 0) tới khi một bình có đúng c; null nếu không thể. */
export function pourPath(a, b, c) {
  const key = (x, y) => x * 100 + y;
  const prev = new Map([[key(0, 0), null]]);
  const queue = [[0, 0]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === c || y === c) {
      const path = [];
      for (let k = key(x, y); k !== null; k = prev.get(k)) path.unshift([Math.floor(k / 100), k % 100]);
      return path;
    }
    const t = Math.min(x, b - y), u = Math.min(y, a - x);
    for (const [nx, ny] of [[a, y], [x, b], [0, y], [x, 0], [x - t, y + t], [x + u, y - u]]) {
      if (!prev.has(key(nx, ny))) { prev.set(key(nx, ny), key(x, y)); queue.push([nx, ny]); }
    }
  }
  return null;
}

function makeJugs(rnd) {
  let a, b;
  do { a = int(3, 12, rnd); b = int(a + 1, 15, rnd); } while (b % a === 0);
  const g = gcd(a, b);
  const c = rnd() < 0.55 ? g * int(1, Math.floor(b / g), rnd) : int(1, b + 2, rnd);   // khoảng nửa số câu đong được
  const path = pourPath(a, b, c);
  const can = !!path;
  return {
    kind: 'jugs', format: 'choice', textKey: 'c5q.qJugs', textParams: { a, b, c },
    choices: ['c5q.can', 'c5q.cannot'], answer: can ? 0 : 1, hintKey: 'c5q.hJugs', meta: { a, b, c },
    work: [
      L('s5.invariant', { a, b, g }),
      can ? L('s5.path', { n: path.length - 1 }, path.map(([x, y]) => `(${x}, ${y})`).join(' → '))
        : L(c > b ? 's5.tooBig' : 's5.notMultiple', { c, g, b }),
    ],
  };
}

const PAIRS = [[3, 5], [3, 7], [4, 5], [4, 7], [5, 7], [3, 8], [5, 8], [4, 9], [5, 6], [7, 9]];
/** n = i·a + j·b với i, j ≥ 0 (ít tem a nhất), hoặc null. */
export function payWith(a, b, n) {
  for (let i = 0; i * a <= n; i++) if ((n - i * a) % b === 0) return [i, (n - i * a) / b];
  return null;
}

function makeStamps(rnd) {
  const [a, b] = pick(PAIRS, rnd);
  const frob = a * b - a - b;
  const bad = [...Array(frob + 1).keys()].filter(n => n > 0 && !payWith(a, b, n));
  if (rnd() < 0.5) {
    return {
      kind: 'stamps', format: 'number', review: 'largest', textKey: 'c5q.qLargest', textParams: { a, b }, answer: frob,
      hintKey: 'c5q.hStamps', meta: { a, b, ask: 'largest' }, formatKey: 'c5q.f_largest',
      work: [L('s5.cannotList', {}, bad.join(', ')), L('s5.run', { a, from: frob + 1, to: frob + a }), L('s5.strong', { a })],
    };
  }
  const n = int(frob - 3, frob + 12, rnd);
  const w = payWith(a, b, n);
  return {
    kind: 'stamps', format: 'choice', review: 'payable', textKey: 'c5q.qPay', textParams: { a, b, n },
    choices: ['c5q.can', 'c5q.cannot'], answer: w ? 0 : 1, hintKey: 'c5q.hStamps', meta: { a, b, n, ask: 'pay' },
    work: [w ? L('s5.payWith', {}, `${n} = ${w[0]}·${a} + ${w[1]}·${b}`) : L('s5.noWay', { n, a, b })],
  };
}

const MAKERS = { jugs: makeJugs, stamps: makeStamps };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c5q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.format === 'choice') return { ok: Number(given) === q.answer };
  const n = parseNumber(given);
  if (n === null) return { retry: true, detailKey: 'run.needNumber' };
  return { ok: n === q.answer };
}
