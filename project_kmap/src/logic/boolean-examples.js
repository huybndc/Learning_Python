/* ---------------------------------------------------------------
   LỜI GIẢI MẪU RÚT GỌN BẰNG ĐỊNH LÝ — Example 2.1 (§2.4)
   Mỗi lời giải là một chuỗi bước, có định lý biện minh cho từng bước.
   checkDerivation() kiểm chứng mọi bước cùng bảng chân trị với hàm gốc.
   --------------------------------------------------------------- */

export const DERIVATIONS = [
  {
    id: '2.1a',
    title: "x(x' + y) = xy",
    n: 3, vars: 'x → A, y → B',
    from: "A(A' + B)",
    steps: [
      { expr: "AA' + AB", by: 'P4a', note: 'Phân phối A vào trong ngoặc.' },
      { expr: '0 + AB', by: 'P5b', note: "AA' = 0 (phần tử bù)." },
      { expr: 'AB', by: 'P2a', note: '0 + AB = AB (phần tử trung hoà).' },
    ],
  },
  {
    id: '2.1b',
    title: "x + x'y = x + y",
    n: 3, vars: 'x → A, y → B',
    from: "A + A'B",
    steps: [
      { expr: "(A + A')(A + B)", by: 'P4b', note: 'Phân phối dạng tổng.' },
      { expr: '1(A + B)', by: 'P5a', note: "A + A' = 1 (phần tử bù)." },
      { expr: 'A + B', by: 'P2b', note: '1 · (A + B) = A + B.' },
    ],
  },
  {
    id: '2.1c',
    title: "(x + y)(x + y') = x",
    n: 3, vars: 'x → A, y → B',
    from: "(A + B)(A + B')",
    steps: [
      { expr: "A + BB'", by: 'P4b', note: 'Phân phối ngược (gộp A ra ngoài).' },
      { expr: 'A + 0', by: 'P5b', note: "BB' = 0." },
      { expr: 'A', by: 'P2a', note: 'A + 0 = A.' },
    ],
  },
  {
    id: '2.1d',
    title: "xy + x'z + yz = xy + x'z  (định lý consensus)",
    n: 3, vars: 'x → A, y → B, z → C',
    from: "AB + A'C + BC",
    steps: [
      { expr: "AB + A'C + BC(A + A')", by: 'P5a', note: "Nhân thêm 1 = A + A' vào term BC." },
      { expr: "AB + A'C + ABC + A'BC", by: 'P4a', note: 'Khai triển.' },
      { expr: "AB(1 + C) + A'C(1 + B)", by: 'P4a', note: 'Gộp nhân tử chung.' },
      { expr: "AB + A'C", by: 'T2a', note: '1 + C = 1 và 1 + B = 1 (phần tử nuốt).' },
    ],
  },
  {
    id: '2.1e',
    title: "(x + y)(x' + z)(y + z) = (x + y)(x' + z)  (dual của consensus)",
    n: 3, vars: 'x → A, y → B, z → C',
    from: "(A + B)(A' + C)(B + C)",
    steps: [
      { expr: "(A + B)(A' + C)", by: 'C1', note: 'Dual của định lý consensus: bỏ được term (B + C).' },
    ],
  },
];

/** Tra một lời giải mẫu theo id. */
export function derivation(id) {
  const d = DERIVATIONS.find(x => x.id === id);
  if (!d) throw new Error('không có lời giải mẫu "' + id + '"');
  return d;
}
