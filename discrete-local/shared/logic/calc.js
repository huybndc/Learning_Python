/* ---------------------------------------------------------------
   MÁY TÍNH ĐỔI CƠ SỐ (ngăn Nháp) — thuần, không dùng eval.
   Hệ 10 (DEC) là máy tính thường: số thập phân, ÷ chia thật (157 / 8 = 19.625), % lấy dư.
   Hệ 2/8/16 tính số nguyên: 1F + 3*A, (777 - 70) / 7 — ÷ là chia NGUYÊN (lấy thương), đúng phép
   dùng khi đổi cơ số bằng chia liên tiếp. Kết quả nguyên hiện ở cả 2, 8, 10, 16.
   Riêng hệ 10 (dùng cho cả ô đáp án LinAlg): sqrt(x) hay √x, lũy thừa ^, π (pi), sin cos tan asin acos atan
   tính theo ĐỘ (góc trong sách đều ra độ), và nhân ngầm: 2√3, 3sqrt(2), 2(1 + 3), 2π.
   --------------------------------------------------------------- */

const FUNCS = {
  SQRT: x => (x < 0 ? null : Math.sqrt(x)),
  SIN: x => Math.sin((x * Math.PI) / 180), COS: x => Math.cos((x * Math.PI) / 180), TAN: x => Math.tan((x * Math.PI) / 180),
  ASIN: x => (Math.abs(x) > 1 ? null : (Math.asin(x) * 180) / Math.PI),
  ACOS: x => (Math.abs(x) > 1 ? null : (Math.acos(x) * 180) / Math.PI),
  ATAN: x => (Math.atan(x) * 180) / Math.PI,
};
const NAMES = Object.keys(FUNCS).sort((a, b) => b.length - a.length);   // ASIN trước SIN

const DIGITS = '0123456789ABCDEF';

/** Tính biểu thức `text` ở cơ số `base`. Trả { value } hoặc { error: khoá lỗi, at: vị trí }. */
export function evaluate(text, base) {
  const src = String(text).toUpperCase().replace(/×/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-');
  let i = 0;
  const skip = () => { while (src[i] === ' ') i++; };
  const err = key => { throw Object.assign(new Error(key), { key, at: i }); };

  function num() {
    skip();
    const start = i;
    let v = 0;
    let scale = 0;                                   // > 0: đang đọc phần thập phân (chỉ hệ 10)
    while (i < src.length) {
      if (src[i] === '.' && base === 10 && !scale) { scale = 1; i++; continue; }
      const d = DIGITS.indexOf(src[i]);
      if (d < 0) break;
      if (d >= base) err('calc.badDigit');
      if (scale) v += d / 10 ** scale++;
      else v = v * base + d;
      i++;
    }
    if (i === start) err(i >= src.length ? 'calc.missing' : 'calc.unexpected');
    return v;
  }
  const dec = base === 10;
  /** Hàm / hằng ở vị trí i (chỉ hệ 10): trả tên hoặc null. */
  const word = () => (dec ? (src[i] === '√' ? '√' : src[i] === 'Π' ? 'Π' : src.startsWith('PI', i) ? 'PI' : NAMES.find(n => src.startsWith(n, i)) ?? null) : null);
  function atom() {
    skip();
    if (src[i] === '(') {
      i++;
      const v = sum();
      skip();
      if (src[i] !== ')') err('calc.paren');
      i++;
      return v;
    }
    if (src[i] === '-') { i++; return -power(); }
    if (src[i] === '+') { i++; return power(); }
    const w = word();
    if (w === 'Π' || w === 'PI') { i += w.length; return Math.PI; }
    if (w) {
      i += w.length;
      const v = (w === '√' ? FUNCS.SQRT : FUNCS[w])(power());
      if (v === null) err('calc.domain');
      return v;
    }
    return num();
  }
  /** a ^ b (kết hợp phải, ưu tiên hơn × ÷ và dấu âm đứng trước: −2^2 = −4). */
  function power() {
    const v = atom();
    skip();
    if (dec && src[i] === '^') { i++; return v ** power(); }
    return v;
  }
  /** Sau một thừa số, gặp "(", √, tên hàm hay π ⇒ nhân ngầm (2√3, 2(3 + 1)); chỉ hệ 10 vì A–F là chữ số hex. */
  const implicit = () => { skip(); return dec && i < src.length && (src[i] === '(' || word() !== null); };
  function product() {
    let v = power();
    for (;;) {
      skip();
      if (implicit()) { v *= power(); continue; }
      const op = src[i];
      if (op !== '*' && op !== '/' && op !== '%') return v;
      i++;
      const r = power();
      if ((op === '/' || op === '%') && r === 0) err('calc.divZero');
      v = op === '*' ? v * r : op === '%' ? v % r : base === 10 ? v / r : Math.trunc(v / r);
    }
  }
  function sum() {
    let v = product();
    for (;;) {
      skip();
      const op = src[i];
      if (op !== '+' && op !== '-') return v;
      i++;
      v = op === '+' ? v + product() : v - product();
    }
  }

  try {
    if (!src.trim()) return { value: null };
    const value = sum();
    skip();
    if (i < src.length) err('calc.unexpected');
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) err('calc.tooBig');
    return { value: Number(value.toPrecision(15)) };        // bỏ bụi dấu phẩy động: 0.1 + 0.2 = 0.3
  } catch (e) {
    if (!e.key) throw e;
    return { error: e.key, at: e.at + 1 };
  }
}

/** Số → chuỗi ở cơ số r (có dấu −; nhị phân nhóm 4 bit cho dễ đọc). Số lẻ chỉ hiện ở hệ 10. */
export function show(value, r) {
  if (!Number.isInteger(value)) return r === 10 ? String(value).replace('-', '−') : '—';
  const s = Math.abs(value).toString(r).toUpperCase();
  const body = r === 2 ? s.padStart(Math.ceil(s.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ') : s;
  return (value < 0 ? '−' : '') + body;
}
