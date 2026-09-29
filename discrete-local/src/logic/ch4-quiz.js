/* ---------------------------------------------------------------
   SINH & CHẤM ĐỀ D4 — Quy nạp (MCS 5.1; Rosen 5.1). Thuần.
   - sum:     giá trị một tổng quen thuộc tại n cụ thể (dùng công thức đóng đã chứng minh bằng quy nạp).
   - formula: công thức đóng nào đúng với MỌI n ≥ 1 — nhiễu là công thức khớp vài n đầu rồi lệch
              (bẫy "thử vài giá trị là đủ"); máy kiểm n = 1 … 12.
   - step:    trong bước quy nạp P(k) ⇒ P(k+1), phải chứng minh đẳng thức nào.
   --------------------------------------------------------------- */

import { fail } from '@shared/logic/app-error.js';
import { pick, int, shuffle } from '@shared/logic/shuffle.js';
import { parseNumber } from '@shared/logic/answer-format.js';
import { line as L } from '@shared/logic/steps.js';

export const KINDS = ['sum', 'formula', 'step'];
export const SECONDS = { sum: 45, formula: 60, step: 60 };

/* Tổng quen thuộc: term(i) để máy kiểm; chữ công thức viết sẵn tại n, k, k + 1, k + 2 (thay chuỗi dễ ra (k + 1)((k + 1) + 1)). */
const SUMS = [
  { s: '1 + 2 + … + n', sk: '1 + 2 + … + k', term: i => i, f: n => (n * (n + 1)) / 2,
    c: ['n(n + 1)/2', 'k(k + 1)/2', '(k + 1)(k + 2)/2', '(k + 2)(k + 3)/2'], t: ['k', 'k + 1'] },
  { s: '1 + 3 + 5 + … + (2n − 1)', sk: '1 + 3 + … + (2k − 1)', term: i => 2 * i - 1, f: n => n * n,
    c: ['n²', 'k²', '(k + 1)²', '(k + 2)²'], t: ['(2k − 1)', '(2k + 1)'] },
  { s: '1² + 2² + … + n²', sk: '1² + 2² + … + k²', term: i => i * i, f: n => (n * (n + 1) * (2 * n + 1)) / 6,
    c: ['n(n + 1)(2n + 1)/6', 'k(k + 1)(2k + 1)/6', '(k + 1)(k + 2)(2k + 3)/6', '(k + 2)(k + 3)(2k + 5)/6'], t: ['k²', '(k + 1)²'] },
  { s: '1 + 2 + 4 + … + 2ⁿ⁻¹', sk: '1 + 2 + … + 2ᵏ⁻¹', term: i => 2 ** (i - 1), f: n => 2 ** n - 1,
    c: ['2ⁿ − 1', '2ᵏ − 1', '2ᵏ⁺¹ − 1', '2ᵏ⁺² − 1'], t: ['2ᵏ⁻¹', '2ᵏ'] },
  { s: '1·2 + 2·3 + … + n(n + 1)', sk: '1·2 + … + k(k + 1)', term: i => i * (i + 1), f: n => (n * (n + 1) * (n + 2)) / 3,
    c: ['n(n + 1)(n + 2)/3', 'k(k + 1)(k + 2)/3', '(k + 1)(k + 2)(k + 3)/3', '(k + 2)(k + 3)(k + 4)/3'], t: ['k(k + 1)', '(k + 1)(k + 2)'] },
  { s: '1³ + 2³ + … + n³', sk: '1³ + 2³ + … + k³', term: i => i ** 3, f: n => ((n * (n + 1)) / 2) ** 2,
    c: ['(n(n + 1)/2)²', '(k(k + 1)/2)²', '((k + 1)(k + 2)/2)²', '((k + 2)(k + 3)/2)²'], t: ['k³', '(k + 1)³'] },
  { s: '2 + 4 + 6 + … + 2n', sk: '2 + 4 + … + 2k', term: i => 2 * i, f: n => n * (n + 1),
    c: ['n(n + 1)', 'k(k + 1)', '(k + 1)(k + 2)', '(k + 2)(k + 3)'], t: ['2k', '2(k + 1)'] },
  { s: '1 + 3 + 9 + … + 3ⁿ⁻¹', sk: '1 + 3 + … + 3ᵏ⁻¹', term: i => 3 ** (i - 1), f: n => (3 ** n - 1) / 2,
    c: ['(3ⁿ − 1)/2', '(3ᵏ − 1)/2', '(3ᵏ⁺¹ − 1)/2', '(3ᵏ⁺² − 1)/2'], t: ['3ᵏ⁻¹', '3ᵏ'] },
  { s: '3 + 7 + 11 + … + (4n − 1)', sk: '3 + 7 + … + (4k − 1)', term: i => 4 * i - 1, f: n => n * (2 * n + 1),
    c: ['n(2n + 1)', 'k(2k + 1)', '(k + 1)(2k + 3)', '(k + 2)(2k + 5)'], t: ['(4k − 1)', '(4k + 3)'] },
  { s: '1 + 4 + 7 + … + (3n − 2)', sk: '1 + 4 + … + (3k − 2)', term: i => 3 * i - 2, f: n => (n * (3 * n - 1)) / 2,
    c: ['n(3n − 1)/2', 'k(3k − 1)/2', '(k + 1)(3k + 2)/2', '(k + 2)(3k + 5)/2'], t: ['(3k − 2)', '(3k + 1)'] },
  { s: '1·2 + 2·2² + … + n·2ⁿ', sk: '1·2 + … + k·2ᵏ', term: i => i * 2 ** i, f: n => (n - 1) * 2 ** (n + 1) + 2,
    c: ['(n − 1)2ⁿ⁺¹ + 2', '(k − 1)2ᵏ⁺¹ + 2', 'k·2ᵏ⁺² + 2', '(k + 1)2ᵏ⁺³ + 2'], t: ['k·2ᵏ', '(k + 1)2ᵏ⁺¹'] },
];
/* Công thức "gần đúng" làm nhiễu: đều là đa thức/lũy thừa đơn giản */
const FORMS = [
  { s: 'n²', f: n => n * n }, { s: 'n(n + 1)/2', f: n => (n * (n + 1)) / 2 }, { s: '2ⁿ − 1', f: n => 2 ** n - 1 },
  { s: 'n(n + 1)(2n + 1)/6', f: n => (n * (n + 1) * (2 * n + 1)) / 6 }, { s: '(n(n + 1)/2)²', f: n => ((n * (n + 1)) / 2) ** 2 },
  { s: 'n(n + 1)(n + 2)/3', f: n => (n * (n + 1) * (n + 2)) / 3 }, { s: '2n − 1', f: n => 2 * n - 1 }, { s: 'n² + n − 1', f: n => n * n + n - 1 },
  { s: '2ⁿ', f: n => 2 ** n }, { s: 'n³', f: n => n ** 3 }, { s: '(n + 1)² − 1', f: n => (n + 1) ** 2 - 1 }, { s: 'n(n − 1) + 1', f: n => n * (n - 1) + 1 },
  { s: 'n(n + 1)', f: n => n * (n + 1) }, { s: '(3ⁿ − 1)/2', f: n => (3 ** n - 1) / 2 }, { s: 'n(2n + 1)', f: n => n * (2 * n + 1) },
  { s: 'n(3n − 1)/2', f: n => (n * (3 * n - 1)) / 2 }, { s: '(n − 1)2ⁿ⁺¹ + 2', f: n => (n - 1) * 2 ** (n + 1) + 2 },
  { s: '3ⁿ − 2', f: n => 3 ** n - 2 }, { s: 'n² + 1', f: n => n * n + 1 }, { s: 'n·2ⁿ', f: n => n * 2 ** n },
];
const sumTo = (S, n) => Array.from({ length: n }, (_, i) => S.term(i + 1)).reduce((a, b) => a + b, 0);
const firstTerms = (S, k = 4) => Array.from({ length: k }, (_, i) => sumTo(S, i + 1)).join(', ');

