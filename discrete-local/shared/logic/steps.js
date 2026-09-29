/* ---------------------------------------------------------------
   MỘT DÒNG LỜI GIẢI TỪNG BƯỚC (q.work — D23), dùng chung cho mọi chương của mọi môn:
     'chuỗi toán'           dòng tính thuần
     line(key, params)      một câu giải thích (khoá từ điển)
     line(key, params, m)   câu dẫn + phép tính theo sau
   shared/ui/question.js explainBlock / stepLine in ra.
   --------------------------------------------------------------- */

export const line = (key, params = {}, m) => (m === undefined ? { key, params } : { key, params, m });

/**
 * Dòng lời giải kèm BẢNG để người học tự dò từng ô: câu dẫn (khoá) + { head, rows, vars, outs, mark }.
 * vars = số cột đầu vào (có vạch ngăn sau), outs = cột kết quả (tô đậm), mark = dòng sai / khác nhau (tô đỏ),
 * pick = dòng được chọn, vd minterm (tô màu nhấn).
 */
export const tableLine = (key, params, table) => ({ key, params, table });

/**
 * Tách một dòng toán thành chữ và ma trận để vẽ ma trận dạng lưới: '[1 2; 3 4]' (≥ 2 hàng, ngăn bằng ';')
 * và ma trận mở rộng '[1 2 | 5; 3 4 | 6]'. Hàng lệch số ô thì giữ nguyên là chữ.
 * @returns {(string | { rows: string[][], bar: number })[]}  bar = chỉ số cột ngay sau '|', -1 nếu không có
 */
export function splitMatrices(s) {
  const out = [];
  let at = 0;
  for (const m of s.matchAll(/\[[^[\]]*;[^[\]]*\]/g)) {
    const raw = m[0].slice(1, -1).split(';').map(r => r.trim().split(/\s+/));
    const bar = raw[0].indexOf('|');
    const rows = raw.map(r => r.filter(x => x !== '|'));
    if (!raw.every(r => r.indexOf('|') === bar) || !rows.every(r => r.length === rows[0].length && r[0] !== '')) continue;
    if (m.index > at) out.push(s.slice(at, m.index));
    out.push({ rows, bar });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push(s.slice(at));
  return out;
}
