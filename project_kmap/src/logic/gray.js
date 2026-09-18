/** Đổi số nguyên v thành chuỗi nhị phân n bit (MSB ở đầu). */
export function toBits(v, n) {
  let s = '';
  for (let i = n - 1; i >= 0; i--) s += (v >> i) & 1;
  return s;
}
