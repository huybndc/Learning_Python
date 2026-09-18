/* ---------------------------------------------------------------
   LỜI GIẢI MẪU RÚT GỌN BẰNG ĐỊNH LÝ — Example 2.1 (§2.4)
   Biến đặt đúng như sách: x, y, z. Mỗi bước có định lý biện minh;
   checkDerivation() kiểm chứng mọi bước giữ nguyên bảng chân trị.
   --------------------------------------------------------------- */

export const DERIVATIONS = [
  {
    id: '2.1a',
    title: "x(x' + y) = xy",
    n: 3,
    from: "x(x' + y)",
    steps: [
      { expr: "xx' + xy", by: 'P4a', noteKey: 'deriv.distributeIn' },
      { expr: '0 + xy', by: 'P5b', noteKey: 'deriv.complZero' },
      { expr: 'xy', by: 'P2a', noteKey: 'deriv.identitySum' },
    ],
  },
  {
    id: '2.1b',
    title: "x + x'y = x + y",
    n: 3,
    from: "x + x'y",
    steps: [
      { expr: "(x + x')(x + y)", by: 'P4b', noteKey: 'deriv.distributeSum' },
      { expr: '1(x + y)', by: 'P5a', noteKey: 'deriv.complOne' },
      { expr: 'x + y', by: 'P2b', noteKey: 'deriv.identityProd' },
    ],
  },
  {
    id: '2.1c',
    title: "(x + y)(x + y') = x",
    n: 3,
    from: "(x + y)(x + y')",
    steps: [
      { expr: "x + yy'", by: 'P4b', noteKey: 'deriv.factorOut' },
      { expr: 'x + 0', by: 'P5b', noteKey: 'deriv.complZero' },
      { expr: 'x', by: 'P2a', noteKey: 'deriv.identitySum' },
    ],
  },
  {
    id: '2.1d',
    title: "xy + x'z + yz = xy + x'z",
    n: 3,
    from: "xy + x'z + yz",
    steps: [
      { expr: "xy + x'z + yz(x + x')", by: 'P5a', noteKey: 'deriv.multiplyOne' },
      { expr: "xy + x'z + xyz + x'yz", by: 'P4a', noteKey: 'deriv.expand' },
      { expr: "xy(1 + z) + x'z(1 + y)", by: 'P4a', noteKey: 'deriv.groupCommon' },
      { expr: "xy + x'z", by: 'T2a', noteKey: 'deriv.absorbOne' },
    ],
  },
  {
    id: '2.1e',
    title: "(x + y)(x' + z)(y + z) = (x + y)(x' + z)",
    n: 3,
    from: "(x + y)(x' + z)(y + z)",
    steps: [
      { expr: "(x + y)(x' + z)", by: 'C1', noteKey: 'deriv.consensusDual' },
    ],
  },
];

/** Tra một lời giải mẫu theo id. */
export function derivation(id) {
  const d = DERIVATIONS.find(x => x.id === id);
  if (!d) throw new Error('không có lời giải mẫu "' + id + '"');
  return d;
}
