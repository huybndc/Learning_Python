import {
  popcount, impContains, implicantToSOP,
} from './quine-mccluskey.js';
/* ---------------------------------------------------------------
   7. HỖ TRỢ CHẾ ĐỘ LUYỆN TẬP
   --------------------------------------------------------------- */

/** Từ một tập ô, suy ra implicant nhỏ nhất chứa nó (bit nào khác nhau thì thành "-"). */
export function cellsToImplicant(cells, n) {
  const m0 = cells[0];
  let d = 0;
  for (const m of cells) d |= (m ^ m0);
  return { v: m0 & ~d, d };
}

/**
 * Kiểm tra một nhóm người học khoanh.
 * Trả về {ok, size, imp, errors:[], notes:[]}
 */
export function checkGroup(cells, values, n, allPIs) {
  const errors = [], notes = [];
  const uniq = [...new Set(cells)].sort((a, b) => a - b);
  const imp = cellsToImplicant(uniq, n);
  const size = uniq.length;

  if (size === 0) { errors.push('nhóm rỗng'); return { ok: false, size, imp, errors, notes }; }
  if ((size & (size - 1)) !== 0) errors.push('kích thước ' + size + ' không phải luỹ thừa của 2');
  // hình chữ nhật trên mặt torus ⇔ tập ô đúng bằng implicant sinh ra nó
  const spanned = 1 << popcount(imp.d);
  if (spanned !== size) errors.push('không phải hình chữ nhật trên mặt torus (nhóm nhỏ nhất bao nó có ' + spanned + ' ô)');
  const zeros = uniq.filter(m => values[m] === 0);
  if (zeros.length) errors.push('chứa ô giá trị 0: ' + zeros.join(', '));

  if (errors.length === 0) {
    // đã hợp lệ → nhóm đã lớn nhất chưa?
    const bigger = allPIs.filter(p => impContains(p, imp) && p.d !== imp.d);
    if (bigger.length) {
      notes.push('chưa phải nhóm lớn nhất — có thể mở rộng thành ' + bigger.map(p => implicantToSOP(p, n)).join(' hoặc '));
    }
    if (uniq.every(m => values[m] === 2)) notes.push('nhóm này chỉ toàn don\'t care — không cần thiết');
  }
  return { ok: errors.length === 0, size, imp, errors, notes };
}
