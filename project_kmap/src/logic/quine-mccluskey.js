/* ---------------------------------------------------------------
   2. IMPLICANT & QUINE–McCLUSKEY
   Implicant biểu diễn bằng {v, d}:
     d = mask các bit "-" (biến bị loại),  v = giá trị các bit còn lại
   Minterm m thuộc implicant  <=>  (m & ~d) === v
   --------------------------------------------------------------- */

export const VAR_NAMES = ['v', 'w', 'x', 'y', 'z'];

/**
 * Tên biến cho hàm n biến, theo quy ước Digital Design (Mano):
 *   n=2 → x,y   n=3 → x,y,z   n=4 → w,x,y,z   n=5 → v,w,x,y,z
 * Tức là lấy n ký tự CUỐI của VAR_NAMES, riêng n=2 dùng x,y (không phải y,z).
 * Biến đầu danh sách là MSB.
 */
export function varNames(n) {
  if (n === 2) return ['x', 'y'];
  return VAR_NAMES.slice(VAR_NAMES.length - n);
}

export function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

/** Số literal của một implicant = số biến chưa bị loại. */
export function literalCount(imp, n) { return n - popcount(imp.d); }

/** Liệt kê mọi minterm nằm trong implicant. */
export function implicantMinterms(imp, n) {
  const free = [];
  for (let i = 0; i < n; i++) if ((imp.d >> i) & 1) free.push(i);
  const out = [];
  for (let s = 0; s < (1 << free.length); s++) {
    let m = imp.v;
    for (let j = 0; j < free.length; j++) if ((s >> j) & 1) m |= (1 << free[j]);
    out.push(m);
  }
  return out.sort((a, b) => a - b);
}

export function impCovers(imp, m) { return (m & ~imp.d) === imp.v; }
export function impKey(imp) { return imp.v + '/' + imp.d; }

/** imp A có chứa trọn imp B không (B ⊆ A)? */
export function impContains(a, b) {
  // A chứa B khi: (1) mọi biến A đã loại thì B cũng loại được -> b.d ⊆ a.d,
  //               (2) trên các biến A giữ lại, B mang đúng giá trị đó.
  return ((a.d & b.d) === b.d) && ((b.v & ~a.d) === a.v);
}

/**
 * Quine–McCluskey: tìm TẤT CẢ prime implicant.
 * ones + dontcares đều được dùng để mở rộng nhóm.
 */
export function primeImplicants(ones, dontcares, n) {
  const seedSet = new Set([...ones, ...dontcares]);
  if (seedSet.size === 0) return [];
  let current = [...seedSet].map(m => ({ v: m, d: 0 }));
  const primes = new Map();

  while (current.length) {
    const used = new Array(current.length).fill(false);
    const nextMap = new Map();
    // nhóm theo mask "-" để chỉ ghép các term cùng dạng
    const byDash = new Map();
    current.forEach((t, i) => {
      if (!byDash.has(t.d)) byDash.set(t.d, []);
      byDash.get(t.d).push(i);
    });
    for (const idxs of byDash.values()) {
      for (let a = 0; a < idxs.length; a++) {
        for (let b = a + 1; b < idxs.length; b++) {
          const ta = current[idxs[a]], tb = current[idxs[b]];
          const x = ta.v ^ tb.v;
          if (x && (x & (x - 1)) === 0) {           // khác đúng 1 bit → ghép được
            used[idxs[a]] = used[idxs[b]] = true;
            const nt = { v: ta.v & tb.v, d: ta.d | x };
            nextMap.set(impKey(nt), nt);
          }
        }
      }
    }
    current.forEach((t, i) => { if (!used[i]) primes.set(impKey(t), t); });
    current = [...nextMap.values()];
  }
  return [...primes.values()].sort((a, b) => (a.v - b.v) || (a.d - b.d));
}

/**
 * Chọn phủ tối thiểu: essential PI trước, phần còn lại dùng branch & bound
 * (nhánh theo minterm khó nhất — ít PI phủ nhất). Tiêu chí: ít term nhất,
 * hoà thì ít literal nhất. Don't care KHÔNG bắt buộc phải phủ.
 */
