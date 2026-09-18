/* ===============================================================
   GRAY CODE — hàm thuần, không đụng DOM.
   =============================================================== */

/** Đổi số nguyên v thành chuỗi nhị phân n bit (MSB ở đầu). */
export function toBits(v, n) {
  let s = '';
  for (let i = n - 1; i >= 0; i--) s += (v >> i) & 1;
  return s;
}

/** Binary → Gray theo công thức g_i = b_{i+1} XOR b_i (b_{n} = 0 cho MSB). */
export function binToGray(bin) {
  let g = bin[0];                       // MSB giữ nguyên (vì b_n = 0)
  for (let i = 1; i < bin.length; i++) {
    g += (+bin[i - 1] ^ +bin[i]);       // XOR với bit đứng ngay trước (trọng số cao hơn)
  }
  return g;
}

/** Gray → Binary theo công thức b_i = b_{i+1} XOR g_i (tích luỹ XOR từ MSB). */
export function grayToBin(gray) {
  let b = gray[0];
  for (let i = 1; i < gray.length; i++) {
    b += (+b[i - 1] ^ +gray[i]);        // dùng bit binary vừa tính được, không phải bit gray
  }
  return b;
}

/**
 * Sinh danh sách Gray code n bit bằng "reflect and prefix":
 * L(n) = ["0"+x for x in L(n-1)] ++ ["1"+x for x in reverse(L(n-1))]
 */
export function grayList(n) {
  let list = [''];
  for (let k = 0; k < n; k++) {
    const rev = list.slice().reverse();
    list = list.map(s => '0' + s).concat(rev.map(s => '1' + s));
  }
  return list;
}

/** Các bước XOR của Binary → Gray, phục vụ hiển thị. */
export function binToGraySteps(bin) {
  const out = [];
  for (let i = 0; i < bin.length; i++) {
    const hi = i === 0 ? '0' : bin[i - 1];
    out.push({ i, a: hi, b: bin[i], r: String(+hi ^ +bin[i]), first: i === 0 });
  }
  return out;
}

/** Các bước XOR của Gray → Binary, phục vụ hiển thị. */
export function grayToBinSteps(gray) {
  const out = [];
  let prev = '0';
  for (let i = 0; i < gray.length; i++) {
    const r = String(+prev ^ +gray[i]);
    out.push({ i, a: prev, b: gray[i], r, first: i === 0 });
    prev = r;
  }
  return out;
}

/** Vị trí các bit khác nhau giữa hai chuỗi cùng độ dài. */
export function diffPositions(a, b) {
  const d = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d.push(i);
  return d;
}
