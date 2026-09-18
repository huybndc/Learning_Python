import { varNames, implicantMinterms, implicantToSOP, implicantToPOS } from './quine-mccluskey.js';

/** Giải thích vì sao một nhóm cho ra term đó. */
export function explainTerm(imp, n, pos) {
  const names = varNames(n);
  const keep = [], drop = [];
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;
    if ((imp.d >> bit) & 1) drop.push(names[k]);
    else keep.push(names[k] + ' = ' + ((imp.v >> bit) & 1));
  }
  const cells = implicantMinterms(imp, n);
  let s = 'Nhóm ' + cells.length + ' ô {' + cells.join(', ') + '}: ';
  s += keep.length ? 'giữ nguyên ' + keep.join(', ') : 'mọi biến đều đổi giá trị';
  s += drop.length ? ' · ' + drop.join(', ') + ' đổi giá trị nên bị loại' : '';
  s += ' ⇒ ' + (pos ? implicantToPOS(imp, n) : implicantToSOP(imp, n));
  return s;
}

