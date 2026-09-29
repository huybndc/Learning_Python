/* ---------------------------------------------------------------
   NHẬT KÝ LÀM BÀI — append-only như toeic D23 (bản một máy, localStorage).
   Sự kiện: { ts, prefix, kind, ok, mode }  mode: practice | lesson | exam | long
   Mọi con số hiện cho người học (đúng %, phút học, "← cần nhất") tính lại
   từ nhật ký, không lưu riêng. Thuần: không đụng window/localStorage.
   --------------------------------------------------------------- */

export const DAY = 86400000;

/** Số câu / số đúng / tỉ lệ đúng, lọc theo ngân hàng, dạng (hoặc nhóm dạng `kinds`), thời điểm. */
export function statsOf(events, { prefix, kind, kinds, since = 0 } = {}) {
  let attempts = 0, correct = 0;
  for (const e of events) {
    if (e.ts < since || (prefix && e.prefix !== prefix) || (kind && e.kind !== kind) || (kinds && !kinds.includes(e.kind))) continue;
    attempts++;
    if (e.ok) correct++;
  }
  return { attempts, correct, accuracy: attempts ? correct / attempts : null };
}

/** 7 ngày qua nếu có làm, không thì tổng cộng — như dòng "đúng 78% (…, 7 ngày qua)" của toeic. */
export function recentStats(events, filter, now) {
  const week = statsOf(events, { ...filter, since: now - 7 * DAY });
  return week.attempts ? { ...week, scope: 'week' } : { ...statsOf(events, filter), scope: 'all' };
}

/**
 * Phút học ước tính từ `since`: cộng thời gian chuẩn của các câu đã làm.
 * Nhật ký không đo giờ thật (toeic D36 làm y như vậy).
 * @param {{[prefix:string]: {[kind:string]: number}}} seconds
 */
export function minutesSince(events, seconds, since) {
  let s = 0;
  for (const e of events) if (e.ts >= since) s += seconds[e.prefix]?.[e.kind] ?? 60;
  return Math.round(s / 60);
}

/**
 * Điểm "cần luyện" 0–100 của một dạng (bảng NEED của toeic D52):
 * chưa làm = 70 (không biết mình yếu tới đâu là lỗ hổng lớn nhất),
 * dưới 5 câu = 55 (chưa đủ kết luận), còn lại = % làm sai.
 */
export function needOf({ attempts, accuracy }) {
  if (!attempts) return { need: 70, reason: 'new' };
  if (attempts < 5) return { need: 55, reason: 'few' };
  return { need: Math.round((1 - accuracy) * 100), reason: 'weak' };
}

/**
 * Xếp các dạng theo độ cần, giữ thứ tự gốc khi bằng điểm (chương trước lên trước).
 * @param {{prefix:string, kind:string}[]} items
 */
export function rankNeeds(events, items, now) {
  return items
    .map((it, i) => {
      const stats = recentStats(events, { prefix: it.prefix, kind: it.kind }, now);
      return { ...it, stats, ...needOf(stats), i };
    })
    .sort((a, b) => b.need - a.need || a.i - b.i);
}

/**
 * Chương đã học = đã làm ít nhất một câu của chương (luyện tập, câu kiểm tra trong bài học, thi thử); mới nhất trước.
 * Thay cho đoán theo tuần syllabus — giảng viên dạy khác thứ tự (D43). Không dựa vào "đã mở bài học":
 * app gắn bài học của mọi chương ngay lúc khởi động nên dấu đó luôn có.
 * @param {{id:string, prefix?:string}[]} chapters
 */
export function studiedChapters(chapters, events) {
  const last = new Map();
  for (const e of events) {
    const c = chapters.find(x => x.prefix && x.prefix === e.prefix);
    if (c) last.set(c.id, Math.max(last.get(c.id) ?? 0, e.ts ?? 0));
  }
  return [...last].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
