import { sub, add, mul, dot, cross, unit } from './space3d.js';

/* ---------------------------------------------------------------
   ĐA GIÁC TRONG KHÔNG GIAN — sắp thứ tự vẽ theo độ sâu.

   Vẽ 3D bằng Canvas 2D thì dùng thuật toán "người thợ sơn": vẽ vật ở xa
   trước, vật ở gần sau. Cách đó sai đúng một trường hợp — hai mặt phẳng
   CẮT NHAU, vì lúc đó không mặt nào ở trước hoàn toàn. Mà giao của hai không
   gian con lại là nội dung chính của Chương 3, nên phải xử lý cho đúng:
   cắt đôi mỗi mặt theo mặt kia, rồi mới sắp thứ tự. Sau khi cắt, các mảnh
   không còn xuyên qua nhau nên người thợ sơn cho kết quả đúng.
   --------------------------------------------------------------- */

const EPS = 1e-9;

/** Pháp tuyến của một đa giác phẳng (lấy từ ba đỉnh không thẳng hàng). */
export function polygonNormal(poly) {
  for (let i = 1; i + 1 < poly.length; i++) {
    const n = cross(sub(poly[i], poly[0]), sub(poly[i + 1], poly[0]));
    if (Math.hypot(n[0], n[1], n[2]) > 1e-12) return unit(n);
  }
  return null;                                   // đa giác suy biến
}

/** Mặt phẳng chứa đa giác, dạng {n, d} với n·x = d. */
export function polygonPlane(poly) {
  const n = polygonNormal(poly);
  return n ? { n, d: dot(n, poly[0]) } : null;
}

export const centroid = poly => mul(1 / poly.length,
  poly.reduce((s, p) => add(s, p), [0, 0, 0]));

/**
 * Cắt một đa giác lồi bằng một mặt phẳng.
 * Trả { front, back } — phần nằm về phía pháp tuyến và phần còn lại.
 * Đa giác không chạm mặt phẳng thì một trong hai phần là null.
 */
export function splitConvex(poly, plane) {
  const dist = poly.map(p => dot(plane.n, p) - plane.d);
  if (dist.every(v => v >= -EPS)) return { front: poly, back: null };
  if (dist.every(v => v <= EPS)) return { front: null, back: poly };

  const front = [], back = [];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const [a, b] = [poly[i], poly[j]];
    const [da, db] = [dist[i], dist[j]];
    if (da >= -EPS) front.push(a);
    if (da <= EPS) back.push(a);
    // cạnh cắt ngang mặt phẳng → thêm điểm cắt vào cả hai nửa
    if ((da > EPS && db < -EPS) || (da < -EPS && db > EPS)) {
      const t = da / (da - db);
      const cut = add(a, mul(t, sub(b, a)));
      front.push(cut);
      back.push(cut);
    }
  }
  return {
    front: front.length >= 3 ? front : null,
    back: back.length >= 3 ? back : null,
  };
}

/**
 * Cắt một đoạn thẳng bằng mặt phẳng. Trả null nếu đoạn nằm hẳn một phía;
 * ngược lại trả hai nửa, để nửa nằm sau mặt phẳng được vẽ trước nửa nằm trước.
 */
export function splitSegment(from, to, plane) {
  const da = dot(plane.n, from) - plane.d;
  const db = dot(plane.n, to) - plane.d;
  if ((da >= -EPS && db >= -EPS) || (da <= EPS && db <= EPS)) return null;
  const t = da / (da - db);
  const cut = add(from, mul(t, sub(to, from)));
  return [[from, cut], [cut, to]];
}

/**
 * Cắt mọi đa giác theo mặt phẳng của các đa giác còn lại, để không mảnh nào
 * xuyên qua mảnh nào. Mỗi mảnh giữ lại `meta` của đa giác gốc (màu, nhãn…).
 */
export function splitAll(items) {
  const planes = items.map(it => polygonPlane(it.poly));
  // `src` ghi nhớ đa giác gốc, để một mảnh không bị cắt bằng chính mặt của nó
  let pieces = items.map((it, i) => ({ ...it, src: i }));

  planes.forEach((plane, k) => {
    if (!plane) return;
    const next = [];
    for (const piece of pieces) {
      if (piece.src === k) { next.push(piece); continue; }
      const { front, back } = splitConvex(piece.poly, plane);
      if (front && back) next.push({ ...piece, poly: front }, { ...piece, poly: back });
      else next.push(piece);
    }
    pieces = next;
  });
  return pieces;
}

/**
 * Sắp thứ tự vẽ: xa trước, gần sau. Độ sâu của một mảnh lấy theo đỉnh gần
 * camera nhất chứ không chỉ theo trọng tâm — mảnh dài nằm chéo mà chỉ so
 * trọng tâm thì hay bị vẽ sai lượt.
 */
export function sortForPainter(items, depthOf) {
  return items
    .map(it => {
      const pts = it.poly || it.points || [];
      const depths = pts.map(depthOf);
      return {
        item: it,
        far: depths.length ? Math.max(...depths) : 0,
        near: depths.length ? Math.min(...depths) : 0,
      };
    })
    .sort((a, b) => (b.far - a.far) || (b.near - a.near))
    .map(x => x.item);
}

/** Hình bình hành dựng bởi u và v, đặt tại gốc (mảnh span của 2 vector). */
export const parallelogram3 = (u, v, origin = [0, 0, 0]) =>
  [origin, add(origin, u), add(origin, add(u, v)), add(origin, v)];

/**
 * Mảnh mặt phẳng span{u, v} cắt theo một hình vuông cỡ `size` — dùng để vẽ
 * "mặt phẳng đi qua gốc toạ độ" mà không cần vẽ ra vô tận.
 */
export function spanPatch(u, v, size = 4) {
  const a = unit(u);
  // dựng vector thứ hai vuông góc với a trong chính mặt phẳng đó
  const proj = mul(dot(v, a), a);
  const perp = sub(v, proj);
  if (Math.hypot(perp[0], perp[1], perp[2]) < 1e-9) return null;   // hai vector cùng phương
  const b = unit(perp);
  return [
    add(mul(-size, a), mul(-size, b)),
    add(mul(size, a), mul(-size, b)),
    add(mul(size, a), mul(size, b)),
    add(mul(-size, a), mul(size, b)),
  ];
}
