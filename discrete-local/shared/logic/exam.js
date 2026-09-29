import { seededRandom, shuffle } from './shuffle.js';
import { signature, seededQuestion } from './question-pool.js';

/* ---------------------------------------------------------------
   BÀI FULL 60–90 PHÚT (Phase 2) — hàm thuần, không đụng DOM.
   Đề chỉ lưu { seed, chapters, minutes }: dựng lại từ hạt giống nên F5
   giữa bài vẫn ra đúng đề cũ (mọi makeQuestion chỉ được dùng `rnd`).
   chapters: [{ id, prefix, weight?, bank: { KINDS, SECONDS, makeQuestion, checkAnswer } }]
   weight = số tuần học chương đó theo syllabus: chương học 2 tuần chiếm gấp đôi thời gian.
   --------------------------------------------------------------- */

export const EXAM_MINUTES = [60, 75, 90];
/** Chỉ lấp 85% thời gian chuẩn: chừa ~10 phút soát bài, và người mới làm chậm hơn chuẩn. */
export const FILL = 0.85;
/** Dạng dưới 40 giây là câu nhận diện nhanh (khởi động) — đề thật không có, bài full bỏ qua. */
export const MIN_SECONDS = 40;
/** Trần số câu một dạng trong một đề: quá thì đề toàn câu cùng khuôn đổi số (Huy thử đề Discrete 2026-09-26: 16/67 câu
 *  là tổng dãy). Câu khái niệm mỗi câu một ý khác nhau nên trần cao hơn. Hết dạng thì đề ngắn hơn thời gian, không lặp. */
export const maxPerKind = kind => (kind === 'concept' ? 6 : 3);

/** Các dạng đưa vào bài full của một chương (chương chỉ có dạng ngắn thì lấy hết). */
export function examKinds({ KINDS, SECONDS }) {
  const long = KINDS.filter(k => (SECONDS?.[k] ?? 60) >= MIN_SECONDS);
  return long.length ? long : KINDS;
}

/**
 * Chọn dạng câu: mỗi lần thêm một câu cho chương đang ít thời gian nhất so với trọng số
 * (thời gian chia theo tuần học dù dạng chương này ngắn, chương kia dài); trong một chương đi hết các dạng theo
 * thứ tự đã xáo rồi mới lặp. Tổng thời gian chuẩn ≤ minutes · FILL.
 * Thứ tự câu XÁO TRỘN (Huy, 2026-09-25: thích đề trộn hơn đề xếp theo bài giảng — phải tự nhận ra dạng bài),
 * và không để hai câu cùng dạng đứng liền nhau khi còn cách.
 * @returns {{ci:number, kind:string}[]}
 */
export function planExam(chapters, minutes, rnd, mixed = true) {
  const budget = minutes * 60 * FILL;
  const queues = chapters.map(() => []);
  const spent = chapters.map(() => 0);
  const full = chapters.map(() => false);
  const slots = [];
  const count = {};
  let used = 0;
  for (;;) {
    let i = -1;
    const load = j => spent[j] / (chapters[j].weight ?? 1);
    spent.forEach((_, j) => { if (!full[j] && (i < 0 || load(j) < load(i))) i = j; });
    if (i < 0) break;
    const { SECONDS } = chapters[i].bank;
    if (!queues[i].length) queues[i] = shuffle(examKinds(chapters[i].bank).filter(k => (count[`${i}:${k}`] ?? 0) < maxPerKind(k)), rnd);
    if (!queues[i].length) { full[i] = true; continue; }
    const s = SECONDS?.[queues[i][0]] ?? 60;
    if (used + s > budget) { full[i] = true; continue; }
    const kind = queues[i].shift();
    count[`${i}:${kind}`] = (count[`${i}:${kind}`] ?? 0) + 1;
    slots.push({ ci: i, kind });
    spent[i] += s;
    used += s;
  }
  if (mixed) return spreadKinds(shuffle(slots, rnd));
  // bài tạo trước khi đổi sang đề trộn (không có st.order): giữ thứ tự cũ để đáp án đã lưu khớp đúng câu
  const order = s => s.ci * 1000 + chapters[s.ci].bank.KINDS.indexOf(s.kind);
  return slots.sort((a, b) => order(a) - order(b));
}

/**
 * Không để hai câu cùng dạng liền nhau: đi theo thứ tự đã xáo, mỗi bước lấy câu đầu tiên KHÁC dạng câu trước;
 * dạng nào còn quá nửa số câu còn lại thì phải đặt nó ngay (không thì cuối đề bị dồn). Hết cách thì chấp nhận liền nhau.
 */
export function spreadKinds(slots) {
  const kindOf = s => `${s.ci}:${s.kind}`;
  const left = [...slots], out = [];
  while (left.length) {
    const last = out.length ? kindOf(out.at(-1)) : null;
    const count = {};
    left.forEach(s => { count[kindOf(s)] = (count[kindOf(s)] ?? 0) + 1; });
    const [big, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    let i = big !== last && n * 2 > left.length ? left.findIndex(s => kindOf(s) === big) : left.findIndex(s => kindOf(s) !== last);
    if (i < 0) i = 0;
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}

/**
 * Dựng đề: mỗi câu một hạt giống con (câu i không phụ thuộc số câu trước nó về dạng), và không có
 * hai câu trùng chữ ký (question-pool.js) — trùng thì thử hạt giống kế tiếp, vẫn xác định nên F5 ra đúng đề cũ.
 */
export function buildExam(chapters, { seed, minutes, order }) {
  const seen = new Set();
  return planExam(chapters, minutes, seededRandom(seed), order === 'mixed').map((s, i) => {
    const c = chapters[s.ci];
    let q;
    for (let j = 0; j < 40; j++) {
      q = seededQuestion(c.bank, s.kind, seed + 7919 * (i + 1) + 104729 * j);     // hạt giống riêng từng câu ⇒ có mã câu
      if (!seen.has(signature(q))) break;
    }
    seen.add(signature(q));
    return { ch: c.id, prefix: c.prefix, bank: c.bank, q };
  });
}

export const isBlank = g => !String(g ?? '').trim();

/** Chấm một câu; đáp án không đọc được (retry) tính là sai khi đã nộp bài. */
export function gradeItem(item, given) {
  if (isBlank(given)) return { ok: false, blank: true };
  const r = item.bank.checkAnswer(item.q, given);
  return { ok: !r.retry && !!r.ok, blank: false, detailKey: r.detailKey, detailParams: r.detailParams };
}

/** Đếm đúng/tổng theo khoá (chương, dạng…), giữ thứ tự gặp đầu tiên. */
export function tally(items, results, keyOf) {
  const m = new Map();
  items.forEach((it, i) => {
    const k = keyOf(it);
    const v = m.get(k) ?? { key: k, item: it, ok: 0, n: 0 };
    v.n++;
    if (results[i].ok) v.ok++;
    m.set(k, v);
  });
  return [...m.values()];
}

/** Giây còn lại của bài thi thử (âm = hết giờ). */
export const secondsLeft = (exam, now) => exam.minutes * 60 - Math.floor((now - exam.startedAt) / 1000);

/** 75 → "01:15", 4000 → "66:40" (đồng hồ phút:giây). */
export const clock = s => {
  const t = Math.max(0, s);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
