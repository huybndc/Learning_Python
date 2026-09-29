/**
 * Xáo và bộ sinh số ngẫu nhiên có hạt giống — dùng chung cho sinh đề, luyện tập, thi thử.
 * Mẫu lấy từ toeic-app (src/logic/shuffle.js), copy chứ không import chéo repo.
 */

/**
 * Bộ sinh số ngẫu nhiên CÓ HẠT GIỐNG (mulberry32): cùng `seed` luôn ra cùng một dãy số.
 * Thi thử lưu `seed` lúc bắt đầu; tải lại trang thì dựng lại ĐÚNG đề cũ bằng seed đó.
 * @param {number} seed
 * @returns {() => number} số trong [0, 1), dùng thay cho Math.random
 */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates: xáo ĐỀU (khác `sort(() => random() - 0.5)` vốn thiên lệch).
 * @template T
 * @param {T[]} list
 * @param {() => number} random
 * @returns {T[]} mảng mới, không sửa mảng gốc
 */
export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Chọn ngẫu nhiên một phần tử / một số nguyên trong [lo, hi] — tiện cho các hàm sinh đề. */
export const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
export const int = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));
