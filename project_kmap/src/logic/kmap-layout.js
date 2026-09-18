import { grayList } from './gray.js';
import { varNames, implicantMinterms } from './quine-mccluskey.js';

/* ---------------------------------------------------------------
   4. HÌNH HỌC K-MAP
   Bố cục: nhãn hàng / cột theo thứ tự Gray. 5 biến = 2 "sheet" (A=0, A=1).
   --------------------------------------------------------------- */

/** Mô tả bố cục K-map cho n biến. */
export function mapLayout(n) {
  const names = varNames(n);
  let sheetVars, rowVars, colVars;
  if (n === 2) { sheetVars = []; rowVars = [names[0]]; colVars = [names[1]]; }
  else if (n === 3) { sheetVars = []; rowVars = [names[0]]; colVars = names.slice(1); }
  else if (n === 4) { sheetVars = []; rowVars = names.slice(0, 2); colVars = names.slice(2); }
  else { sheetVars = [names[0]]; rowVars = names.slice(1, 3); colVars = names.slice(3); }
  const rowCodes = grayList(rowVars.length);
  const colCodes = grayList(colVars.length);
  const sheetCodes = grayList(sheetVars.length);
  return { n, sheetVars, rowVars, colVars, rowCodes, colCodes, sheetCodes };
}

/** minterm tại ô (sheet, row, col). Bit ghép theo thứ tự sheet + row + col. */
export function cellMinterm(L, s, r, c) {
  return parseInt(L.sheetCodes[s] + L.rowCodes[r] + L.colCodes[c], 2);
}

/** Bảng tra ngược: minterm -> {s, r, c}. */
export function mintermPositions(L) {
  const pos = [];
  for (let s = 0; s < L.sheetCodes.length; s++)
    for (let r = 0; r < L.rowCodes.length; r++)
      for (let c = 0; c < L.colCodes.length; c++)
        pos[cellMinterm(L, s, r, c)] = { s, r, c };
  return pos;
}

/**
 * Tách một tập chỉ số thành các đoạn liên tiếp theo thứ tự tuyến tính.
 * Nhóm quấn biên (ví dụ {0,3} với size 4) tự nhiên tách thành 2 mảnh ở hai mép.
 */
export function contiguousSegments(idxs, size) {
  const set = new Set(idxs);
  if (set.size === size) return [[0, size]];
  const segs = [];
  let i = 0;
  while (i < size) {
    if (!set.has(i)) { i++; continue; }
    let j = i;
    while (j + 1 < size && set.has(j + 1)) j++;
    segs.push([i, j - i + 1]);
    i = j + 1;
  }
  return segs;
}

/** Các hình chữ nhật cần vẽ cho một implicant (nhiều mảnh nếu quấn biên). */
export function implicantRects(imp, n) {
  const L = mapLayout(n);
  const pos = mintermPositions(L);
  const bySheet = new Map();
  for (const m of implicantMinterms(imp, n)) {
    const p = pos[m];
    if (!bySheet.has(p.s)) bySheet.set(p.s, { rows: new Set(), cols: new Set() });
    bySheet.get(p.s).rows.add(p.r);
    bySheet.get(p.s).cols.add(p.c);
  }
  const rects = [];
  for (const [s, o] of bySheet) {
    const rSegs = contiguousSegments([...o.rows], L.rowCodes.length);
    const cSegs = contiguousSegments([...o.cols], L.colCodes.length);
    for (const [r0, rh] of rSegs) for (const [c0, cw] of cSegs) rects.push({ s, r: r0, c: c0, h: rh, w: cw });
  }
  return rects;
}

