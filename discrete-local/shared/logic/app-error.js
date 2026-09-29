/* ---------------------------------------------------------------
   LỖI CÓ MÃ — để logic/ không phải biết ngôn ngữ đang hiển thị.
   logic/ ném AppError(key, params); ui/ bắt và dịch bằng t(key, params).
   --------------------------------------------------------------- */

export class AppError extends Error {
  constructor(key, params = {}) {
    super(key);                 // message = key, đủ dùng khi in ra console
    this.name = 'AppError';
    this.key = key;
    this.params = params;
  }
}

/** Ném một AppError — viết gọn ở chỗ dùng. */
export function fail(key, params) {
  throw new AppError(key, params);
}
