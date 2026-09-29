/* ---------------------------------------------------------------
   CÂU KHÁI NIỆM (D27) — trắc nghiệm "vì sao / chỗ hay sai / áp dụng / so sánh"
   do Gemini soạn theo lô (scripts/gen/), Huy duyệt từng câu, rồi mới vào app.
   Bộ sinh đề tự động lo câu TÍNH TOÁN (đúng tuyệt đối); câu khái niệm lo phần
   HIỂU mà bộ sinh không tạo được. Thuần: dùng cho cả pipeline (Node) lẫn app.

   Một câu (lưu ở <app>/src/content/concepts.json, chỉ câu đã duyệt):
   { id: 'l1-007', chapter: 'ch1', section: '1.5', type: 'why'|'trap'|'apply'|'compare',
     answer: 0..3,
     vi: { q, options: [4], why: [4], explain },   // why[i]: vì sao phương án i đúng / sai
     en: { q, options: [4], why: [4], explain },
     check?: { type, … },     // phép tính máy kiểm lại được (xem <app>/src/logic/concept-check.js)
     source, approved? }
   --------------------------------------------------------------- */

export const TYPES = ['why', 'trap', 'apply', 'compare'];
export const KIND = 'concept';
const VI_CHARS = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const LIMITS = { q: 70, option: 30, why: 45, explain: 70 };      // số chữ tối đa — "chữ trên màn hình ngắn"
const BANNED = /(all|none) of the above|cả (a|b|c|d|ba|bốn) (đều )?(đúng|sai)|tất cả (đều )?(đúng|sai)|không (câu|phương án) nào/i;

const words = s => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;
const norm = s => String(s ?? '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}′']+/gu, ' ').trim();

/**
 * Kiểm một câu. `verify(check)` → { ok, reason? } của môn (bỏ trống ⇒ câu có `check` bị loại vì
 * không kiểm được). `sections`: các mục hợp lệ của chương, vd { ch1: ['1.2', …] }.
 * @returns {string[]} danh sách lỗi (rỗng = hợp lệ)
 */
export function validateItem(item, { sections, verify } = {}) {
  const err = [];
  if (!item || typeof item !== 'object') return ['không phải object'];
  if (!/^[a-z]+\d*-[\w-]+$/.test(item.id ?? '')) err.push('id sai dạng');
  if (sections && !sections[item.chapter]) err.push(`chương lạ: ${item.chapter}`);
  if (sections?.[item.chapter] && !sections[item.chapter].includes(item.section)) err.push(`mục lạ: ${item.section}`);
  if (!TYPES.includes(item.type)) err.push(`loại lạ: ${item.type}`);
  if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) err.push('answer phải là 0..3');
  for (const lang of ['vi', 'en']) {
    const L = item[lang];
    if (!L) { err.push(`thiếu bản ${lang}`); continue; }
    if (!Array.isArray(L.options) || L.options.length !== 4) { err.push(`${lang}: cần đúng 4 phương án`); continue; }
    if (!Array.isArray(L.why) || L.why.length !== 4) err.push(`${lang}: cần 4 dòng why`);
    const texts = { q: [L.q], option: L.options, why: L.why ?? [], explain: [L.explain] };
    for (const [part, list] of Object.entries(texts)) {
      list.forEach((s, i) => {
        if (!String(s ?? '').trim()) err.push(`${lang}.${part}[${i}] trống`);
        else if (words(s) > LIMITS[part]) err.push(`${lang}.${part}[${i}] dài ${words(s)} chữ (tối đa ${LIMITS[part]})`);
        if (/[{}<>]/.test(s ?? '')) err.push(`${lang}.${part}[${i}] có ký tự { } < > (dùng ngoặc tròn)`);
        if (lang === 'en' && VI_CHARS.test(s ?? '')) err.push(`en.${part}[${i}] còn dấu tiếng Việt`);
      });
    }
    if (new Set(L.options.map(norm)).size !== 4) err.push(`${lang}: có phương án trùng nhau`);
    if (L.options.some(o => BANNED.test(o))) err.push(`${lang}: có phương án kiểu "tất cả đều đúng"`);
    // phương án đúng dài hơn hẳn các phương án khác ⇒ đoán mò theo độ dài cũng trúng
    const len = L.options.map(words), longestWrong = Math.max(...len.filter((_, i) => i !== item.answer));
    if (len[item.answer] > longestWrong + 2) err.push(`${lang}: phương án đúng dài hơn hẳn (${len[item.answer]} chữ, nhiễu dài nhất ${longestWrong})`);
  }
  if (item.check) {
    const r = verify ? verify(item.check) : { ok: false, reason: 'môn này chưa có bộ kiểm phép tính' };
    if (!r.ok) err.push(`check sai: ${r.reason ?? JSON.stringify(item.check)}`);
  }
  return err;
}

