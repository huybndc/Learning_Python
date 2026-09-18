import { spanPatch } from '../geometry/polygon3d.js';
import { unit, mul } from '../geometry/space3d.js';
import { extractBasis, spanKind } from '../logic/subspace.js';
import { dropLineItem } from './canvas3d.js';

/* Dựng danh sách vật 3D cho một không gian con: đường thẳng, mặt phẳng, hay
   khung gợi ý "cả không gian". Dùng chung cho tab Ví dụ và tab Tương tác. */

export const VEC_COLORS = ['--accent', '--warn', '--proj', '--bad'];
export const SPAN_KIND_KEYS = {
  point: 'c3.kindPoint', line: 'c3.kindLine', plane: 'c3.kindPlane', space: 'c3.kindSpace',
};

/** Khung dây gợi ý span phủ kín R³ — không vẽ đặc, chỉ đủ để mắt hiểu. */
function cubeWire(size, color) {
  const c = [-size, size];
  const items = [];
  for (const a of c) for (const b of c) {
    items.push(
      { kind: 'seg', from: [-size, a, b], to: [size, a, b], color, width: 1, alpha: 0.35 },
      { kind: 'seg', from: [a, -size, b], to: [a, size, b], color, width: 1, alpha: 0.35 },
      { kind: 'seg', from: [a, b, -size], to: [a, b, size], color, width: 1, alpha: 0.35 },
    );
  }
  return items;
}

/**
 * Hình của span{vectors}: điểm / đường thẳng / mặt phẳng / khối.
 * @param opt.size  nửa bề rộng hình vẽ ra (span thật thì vô hạn)
 */
export function spanItems(vectors, { color = '--accent', size = 4, show = true } = {}) {
  if (!show || !vectors.length) return [];
  const kind = spanKind(vectors);
  const { basis } = extractBasis(vectors);

  if (kind === 'line') {
    const d = mul(size, unit(basis[0]));
    return [{ kind: 'seg', from: mul(-1, d), to: d, color, width: 3.5, alpha: 0.85 }];
  }
  if (kind === 'plane') {
    const patch = spanPatch(basis[0], basis[1], size);
    return patch ? [{ kind: 'poly', poly: patch, color, alpha: 0.25, stroke: color, strokeAlpha: 0.5 }] : [];
  }
  if (kind === 'space') return cubeWire(size, color);
  return [];
}

/** Mũi tên cho từng vector, kèm chấm nắm ở đầu và nét gióng xuống mặt z = 0. */
export function vectorItems(vectors, { labels = [], hover = -1, drops = true } = {}) {
  const items = [];
  vectors.forEach((v, i) => {
    const color = VEC_COLORS[i % VEC_COLORS.length];
    if (drops) items.push(dropLineItem(v, color));
    items.push({ kind: 'arrow', from: [0, 0, 0], to: v, color, width: 3, text: labels[i] || null });
    items.push({ kind: 'point', at: v, color, r: hover === i ? 7 : 5, hollow: true });
  });
  return items;
}
