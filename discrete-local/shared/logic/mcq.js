import { shuffle } from './shuffle.js';

/* ---------------------------------------------------------------
   ĐỀ TRẮC NGHIỆM TỪ ĐỀ TỰ LUẬN — thuần, dùng chung.
   Mục tiêu: khó NGANG đề tự luận. Vì vậy phương án nhiễu không phải số bừa mà là
   những đáp án SAI THẬT SỰ hay gặp (quên +1, đọc số dư từ trên xuống, nhầm dạng
   biểu diễn, bỏ một nhóm trên K-map…) do từng chương liệt kê (wrongOf).
   Mỗi phương án nhiễu phải được CHÍNH bộ chấm của câu tự luận xác nhận là sai
   (oracle) — nên không bao giờ có hai đáp án cùng đúng; chọn sai thì vẫn nhận được
   lời chẩn đoán như khi tự gõ đáp án đó.
   --------------------------------------------------------------- */

const norm = s => String(s).replace(/[\s_]/g, '').toUpperCase();

/** Nhiễu dự phòng theo hình dạng đáp án, khi danh sách sai thật không đủ. */
export function perturb(correct) {
  const s = String(correct).trim();
  const out = [];
  if (/^[01 ]+$/.test(s)) {                                    // dãy bit: đổi từng bit
    const at = [...s].flatMap((c, i) => (c === ' ' ? [] : [i]));
    for (const i of at) out.push(s.slice(0, i) + (s[i] === '0' ? '1' : '0') + s.slice(i + 1));
  } else if (/^-?\d+$/.test(s)) {                              // số nguyên
    const v = Number(s);
    out.push(v + 1, v - 1, v + 2, v - 2, -v, v + 10, v - 10);
    if (v >= 0) return out.filter(x => x >= 0).map(String);   // đếm (PI, minterm…) không âm
  } else if (/^[Σ∑Π]\s*[mM]?\(.*\)$/.test(s)) {                // Σm(1, 3) / ΠM(0, 2)
    const head = s.slice(0, s.indexOf('(') + 1);
    const nums = (s.match(/\d+/g) || []).map(Number);
    const max = Math.max(...nums, 7);
    const fmt = a => `${head}${[...new Set(a)].sort((p, q) => p - q).join(', ')})`;
    nums.forEach((v, i) => { out.push(fmt(nums.filter((_, j) => j !== i))); out.push(fmt(nums.map((x, j) => (j === i ? (x + 1) % (max + 1) : x)))); });
    for (let v = 0; v <= max; v++) if (!nums.includes(v)) out.push(fmt([...nums, v]));
  } else if (/^[0-9A-Fa-f.]+$/.test(s)) {                      // chuỗi chữ số (mọi cơ số ≤ 16)
    const D = '0123456789ABCDEF';
    const top = Math.max(...[...s.toUpperCase()].map(c => D.indexOf(c)));
    [...s].forEach((c, i) => {
      if (c === '.') return;
      const d = D.indexOf(c.toUpperCase());
      for (const e of [d + 1, d - 1]) if (e >= 0 && e <= Math.max(top, 9)) out.push(s.slice(0, i) + D[e] + s.slice(i + 1));
    });
  }
  return out.map(String);
}

/**
 * Dựng câu trắc nghiệm 4 phương án từ câu tự luận q.
 * @param {object} q          câu tự luận (đã có đáp án đúng)
 * @param {{correct:string, candidates:string[], extra?:object}} w   đáp án đúng ở dạng chuỗi + nhiễu THẬT (xếp theo độ hay gặp)
 * @param {(raw:string)=>{ok?:boolean, retry?:boolean}} check  chấm câu tự luận (oracle)
 * @param {() => number} rnd
 * @param {Record<string,string>} textKeys  khoá đề khác cho bản trắc nghiệm (đề tự luận nói "khoanh", "điền"…)
 * @returns {object|null} null nếu không đủ 3 nhiễu hợp lệ
 */
export function toChoice(q, w, check, rnd, textKeys = {}) {
  const seen = new Set([norm(w.correct)]);
  const wrong = [];
  for (const c of [...w.candidates, ...perturb(w.correct)]) {
    const s = String(c).trim();
    if (!s || seen.has(norm(s))) continue;
    const r = check(s);
    if (r.ok === true || r.retry) continue;                    // đúng, hoặc không đọc được ⇒ không dùng
    seen.add(norm(s));
    wrong.push(s);
    // 3 nhiễu đầu là các lỗi hay gặp nhất; nhiễu dự phòng chỉ dùng khi thiếu
    if (wrong.length === 3) break;
  }
  if (wrong.length < 3) return null;
  const choices = shuffle([w.correct, ...wrong], rnd);
  return {
    ...q, format: 'choice', choices, answer: choices.indexOf(w.correct), answerText: w.correct,
    input: undefined, textKey: textKeys[q.textKey] ?? q.textKey,
    formatKey: 'run.fChoice', formatParams: { n: choices.length }, mcq: true, orig: q, ...w.extra,
  };
}

/**
 * Bọc ngân hàng câu tự luận thành ngân hàng trắc nghiệm (cùng KINDS, SECONDS).
 * wrongOf(q, rnd) → { correct, candidates } | null (dạng đó không làm trắc nghiệm được → giữ nguyên câu).
 */
export function mcqBank(bank, { wrongOf, textKeys = {}, tries = 25 }) {
  return {
    KINDS: bank.KINDS, SECONDS: bank.SECONDS, mcq: true,     // mcq: mã câu thêm "-tn" (hub D33)
    makeQuestion(kind, rnd = Math.random) {
      let q;
      for (let i = 0; i < tries; i++) {
        q = bank.makeQuestion(kind, rnd);
        if (q.format === 'choice') return q;                   // đã là trắc nghiệm (nhận diện cổng)
        if (q.needsInput) continue;                            // câu bắt buộc thao tác trên hình (bấm ô K-map) — thử câu khác
        const w = wrongOf(q, rnd);
        const c = w && toChoice(q, w, raw => bank.checkAnswer(q, raw), rnd, textKeys);
        if (c) return c;
      }
      return q;
    },
    checkAnswer(q, given) {
      if (!q.mcq) return bank.checkAnswer(q, given);
      if (Number(given) === q.answer) return { ok: true };
      const r = bank.checkAnswer(q.orig, q.choices[Number(given)]);   // vẫn chẩn đoán lỗi của phương án đã chọn
      return { ok: false, detailKey: r.detailKey, detailParams: r.detailParams };
    },
  };
}
