/* ---------------------------------------------------------------
   ĐIỂM KIẾN THỨC (Phase 3 — RESEARCH U-R6, D26) — thuần, test được bằng Node.
   Một thẻ bài học có `<div data-check="c1q:convert:toDec">` là một điểm kiến thức:
     khái niệm (chữ trên thẻ) → ví dụ mẫu hiện từng bước → tự làm tới khi
     đúng PASS_STREAK câu LIÊN TIẾP.
   Khoá điểm: 'prefix:kind' hoặc 'prefix:kind:nhãn' (nhãn = q.review, một kiểu câu của dạng).
   "Đã nắm" tính lại từ nhật ký làm bài (progress.js), không lưu riêng.
   --------------------------------------------------------------- */

export const PASS_STREAK = 2;

/** 'c1q:convert:toDec' → { prefix, kind, tag } */
export function parseKey(key) {
  const [prefix, kind, tag] = String(key).split(':');
  return { prefix, kind, tag };
}

/** Các khoá điểm kiến thức của một thẻ (thuộc tính data-check, theo thứ tự). */
export function pointKeys(body) {
  const out = [];
  for (const m of String(body).matchAll(/data-check="([^"]+)"/g)) {
    for (const k of m[1].split(/\s+/)) if (k && !out.includes(k)) out.push(k);
  }
  return out;
}

/** Số câu đúng liên tiếp tính từ câu cuối. */
export function streakOf(results) {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) n++;
  return n;
}

/**
 * Đã nắm điểm `key` chưa: trong nhật ký, các câu của đúng dạng (và đúng nhãn nếu có)
 * từng có PASS_STREAK câu đúng liền nhau. Mọi chế độ đều tính (làm đúng liền 2 câu
 * ở Luyện tập cũng là đã nắm).
 */
export function isPassed(events, key) {
  const { prefix, kind, tag } = parseKey(key);
  let run = 0;
  for (const e of events) {
    if (e.prefix !== prefix || e.kind !== kind || (tag && e.tag !== tag)) continue;
    run = e.ok ? run + 1 : 0;
    if (run >= PASS_STREAK) return true;
  }
  return false;
}

/** Thẻ đã qua khi mọi điểm kiến thức trên thẻ đều đã nắm; thẻ không có điểm nào ⇒ null. */
export function cardPassed(events, body) {
  const keys = pointKeys(body);
  return keys.length ? keys.every(k => isPassed(events, k)) : null;
}

/** Đếm điểm kiến thức (khác nhau) của cả bài và số đã nắm. */
export function pointsSummary(events, cards) {
  const keys = [...new Set(cards.flatMap(c => pointKeys(c.body)))];
  return { total: keys.length, passed: keys.filter(k => isPassed(events, k)).length };
}

/**
 * Hàm sinh câu cho một điểm: có nhãn thì sinh lại tới khi câu mang đúng nhãn (q.review).
 * @param {{ makeQuestion(kind, rnd) }} bank
 * @returns {(rnd: () => number) => object}
 */
export function makerFor(bank, key) {
  const { kind, tag } = parseKey(key);
  return rnd => {
    let q = bank.makeQuestion(kind, rnd);
    for (let i = 0; tag && q.review !== tag && i < 200; i++) q = bank.makeQuestion(kind, rnd);
    return q;
  };
}

/**
 * Đề cho VÍ DỤ MẪU: sinh vài đề, lấy đề cho thấy đủ bước nhưng không rối — lời giải càng gần
 * EXAMPLE_LINES dòng càng tốt, vượt thì chọn đề ngắn hơn (đổi (10)₈ ra 8 chỉ một phép tính thì
 * không dạy được gì; K-map 6 nhóm thì ngợp).
 */
export const EXAMPLE_LINES = 6;
export function exampleFor(make, rnd, tries = 8) {
  const len = q => q.work?.length ?? 0;
  const better = (a, b) => Math.min(len(a), EXAMPLE_LINES) - Math.min(len(b), EXAMPLE_LINES) || len(b) - len(a);
  let best = make(rnd);
  for (let i = 1; i < tries; i++) {
    const q = make(rnd);
    if (better(q, best) > 0) best = q;
  }
  return best;
}

/**
 * Chia lời giải từng bước (q.work) thành các BƯỚC để ví dụ mẫu hiện dần:
 * mỗi câu giải thích ({ key }) mở một bước mới; dòng tính thuần (chuỗi) đi theo câu
 * đứng trước nó. Không có work thì câu giải thích tóm tắt (explainKey) là một bước.
 * @returns {Array<Array<string|object>>}
 */
export function stepGroups(q) {
  const work = q.work ?? [];
  if (!work.length) return q.explainKey ? [[{ key: q.explainKey, params: q.explainParams }]] : [];
  const out = [];
  for (const w of work) {
    if (typeof w === 'string' && out.length) out.at(-1).push(w);
    else out.push([w]);
  }
  return out;
}