function makeSum(rnd) {
  const S = pick(SUMS, rnd), n = int(8, 30, rnd);
  return {
    kind: 'sum', format: 'number', textKey: 'c4q.qSum', textParams: { s: S.s, n }, answer: S.f(n), hintKey: 'c4q.hSum',
    meta: { s: S.s, n }, work: [L('s4.closed', {}, `${S.s} = ${S.c[0]}`), L('s4.plug', { n }, String(S.f(n)))],
  };
}

function makeFormula(rnd) {
  const S = pick(SUMS, rnd);
  const agrees = F => [...Array(12).keys()].every(i => F.f(i + 1) === sumTo(S, i + 1));
  const right = FORMS.find(agrees);
  // nhiễu ưu tiên công thức khớp n = 1 (bẫy thử một giá trị) nhưng lệch sau đó
  const wrong = shuffle(FORMS.filter(F => !agrees(F)), rnd).sort((a, b) => (b.f(1) === sumTo(S, 1)) - (a.f(1) === sumTo(S, 1))).slice(0, 3);
  const choices = shuffle([right, ...wrong], rnd);
  const bad = F => [...Array(12).keys()].map(i => i + 1).find(n => F.f(n) !== sumTo(S, n));
  return {
    kind: 'formula', format: 'choice', mcq: true, textKey: 'c4q.qFormula', textParams: { s: S.s },
    choices: choices.map(F => F.s), answer: choices.indexOf(right), hintKey: 'c4q.hFormula', meta: { s: S.s },
    work: [L('s4.values', {}, firstTerms(S, 5)), ...wrong.map(F => L('s4.fails', { f: F.s, n: bad(F) })), L('s4.needProof', { f: right.s })],
  };
}