/** Hai câu trùng ý: tập từ của đề (bản EN) giống nhau ≥ 80% (Jaccard). */
export function isDuplicate(item, others) {
  const set = s => new Set(norm(s).split(' ').filter(w => w.length > 2));
  const a = set(item.en?.q);
  return others.some(o => {
    if (o.id === item.id) return false;
    const b = set(o.en?.q);
    const inter = [...a].filter(w => b.has(w)).length;
    return inter / (a.size + b.size - inter || 1) >= 0.8;
  });
}

/**
 * Chữ từ Gemini vào từ điển (hiện bằng innerHTML): thoát HTML, `x` → phông mono,
 * dấu bù x' / (x + y)' → x′ như sách (không đụng "don't", "2's").
 */
export function escapeText(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    .replace(/(\b[a-zA-Z]|\))'/g, '$1′')
    .replace(/`([^`]+)`/g, '<span class="mono">$1</span>');
}

const keyOf = (id, part) => `cq.${id.replace(/[^\w]/g, '_')}_${part}`;   // một dấu chấm ⇒ tp() dịch được khi làm tham số

/** Từ điển VI/EN cho các câu đã duyệt: cùng tập khoá ở hai bản (test i18n canh). */
export function conceptDicts(items) {
  const out = { vi: {}, en: {} };
  for (const it of items) {
    for (const lang of ['vi', 'en']) {
      const L = it[lang], D = out[lang];
      D[keyOf(it.id, 'q')] = escapeText(L.q);
      D[keyOf(it.id, 'x')] = escapeText(L.explain);
      L.options.forEach((o, i) => { D[keyOf(it.id, 'a' + i)] = escapeText(o); D[keyOf(it.id, 'w' + i)] = escapeText(L.why[i]); });
    }
  }
  return out;
}

/** Một câu khái niệm theo hợp đồng bộ chạy (runner.js): phương án xáo theo rnd. */
export function conceptQuestion(item, rnd) {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return {
    kind: KIND, format: 'choice', layout: 'rows',          // phương án là câu dài ⇒ mỗi phương án một dòng
    textKey: keyOf(item.id, 'q'),
    choices: order.map(i => keyOf(item.id, 'a' + i)),
    answer: order.indexOf(item.answer),
    explainKey: keyOf(item.id, 'x'),
    // lời giải: vì sao từng phương án sai (phương án đúng đã có explainKey)
    work: order.flatMap((i, k) => (i === item.answer ? [] : [{ key: 'cq.whyWrong', params: { opt: k + 1, why: keyOf(item.id, 'w' + i) } }])),
    meta: { id: item.id },                                   // không để thứ tự xáo vào meta: cùng câu xáo lại vẫn là lặp
    order,
    whyKeys: order.map(i => keyOf(item.id, 'w' + i)),
  };
}

/**
 * Gói ngân hàng câu của một chương thêm dạng 'concept' (chỉ khi chương có câu đã duyệt) —
 * không đụng file ngân hàng gốc, nên test 200 hạt giống của các dạng tính toán giữ nguyên.
 */
export function withConcepts(bank, items, seconds = 50) {
  if (!items?.length) return bank;
  return {
    ...bank,
    KINDS: [...bank.KINDS, KIND],
    SECONDS: { ...bank.SECONDS, [KIND]: seconds },
    makeQuestion(kind, rnd) {
      if (kind !== KIND) return bank.makeQuestion(kind, rnd);
      return conceptQuestion(items[Math.floor(rnd() * items.length)], rnd);
    },
    checkAnswer(q, given) {
      if (q.kind !== KIND) return bank.checkAnswer(q, given);
      const i = Number(given);
      if (i === q.answer) return { ok: true };
      // chọn sai: nói luôn vì sao phương án đó sai
      return { ok: false, ...(q.whyKeys[i] && { detailKey: q.whyKeys[i] }) };
    },
  };
}
