/* Hệ phương trình đang xem ở Chương 2, chia sẻ giữa card khử Gauss và card
   vẽ hình — đổi ở một chỗ thì chỗ kia vẽ lại theo. */

const listeners = new Set();
export const state = { M: [[1, 2, 3, 6], [2, 5, 2, 4], [6, -3, 1, 2]] };

export const onSystemChange = fn => listeners.add(fn);

export function setSystem(M) {
  state.M = M;
  listeners.forEach(fn => fn(M));
}