/** Bước quy nạp: giả sử đúng tại k, cần chứng minh "(công thức tại k) + số hạng thứ k+1 = công thức tại k+1". */
function makeStep(rnd) {
  const S = pick(SUMS, rnd);
  const [, ck, ck1, ck2] = S.c;
  const right = `${ck} + ${S.t[1]} = ${ck1}`;
  const opts = [
    right,
    `${ck} = ${ck1}`,                          // quên cộng số hạng mới
    `${ck} + ${S.t[0]} = ${ck1}`,              // cộng nhầm số hạng thứ k
    `${ck1} + ${S.t[1]} = ${ck2}`,             // dùng giả thiết ở sai chỗ
  ];
  const choices = shuffle(opts, rnd);
  return {
    kind: 'step', format: 'choice', mcq: true, textKey: 'c4q.qStep', textParams: { s: S.s, closed: S.c[0] },
    choices, answer: choices.indexOf(right), hintKey: 'c4q.hStep', meta: { s: S.s },
    work: [L('s4.ih', {}, `${S.sk} = ${ck}`), L('s4.addNext', { t: S.t[1] }), L('s1.result', {}, right)],
  };
}

const MAKERS = { sum: makeSum, formula: makeFormula, step: makeStep };

export function makeQuestion(kind = 'mix', rnd = Math.random) {
  const k = kind === 'mix' ? pick(KINDS, rnd) : kind;
  if (!MAKERS[k]) fail('err.badQuizKind', { kind });
  const q = MAKERS[k](rnd);
  q.formatKey ??= `c4q.f_${k}`;
  return q;
}

export function checkAnswer(q, given) {
  if (q.format === 'choice') return { ok: Number(given) === q.answer };
  const n = parseNumber(given);
  if (n === null) return { retry: true, detailKey: 'run.needNumber' };
  return { ok: n === q.answer };
}