export function minimalCover(pis, ones, n) {
  if (ones.length === 0) return { cover: [], essential: [] };

  // bảng: minterm -> các PI phủ nó
  const covering = new Map();
  for (const m of ones) {
    const list = [];
    pis.forEach((p, i) => { if (impCovers(p, m)) list.push(i); });
    covering.set(m, list);
  }

  // essential PI: minterm chỉ được phủ bởi đúng 1 PI
  const essIdx = new Set();
  for (const [, list] of covering) if (list.length === 1) essIdx.add(list[0]);

  const covered = new Set();
  for (const i of essIdx) for (const m of implicantMinterms(pis[i], n)) covered.add(m);
  const remaining = ones.filter(m => !covered.has(m));

  const candidates = pis.map((_, i) => i).filter(i => !essIdx.has(i));
  const essArr = [...essIdx];
  const cost = idxs => idxs.reduce((s, i) => s + literalCount(pis[i], n), 0);

  let best = null, bestTerms = Infinity, bestLits = Infinity;

  function branch(rem, chosen) {
    if (rem.length === 0) {
      const t = chosen.length, l = cost(chosen);
      if (t < bestTerms || (t === bestTerms && l < bestLits)) {
        best = chosen.slice(); bestTerms = t; bestLits = l;
      }
      return;
    }
    // cắt nhánh: đã dùng nhiều term hơn lời giải tốt nhất
    if (chosen.length + 1 > bestTerms) return;
    // chọn minterm còn lại có ít PI phủ nhất để nhánh hẹp
    let target = rem[0], bestLen = Infinity;
    for (const m of rem) {
      const k = candidates.filter(i => impCovers(pis[i], m)).length;
      if (k < bestLen) { bestLen = k; target = m; }
    }
    for (const i of candidates) {
      if (chosen.includes(i) || !impCovers(pis[i], target)) continue;
      const nrem = rem.filter(m => !impCovers(pis[i], m));
      branch(nrem, chosen.concat(i));
    }
  }
  branch(remaining, []);

  const extra = best || [];
  return { cover: essArr.concat(extra).sort((a, b) => a - b), essential: essArr };
}

/** Chuỗi literal của implicant dạng SOP: A B' C ... ("1" nếu rỗng). */
export function implicantToSOP(imp, n) {
  const names = varNames(n);
  let s = '';
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;                       // biến thứ k ứng với bit n-1-k
    if ((imp.d >> bit) & 1) continue;
    s += names[k] + (((imp.v >> bit) & 1) ? '' : "'");
  }
  return s === '' ? '1' : s;
}

/** Từ implicant của F' sinh maxterm dạng POS: (A' + B + ...) — De Morgan. */
export function implicantToPOS(imp, n) {
  const names = varNames(n);
  const lits = [];
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;
    if ((imp.d >> bit) & 1) continue;
    lits.push(names[k] + (((imp.v >> bit) & 1) ? "'" : ''));  // đảo dấu so với SOP
  }
  return lits.length === 0 ? '0' : '(' + lits.join(' + ') + ')';
}

/* ---------------------------------------------------------------
   3. RÚT GỌN HÀM
   values: mảng độ dài 2^n, phần tử 0 | 1 | 2 (2 = don't care)
   --------------------------------------------------------------- */

export function splitValues(values) {
  const ones = [], zeros = [], dcs = [];
  values.forEach((v, m) => { (v === 1 ? ones : v === 0 ? zeros : dcs).push(m); });
  return { ones, zeros, dcs };
}

/** Rút gọn SOP (phủ các ô 1). */
export function minimizeSOP(values, n) {
  const { ones, dcs } = splitValues(values);
  const pis = primeImplicants(ones, dcs, n);
  const { cover, essential } = minimalCover(pis, ones, n);
  const terms = cover.map(i => ({ idx: i, imp: pis[i], essential: essential.includes(i), text: implicantToSOP(pis[i], n) }));
  const expr = ones.length === 0 ? '0'
    : (terms.length === 1 && terms[0].text === '1') ? '1'
      : terms.map(t => t.text).join(' + ');
  return { pis, cover, essential, terms, expr, ones, dcs };
}

/** Rút gọn POS: rút gọn F' (phủ các ô 0) rồi lấy bù bằng De Morgan. */
export function minimizePOS(values, n) {
  const { zeros, dcs } = splitValues(values);
  const pis = primeImplicants(zeros, dcs, n);
  const { cover, essential } = minimalCover(pis, zeros, n);
  const terms = cover.map(i => ({ idx: i, imp: pis[i], essential: essential.includes(i), text: implicantToPOS(pis[i], n) }));
  const expr = zeros.length === 0 ? '1'
    : (terms.length === 1 && terms[0].text === '0') ? '0'
      : terms.map(t => t.text).join('');
  return { pis, cover, essential, terms, expr, zeros, dcs };
}

/** Tổng số literal của một danh sách term (dùng để so "độ tối giản"). */
export function totalLiterals(terms, n) {
  return terms.reduce((s, t) => s + literalCount(t.imp, n), 0);
}
