/* ---------------------------------------------------------------
   GIẢI THÍCH RÚT GỌN K-MAP THEO TỪNG BƯỚC
   Hàm thuần: trả về danh sách bước, mỗi bước là MỘT dòng công thức
   `F = …` cộng một câu lý do (dạng khoá i18n + tham số), không phải
   đoạn văn HTML. UI chỉ việc in ra.

   step = { key, formula, reasonKey, reasonParams, imps, essential }
     formula        chuỗi vế phải của F, đã là biểu thức Boolean
     imps           các implicant cần tô trên K-map ở bước này
     essential      tập chỉ số (trong imps) là essential, để vẽ viền đậm
   --------------------------------------------------------------- */

import {
  minimizeSOP, splitValues, impCovers, implicantMinterms, implicantToSOP,
} from './quine-mccluskey.js';

/** Vế phải của F khi cover gồm các implicant đã cho. */
function joinTerms(imps, n) {
  if (imps.length === 0) return '0';
  const parts = imps.map(p => implicantToSOP(p, n));
  return parts.length === 1 && parts[0] === '1' ? '1' : parts.join(' + ');
}

export function buildExplain(values, n) {
  const S = minimizeSOP(values, n);
  const { ones, dcs } = splitValues(values);
  const steps = [];

  /* Bước 0 — đề bài, viết luôn ở dạng Σm */
  steps.push({
    key: 'step.read',
    formula: ones.length
      ? 'Σm(' + ones.join(',') + ')' + (dcs.length ? ' + d(' + dcs.join(',') + ')' : '')
      : '0',
    reasonKey: ones.length
      ? (dcs.length ? 'step.readWithDc' : 'step.readNoDc')
      : 'step.allZero',
    reasonParams: { ones: ones.length, dcs: dcs.length },
    imps: [],
    essential: [],
  });
  if (ones.length === 0) return { steps, result: S };

  /* Bước 1 — tất cả prime implicant, viết thành một tổng */
  steps.push({
    key: 'step.primes',
    formula: joinTerms(S.pis, n),
    reasonKey: 'step.primesWhy',
    reasonParams: { count: S.pis.length },
    imps: S.pis.slice(),
    essential: [],
  });

  /* Bước 2 — essential: mỗi PI kèm ô "chỉ nó phủ" */
  const essImps = S.essential.map(i => S.pis[i]);
  const witness = [];
  for (const m of ones) {
    const cov = S.pis.map((_, i) => i).filter(i => impCovers(S.pis[i], m));
    if (cov.length === 1) witness.push({ m, term: implicantToSOP(S.pis[cov[0]], n) });
  }
  steps.push({
    key: 'step.essential',
    formula: essImps.length ? joinTerms(essImps, n) + (essImps.length < S.terms.length ? ' + …' : '') : '—',
    reasonKey: essImps.length ? 'step.essentialWhy' : 'step.noEssential',
    reasonParams: {
      count: essImps.length,
      cells: witness.slice(0, 3).map(w => w.m).join(', '),
      more: witness.length > 3 ? witness.length - 3 : 0,
    },
    imps: essImps,
    essential: essImps.map((_, i) => i),
  });

  /* Bước 3+ — bổ sung từng PI còn thiếu, công thức dài dần ra */
  const extras = S.cover.filter(i => !S.essential.includes(i));
  const covered = new Set();
  essImps.forEach(p => implicantMinterms(p, n).forEach(m => covered.add(m)));
  let remaining = ones.filter(m => !covered.has(m));
  let acc = essImps.slice();

  if (extras.length === 0) {
    steps.push({
      key: 'step.cover',
      formula: joinTerms(acc, n),
      reasonKey: 'step.coverDone',
      reasonParams: {},
      imps: acc.slice(),
      essential: acc.map((_, i) => i),
    });
  } else {
    extras.forEach(pi => {
      const before = remaining.slice();
      acc = acc.concat(S.pis[pi]);
      remaining = remaining.filter(m => !impCovers(S.pis[pi], m));
      steps.push({
        key: 'step.cover',
        formula: joinTerms(acc, n),
        reasonKey: remaining.length ? 'step.coverPick' : 'step.coverLast',
        reasonParams: {
          missing: before.join(', '),
          term: implicantToSOP(S.pis[pi], n),
          left: remaining.join(', '),
        },
        imps: acc.slice(),
        essential: essImps.map((_, i) => i),
      });
    });
  }

  /* Bước cuối — kết quả, kèm biến nào bị triệt tiêu */
  steps.push({
    key: 'step.result',
    formula: S.expr,
    reasonKey: 'step.resultWhy',
    reasonParams: { terms: S.terms.length },
    imps: S.terms.map(t => t.imp),
    essential: S.terms.map((t, i) => (t.essential ? i : -1)).filter(i => i >= 0),
    detail: S.terms.map(t => ({
      term: t.text,
      cells: implicantMinterms(t.imp, n),
      keep: keepVars(t.imp, n),
      drop: dropVars(t.imp, n),
    })),
  });

  return { steps, result: S };
}

/** Biến giữ lại trong một implicant, kèm giá trị. */
export function keepVars(imp, n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;
    if (!((imp.d >> bit) & 1)) out.push({ k, value: (imp.v >> bit) & 1 });
  }
  return out;
}

/** Biến bị triệt tiêu (đổi giá trị trong nhóm). */
export function dropVars(imp, n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;
    if ((imp.d >> bit) & 1) out.push(k);
  }
  return out;
}
