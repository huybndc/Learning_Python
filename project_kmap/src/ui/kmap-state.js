/* State dùng chung của tab K-map. Tách riêng để kmap-page.js và
   kmap-steps.js cùng đọc/ghi mà không import vòng. */

export const K = { n: 4, values: new Array(16).fill(0), view: null, groups: [], steps: null, stepIdx: -1 };
