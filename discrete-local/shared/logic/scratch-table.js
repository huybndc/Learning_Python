/* ---------------------------------------------------------------
   BẢNG TRONG NHÁP (shared/ui/scratch.js) — hàm thuần.
   Trạng thái: { rows, cols, cells }; cells[0] là dòng tiêu đề, cells[1…rows] là thân bảng.
   Thu nhỏ bảng KHÔNG xoá chữ trong ô bị ẩn: bấm nhầm "−" rồi tăng lại thì chữ vẫn còn.
   --------------------------------------------------------------- */

export const LIMITS = { rows: [1, 64], cols: [1, 10] };
export const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, Math.trunc(n) || lo));

/** Dòng i = i viết nhị phân, đủ k chữ số với 2^k ≥ rows (8 dòng ⇒ 000 … 111). */
export function combos(rows) {
  const k = Math.max(1, Math.ceil(Math.log2(rows)));
  return Array.from({ length: rows }, (_, i) => [...i.toString(2).padStart(k, '0')]);
}

/** Tên biến theo sách của môn: Discrete (MCS/Rosen) p, q, r…; Logic/LinAlg theo Mano x, y / x, y, z / w, x, y, z… */
export const varNames = (k, subject) =>
  [...(subject === 'discrete' ? 'pqrstu'.slice(0, k) : k <= 3 ? 'xyz'.slice(0, k) : 'uvwxyz'.slice(-k))];

export const VARS = [1, 6];                     // 6 biến = 64 hàng = LIMITS.rows

/**
 * Chọn n biến: 2^n hàng, n cột biến bên trái điền tổ hợp theo quy ước (biến đầu = bit cao nhất, dòng m = m nhị phân).
 * Chỉ đụng cột BIẾN; cột F và cột trung gian (sau `vars` cột biến cũ) giữ nguyên chữ, dời sang phải/trái cho khớp.
 */
export function setVars({ cols, cells, vars = 0 }, n, subject) {
  const rows = 2 ** n, bits = combos(rows);
  const next = cells.map(r => [...r]);
  for (let i = 0; i <= rows; i++) next[i] = [...(i ? bits[i - 1] : varNames(n, subject)), ...(next[i] ?? []).slice(vars)];
  next[0][n] ||= 'F';
  return { rows, cols: clamp(Math.max(cols - vars + n, n + 1), LIMITS.cols), cells: next, vars: n };
}

/** Dán khối nhiều ô (Excel/Sheets chép ra: cột cách bằng Tab, dòng cách bằng xuống dòng) từ ô (r, c); nới bảng nếu cần. */
export function pasteBlock(st, r, c, text) {
  const block = text.replace(/\r?\n$/, '').split(/\r?\n/).map(line => line.split('\t'));
  const cells = st.cells.map(x => [...x]);
  block.forEach((line, i) => line.forEach((v, j) => {
    const row = (cells[r + i] ??= []);
    for (let k = row.length; k < c + j; k++) row[k] = '';
    row[c + j] = v;
  }));
  return {
    ...st, cells,
    rows: clamp(Math.max(st.rows, r + block.length - 1), LIMITS.rows),
    cols: clamp(Math.max(st.cols, c + Math.max(...block.map(l => l.length))), LIMITS.cols),
  };
}

/** Đọc từ localStorage (chuỗi JSON hoặc null); hỏng/thiếu ⇒ bảng 3 biến đã điền sẵn tổ hợp. */
export function loadTable(raw, subject) {
  try {
    const t = JSON.parse(raw);
    if (Array.isArray(t?.cells)) {
      const cells = Array.from(t.cells, r => Array.from(Array.isArray(r) ? r : [], c => (typeof c === 'string' ? c : '')));
      const rows = clamp(t.rows, LIMITS.rows);
      // bảng lưu trước khi có số biến: đoán như "Điền 0/1" cũ (số bit đủ đánh số các hàng)
      return { rows, cols: clamp(t.cols, LIMITS.cols), cells, vars: clamp(t.vars ?? Math.ceil(Math.log2(rows)), VARS) };
    }
  } catch { /* JSON hỏng ⇒ mặc định */ }
  return setVars({ cols: 4, cells: [] }, 3, subject);
}

/* ---------- Bìa K trống (Mano: 2 biến x|y, 3 biến x|yz, 4 biến wx|yz; hàng/cột theo mã Gray) ---------- */
const GRAY = { 1: ['0', '1'], 2: ['00', '01', '11', '10'] };

/** Nhãn hàng/cột và số minterm của từng ô. Chỉ là khung giấy — không điền, không khoanh hộ. */
export function kmapLayout(n) {
  const rv = n === 4 ? 2 : 1, cv = n - rv;
  const names = varNames(n);
  const rows = GRAY[rv], cols = GRAY[cv];
  return {
    rowVars: names.slice(0, rv).join(''), colVars: names.slice(rv).join(''), rows, cols,
    cells: rows.map(r => cols.map(c => parseInt(r + c, 2))),
  };
}

/** Bìa K đọc từ localStorage; hỏng/thiếu ⇒ bìa 3 biến trống. marks[m] = giá trị ô, groups[m] = các nhóm đã tô. */
export function loadKmap(raw) {
  try {
    const t = JSON.parse(raw);
    if ([2, 3, 4].includes(t?.n) && t.marks && t.groups) return { n: t.n, marks: t.marks, groups: t.groups };
  } catch { /* hỏng ⇒ mặc định */ }
  return { n: 3, marks: {}, groups: {} };
}

/** Bấm ô: không cầm bút ⇒ '' → 1 → 0 → X → ''; đang cầm bút nhóm g ⇒ thêm/bỏ ô khỏi nhóm g. */
export function clickCell(k, m, pen) {
  if (pen == null) {
    const order = ['', '1', '0', 'X'];
    return { ...k, marks: { ...k.marks, [m]: order[(order.indexOf(k.marks[m] ?? '') + 1) % 4] } };
  }
  const g = k.groups[m] ?? [];
  return { ...k, groups: { ...k.groups, [m]: g.includes(pen) ? g.filter(x => x !== pen) : [...g, pen] } };
}
