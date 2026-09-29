/* ---------------------------------------------------------------
   ĐỌC & SO ĐÁP ÁN — dùng chung cho mọi dạng câu tự sinh.
   Nguyên tắc: người học viết khác định dạng (khoảng trắng, ngoặc, đệm 0,
   dấu trừ Unicode) mà cùng giá trị thì vẫn đúng. Thuần, không đụng DOM.
   --------------------------------------------------------------- */

const MINUS = /[−–]/g;

/**
 * So hai chuỗi chữ số (mọi cơ số): bỏ khoảng trắng, không phân biệt hoa
 * thường, bỏ số 0 đệm ở đầu (trừ khi toàn 0), chấp nhận dấu trừ Unicode.
 */
export function sameDigits(given, expected) {
  const norm = s => {
    let t = String(s).trim().toUpperCase().replace(MINUS, '-').replace(/\s+/g, '');
    let sign = '';
    if (t.startsWith('-')) { sign = '-'; t = t.slice(1); }
    t = t.replace(/^0+(?=.)/, '');
    return sign + t;
  };
  return norm(given) === norm(expected);
}

/** So chuỗi bit giữ nguyên độ dài (mã BCD, Gray, parity…): chỉ bỏ khoảng trắng. */
export function sameBits(given, expected) {
  const norm = s => String(s).replace(/[\s_]/g, '');
  return norm(given) === norm(expected);
}

/**
 * Đọc một danh sách số nguyên: "1, 3, 5", "{1 3 5}", "m1 m3", "Σm(1,3)", "∅".
 * Trả mảng đã sắp xếp, bỏ trùng; chuỗi có ký tự lạ thì trả null.
 */
export function parseIntSet(text) {
  let t = String(text ?? '').trim();
  if (/^(∅|\{\s*\}|rỗng|empty|none)$/i.test(t)) return [];
  t = t.replace(/^(Σ\s*m|Π\s*M|sum|m|M)\s*/i, '').replace(/[{}()[\]]/g, ' ').replace(/\b[mM](?=\d)/g, '');
  const parts = t.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (!parts.every(p => /^-?\d+$/.test(p))) return null;
  return [...new Set(parts.map(Number))].sort((a, b) => a - b);
}

/** Hai tập số nguyên (mảng) bằng nhau không, không kể thứ tự. */
export function sameSet(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const x = [...a].sort((p, q) => p - q), y = [...b].sort((p, q) => p - q);
  return x.every((v, i) => v === y[i]);
}

/** Đọc một số: "12", "−3", "2.5", "2/3". Không đọc được thì trả null. */
export function parseNumber(text) {
  const t = String(text ?? '').trim().replace(MINUS, '-').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = t.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m && Number(m[2]) !== 0) return Number(m[1]) / Number(m[2]);
  return null;
}

/** Danh sách số: thiếu gì / thừa gì so với đáp án (đã sắp xếp). */
export function setDiff(given, expected) {
  const has = new Set(given);
  const want = new Set(expected);
  return { missing: expected.filter(v => !has.has(v)).sort((a, b) => a - b), extra: given.filter(v => !want.has(v)).sort((a, b) => a - b) };
}

/** Lời nhắn "thiếu … / thừa …" cho câu trả lời dạng tập số; khoá nằm trong từ điển chung (run.d*). */
export function setNote(given, expected) {
  const { missing, extra } = setDiff(given, expected);
  const list = a => a.join(', ');
  if (missing.length && extra.length) return { detailKey: 'run.dBoth', detailParams: { missing: list(missing), extra: list(extra) } };
  if (missing.length) return { detailKey: 'run.dMissing', detailParams: { missing: list(missing) } };
  if (extra.length) return { detailKey: 'run.dExtra', detailParams: { extra: list(extra) } };
  return null;
}
