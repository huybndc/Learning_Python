import { implicantMinterms } from './quine-mccluskey.js';

/** Sinh hàm ngẫu nhiên "đẹp": gieo vài nhóm rồi thêm nhiễu. */
export function randomValues(n, withDC) {
  const size = 1 << n;
  const values = new Array(size).fill(0);
  const seeds = 1 + Math.floor(Math.random() * 3);
  for (let k = 0; k < seeds; k++) {
    const d = Math.floor(Math.random() * (n));                 // số biến bị loại
    let dash = 0;
    const bits = [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, d);
    bits.forEach(b => dash |= 1 << b);
    const v = Math.floor(Math.random() * size) & ~dash;
    implicantMinterms({ v, d: dash }, n).forEach(m => values[m] = 1);
  }
  for (let m = 0; m < size; m++) if (Math.random() < 0.12) values[m] = values[m] ? 0 : 1;
  if (withDC) for (let m = 0; m < size; m++) if (Math.random() < 0.13) values[m] = 2;
  if (values.every(v => v !== 1)) values[Math.floor(Math.random() * size)] = 1;   // tránh hàm rỗng
  return values;
}
