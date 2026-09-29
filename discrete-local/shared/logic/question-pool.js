/* ---------------------------------------------------------------
   KHÔNG RA LẶP CÂU — dùng chung cho luyện tập, thẻ học và bài full.
   Hai câu được coi là "cùng một câu" khi cùng dạng và cùng dữ liệu sinh đề (`meta`).
   Không có meta thì so thứ người học THẤY: đề, tham số, hình (không so thứ tự xáo phương án —
   cùng một câu xáo lại vẫn là lặp). Ví dụ: cùng cổng NAND hỏi bảng chân trị hai lần là lặp,
   dù phương án nhiễu khác nhau.
   Quy ước cho ngân hàng: `meta` chỉ chứa dữ liệu quyết định câu hỏi, không chứa thứ tự xáo.
   Thuần, không đụng DOM.
   --------------------------------------------------------------- */

import { seededRandom } from './shuffle.js';

export const signature = q => JSON.stringify([q.kind, q.meta
  ?? (q.textParams || q.figure ? [q.textKey ?? null, q.textParams ?? null, q.figure ?? null] : q.answer)]);

/**
 * Sinh một câu CHƯA có trong `hard` (bắt buộc) và, nếu được, chưa có trong `soft` (câu của lượt trước).
 * Thêm chữ ký câu chọn vào `hard`. Thử `tries` lần mà chỉ gặp câu trong `hard` ⇒ trả null
 * (dạng này đã hết câu mới) để người gọi chọn dạng khác hoặc kết thúc lượt, thay vì ra câu lặp.
 * @param {() => object} make  hàm sinh một câu
 */
export function freshQuestion(make, hard, soft = new Set(), tries = 30) {
  let old = null;                                   // câu mới với lượt này nhưng đã gặp ở lượt trước
  for (let i = 0; i < tries * 2; i++) {
    const q = make();
    const sig = signature(q);
    if (hard.has(sig)) continue;
    if (soft.has(sig) && i < tries) { old ??= q; continue; }
    hard.add(sig);
    return q;
  }
  if (old) hard.add(signature(old));
  return old;
}

/**
 * Ước lượng số câu KHÁC NHAU mà `make` sinh được (tối đa `need`): sinh thử `probes` lần, đếm chữ ký.
 * Dùng để rút ngắn lượt khi dạng bài chỉ có ít câu — ra câu lặp cho đủ 10 thì vô ích.
 */
export function poolSize(make, need, probes = 80) {
  const seen = new Set();
  for (let i = 0; i < probes && seen.size < need; i++) seen.add(signature(make()));
  return seen.size;
}

/* ---------- mã câu (hub D33): tái hiện đúng câu người học báo sai ---------- */

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Sinh câu từ một hạt giống và ghi hạt giống vào câu — cùng (ngân hàng, dạng, hạt giống) luôn ra đúng câu đó. */
export function seededQuestion(bank, kind, seed) {
  const q = bank.makeQuestion(kind, seededRandom(seed));
  q.seed = seed;
  return q;
}

/** "discrete-c8q-iso-1k2j3h" (+ "-tn" nếu là bản trắc nghiệm); câu không có hạt giống (thẻ học) thì null. */
export const questionCode = (subject, prefix, q, mcq = false) =>
  (q.seed == null ? null : [subject, prefix, q.kind, q.seed.toString(36), ...(mcq ? ['tn'] : [])].join('-'));

/** Đọc ngược mã câu; sai dạng thì null. */
export function parseCode(code) {
  const [subject, prefix, kind, seed, tn, extra] = String(code).trim().split('-');
  if (!kind || !/^[0-9a-z]+$/.test(seed ?? '') || extra !== undefined || (tn !== undefined && tn !== 'tn')) return null;
  return { subject, prefix, kind, seed: parseInt(seed, 36), mcq: tn === 'tn' };
}
