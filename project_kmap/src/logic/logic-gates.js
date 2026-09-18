/* ---------------------------------------------------------------
   16 HÀM BOOLEAN HAI BIẾN & 8 CỔNG LOGIC CHUẨN — Chương 2, §2.7–2.8
   Fᵢ được đánh số theo bảng chân trị đọc từ dòng xy = 00 → 11, dòng ĐẦU là
   bit CAO nhất: F1 = 0001 = AND, F7 = 0111 = OR, F14 = 1110 = NAND.
   --------------------------------------------------------------- */

/** Nhóm phân loại 16 hàm. */
export const GROUPS = {
  constant: 'Hằng',
  unary: 'Một biến (transfer / complement)',
  binary: 'Toán tử hai ngôi',
};

/* Tên, ký hiệu đại số và tên cổng (nếu là cổng chuẩn) của từng Fᵢ. */
const TABLE = [
  { i: 0, expr: '0', name: 'Null (hằng 0)', op: '0', gate: null },
  { i: 1, expr: 'xy', name: 'AND', op: 'x · y', gate: 'AND' },
  { i: 2, expr: "xy'", name: 'Inhibition (x nhưng không y)', op: 'x/y', gate: null },
  { i: 3, expr: 'x', name: 'Transfer x', op: 'x', gate: 'Buffer' },
  { i: 4, expr: "x'y", name: 'Inhibition (y nhưng không x)', op: 'y/x', gate: null },
  { i: 5, expr: 'y', name: 'Transfer y', op: 'y', gate: 'Buffer' },
  { i: 6, expr: "xy' + x'y", name: 'XOR (khác dấu)', op: 'x ⊕ y', gate: 'XOR' },
  { i: 7, expr: 'x + y', name: 'OR', op: 'x + y', gate: 'OR' },
  { i: 8, expr: "(x + y)'", name: 'NOR', op: 'x ↓ y', gate: 'NOR' },
  { i: 9, expr: "xy + x'y'", name: 'XNOR (bằng nhau)', op: '(x ⊕ y)′', gate: 'XNOR' },
  { i: 10, expr: "y'", name: 'Complement y', op: 'y′', gate: 'NOT' },
  { i: 11, expr: "x + y'", name: 'Implication (y ⇒ x)', op: 'x ⊂ y', gate: null },
  { i: 12, expr: "x'", name: 'Complement x', op: 'x′', gate: 'NOT' },
  { i: 13, expr: "x' + y", name: 'Implication (x ⇒ y)', op: 'x ⊃ y', gate: null },
  { i: 14, expr: "(xy)'", name: 'NAND', op: 'x ↑ y', gate: 'NAND' },
  { i: 15, expr: '1', name: 'Identity (hằng 1)', op: '1', gate: null },
];

/** Giá trị của Fᵢ tại (x, y). Dòng xy được đánh số 0..3 theo (x<<1)|y. */
export function evalFunction(i, x, y) {
  if (i < 0 || i > 15) throw new Error('chỉ có F0..F15');
  const row = (x << 1) | y;            // 0..3 theo thứ tự xy = 00, 01, 10, 11
  return (i >> (3 - row)) & 1;         // dòng 0 là bit cao nhất
}

/** Bảng chân trị 4 dòng của Fᵢ, theo thứ tự xy = 00, 01, 10, 11. */
export function truthRows(i) {
  const out = [];
  for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1; y++) out.push({ x, y, f: evalFunction(i, x, y) });
  return out;
}

/** Phân loại một hàm vào 1 trong 3 nhóm, dựa trên biến nào thực sự ảnh hưởng. */
export function classify(i) {
  const dependsX = [0, 1].some(y => evalFunction(i, 0, y) !== evalFunction(i, 1, y));
  const dependsY = [0, 1].some(x => evalFunction(i, x, 0) !== evalFunction(i, x, 1));
  if (!dependsX && !dependsY) return 'constant';
  return (dependsX && dependsY) ? 'binary' : 'unary';
}

