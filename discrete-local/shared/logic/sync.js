/* ---------------------------------------------------------------
   ĐỒNG BỘ GIỮA CÁC MÁY (D37) — phần thuần, không đụng window/localStorage.
   Mỗi máy (mỗi trình duyệt) giữ một "bản chụp" localStorage: khoá → { v, t }
     v = chuỗi đang lưu (null = đã xoá), t = lúc đổi lần cuối (ms).
   Máy chủ Vite ghi bản chụp thành <thư mục đám mây>/<máy>.json; app đọc bản
   của mọi máy rồi gộp:
     progress:*      nhật ký append-only ⇒ hợp (đa tập: giữ số lần xuất hiện lớn nhất
                     của từng sự kiện — hai câu giống hệt trong một lần nộp bài vẫn đủ 2)
     exam-history:*  hợp theo ts, mới nhất trước, giữ 20
     còn lại         bản đổi sau cùng thắng (thẻ đang học, bài thi dở, nháp, sáng/tối…)
   --------------------------------------------------------------- */

export const SYNC_APP = 'cau-math';
/** Khoá riêng của cơ chế đồng bộ — không bao giờ gửi đi. */
export const isSyncKey = k => k.startsWith('sync:');

const parseList = v => {
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
};

/** Hợp đa tập các nhật ký: mỗi sự kiện giữ số lần xuất hiện lớn nhất trong các bản. */
function unionLog(lists) {
  const best = new Map();                                  // chuỗi JSON → { e, n }
  for (const list of lists) {
    const seen = new Map();
    for (const e of list) {
      const s = JSON.stringify(e);
      const n = (seen.get(s) || 0) + 1;
      seen.set(s, n);
      if (n > (best.get(s)?.n || 0)) best.set(s, { e, n });
    }
  }
  const out = [];
  for (const { e, n } of best.values()) for (let i = 0; i < n; i++) out.push(e);
  return out.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}

/** Lịch sử thi: hợp theo ts, mới nhất trước, giữ 20 như exam-run.js. */
function unionHistory(lists) {
  const byTs = new Map();
  for (const list of lists) for (const x of list) if (!byTs.has(x.ts)) byTs.set(x.ts, x);
  return [...byTs.values()].sort((a, b) => b.ts - a.ts).slice(0, 20);
}

const RULES = [
  [/^progress:/, unionLog],
  [/^exam-history:/, unionHistory],
];

/**
 * Gộp các phiên bản của MỘT khoá.
 * @param {string} key
 * @param {{v: string|null, t: number}[]} cands
 */
export function mergeEntry(key, cands) {
  const t = Math.max(...cands.map(c => c.t));
  const rule = RULES.find(([re]) => re.test(key))?.[1];
  const alive = cands.filter(c => c.v != null);
  if (rule && alive.length) {
    const v = JSON.stringify(rule(alive.map(c => parseList(c.v))));
    // đã trùng với một bản có sẵn thì giữ nguyên chuỗi đó (khỏi ghi lại vì khác dấu cách)
    return { v: alive.find(c => c.v === v)?.v ?? v, t };
  }
  // bản đổi sau cùng thắng; hoà giờ thì chọn theo chuỗi để mọi máy ra cùng kết quả
  return cands.reduce((a, b) => (b.t > a.t || (b.t === a.t && String(b.v) > String(a.v)) ? b : a));
}

/** Bản chụp lấy từ file có hợp lệ không (file đám mây có thể đang tải dở / của app khác). */
export function validEntries(snap) {
  if (!snap || snap.app !== SYNC_APP || typeof snap.entries !== 'object' || !snap.entries) return null;
  const out = {};
  for (const [k, e] of Object.entries(snap.entries)) {
    if (isSyncKey(k) || !e || !Number.isFinite(e.t) || !(typeof e.v === 'string' || e.v === null)) continue;
    out[k] = { v: e.v, t: e.t };
  }
  return out;
}

/**
 * Ghi nhận thay đổi tại máy: so localStorage hiện tại với bản chụp lần trước.
 * Khoá mới / giá trị khác ⇒ t = now; khoá biến mất ⇒ để lại dấu xoá { v: null }.
 * @param {{[k:string]: {v: string|null, t: number}}} base
 * @param {{[k:string]: string}} current  localStorage (đã bỏ khoá sync:)
 * @returns {{ base: object, changed: boolean }}
 */
export function trackLocal(base, current, now) {
  const next = { ...base };
  let changed = false;
  for (const [k, v] of Object.entries(current)) {
    if (next[k]?.v !== v) { next[k] = { v, t: now }; changed = true; }
  }
  for (const k of Object.keys(next)) {
    if (!(k in current) && next[k].v !== null) { next[k] = { v: null, t: now }; changed = true; }
  }
  return { base: next, changed };
}

/**
 * Một lượt đồng bộ: ghi nhận thay đổi tại máy rồi gộp với bản của các máy khác.
 * @param {object} base      bản chụp lần trước của máy này
 * @param {object} current   localStorage hiện tại
 * @param {object[]} remotes các bản chụp đọc từ thư mục (có thể gồm cả bản của chính máy này)
 * @returns {{ base: object, writes: {[k:string]: string|null} }}
 *   base = bản chụp mới (gửi lên), writes = khoá cần ghi vào localStorage (null = xoá)
 */
export function reconcile(base, current, remotes, now) {
  const local = trackLocal(base, current, now).base;
  const cands = {};
  for (const snap of [local, ...remotes]) {
    for (const [k, e] of Object.entries(snap)) (cands[k] ||= []).push(e);
  }
  const merged = {};
  const writes = {};
  for (const [k, list] of Object.entries(cands)) {
    merged[k] = mergeEntry(k, list);
    const have = k in current ? current[k] : null;
    if (merged[k].v !== have) writes[k] = merged[k].v;
  }
  return { base: merged, writes };
}