/** Toàn bộ bảng 16 hàm, kèm phân loại và bảng chân trị. */
export function allFunctions() {
  return TABLE.map(t => ({
    ...t,
    group: classify(t.i),
    rows: truthRows(t.i),
    bits: truthRows(t.i).map(r => r.f).join(''),
  }));
}

/** Tra một hàm theo chỉ số. */
export function functionAt(i) {
  const f = allFunctions()[i];
  if (!f) throw new Error('chỉ có F0..F15');
  return f;
}

/* ---------------- 8 cổng logic chuẩn (§2.8) ---------------- */

export const STANDARD_GATES = [
  { gate: 'AND', fi: 1, symbol: 'x · y', note: 'Bằng 1 khi cả hai ngõ vào bằng 1.' },
  { gate: 'OR', fi: 7, symbol: 'x + y', note: 'Bằng 1 khi ít nhất một ngõ vào bằng 1.' },
  { gate: 'NOT', fi: 12, symbol: "x′", note: 'Inverter — đảo giá trị ngõ vào.' },
  { gate: 'Buffer', fi: 3, symbol: 'x', note: 'Chuyển tiếp giá trị, dùng để khuếch đại tín hiệu.' },
  { gate: 'NAND', fi: 14, symbol: 'x ↑ y', note: 'AND rồi đảo. Cổng phổ quát.' },
  { gate: 'NOR', fi: 8, symbol: 'x ↓ y', note: 'OR rồi đảo. Cổng phổ quát.' },
  { gate: 'XOR', fi: 6, symbol: 'x ⊕ y', note: 'Bằng 1 khi hai ngõ vào KHÁC nhau.' },
  { gate: 'XNOR', fi: 9, symbol: '(x ⊕ y)′', note: 'Bằng 1 khi hai ngõ vào BẰNG nhau.' },
];

/** Kết quả của cả 8 cổng chuẩn tại một cặp (x, y). */
export function evalAllGates(x, y) {
  return STANDARD_GATES.map(g => ({ ...g, value: evalFunction(g.fi, x, y) }));
}

/* ---------------- Mở rộng nhiều ngõ vào ---------------- */

/** Cổng nào có tính kết hợp ⇒ mở rộng nhiều ngõ vào một cách tự nhiên. */
export const ASSOCIATIVE = { AND: true, OR: true, XOR: true, NAND: false, NOR: false, XNOR: false };

/** NAND nhiều ngõ vào định nghĩa đúng: (x₁x₂…xₙ)′. */
export function nandN(bits) {
  return bits.every(b => b === 1) ? 0 : 1;
}

/** NOR nhiều ngõ vào định nghĩa đúng: (x₁ + x₂ + … + xₙ)′. */
export function norN(bits) {
  return bits.some(b => b === 1) ? 0 : 1;
}

/** XOR nhiều ngõ vào = odd function (bằng 1 khi số ngõ vào bằng 1 là lẻ). */
export function xorN(bits) {
  return bits.reduce((a, b) => a ^ b, 0);
}

/**
 * Chứng minh NAND KHÔNG kết hợp: so (x↑y)↑z với x↑(y↑z) trên cả 8 dòng.
 * Trả về { associative, rows:[{x,y,z,left,right,same}] }.
 */
export function nandAssociativityTable() {
  const nand2 = (a, b) => (a && b ? 0 : 1);
  const rows = [];
  for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1; y++) for (let z = 0; z <= 1; z++) {
    const left = nand2(nand2(x, y), z);
    const right = nand2(x, nand2(y, z));
    rows.push({ x, y, z, left, right, same: left === right, proper: nandN([x, y, z]) });
  }
  return { associative: rows.every(r => r.same), rows };
}

/** Tương tự cho NOR. */
export function norAssociativityTable() {
  const nor2 = (a, b) => (a || b ? 0 : 1);
  const rows = [];
  for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1; y++) for (let z = 0; z <= 1; z++) {
    const left = nor2(nor2(x, y), z);
    const right = nor2(x, nor2(y, z));
    rows.push({ x, y, z, left, right, same: left === right, proper: norN([x, y, z]) });
  }
  return { associative: rows.every(r => r.same), rows };
}
