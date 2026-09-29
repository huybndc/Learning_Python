/* ---------------------------------------------------------------
   ĐỒ THỊ TIÊN QUYẾT giữa các điểm kiến thức (D29) — thuần, test được bằng Node.
   Cây (môn → chương → thẻ → điểm) trả lời "nằm ở đâu"; đồ thị này trả lời
   "muốn hiểu điểm này phải nắm điểm nào trước". Một điểm có thể cần nhiều điểm
   (rút gọn SOP cần cả EPI lẫn gộp minterm) nên đây là DAG, không phải cây.

   Khai báo ngay trong bài học, cạnh điểm kiến thức (như [[link]] của Obsidian):
     <div data-check="c3q:sop" data-needs="c3q:epis c2q:simplify"></div>
   Cạnh đi từ điểm tới điểm nó CẦN. Test bắt: không chu trình, mọi điểm được cần đều có thật.
   --------------------------------------------------------------- */

import { splitCards, pointTags } from './cards.js';
import { parseKey, isPassed } from './knowledge.js';

/**
 * @param {{ ch: string, md: string }[]} lessons  bài học của mọi chương (cùng một ngôn ngữ)
 * @returns {Map<string, { key, needs: string[], ch, card: number, title }>}  thẻ ĐẦU TIÊN dạy điểm đó
 */
export function buildGraph(lessons) {
  const g = new Map();
  for (const { ch, md } of lessons) {
    splitCards(md).cards.forEach((c, card) => {
      for (const { check, needs } of pointTags(c.body)) {
        for (const key of check) {
          const node = g.get(key);
          if (!node) g.set(key, { key, needs: [...needs], ch, card, title: c.title });
          else for (const k of needs) if (!node.needs.includes(k)) node.needs.push(k);
        }
      }
    });
  }
  return g;
}

/** Cạnh trỏ tới điểm không có trong bài học: [[from, to]]. */
export function danglingNeeds(g) {
  return [...g.values()].flatMap(n => n.needs.filter(k => !g.has(k)).map(k => [n.key, k]));
}

/** Một chu trình nếu có (mảng khoá, điểm đầu lặp lại ở cuối), không thì null — DFS tô ba màu. */
export function findCycle(g) {
  const color = new Map();                 // undefined = trắng, 1 = đang đi, 2 = xong
  const stack = [];
  const visit = k => {
    color.set(k, 1);
    stack.push(k);
    for (const nxt of g.get(k)?.needs ?? []) {
      if (!g.has(nxt)) continue;
      if (color.get(nxt) === 1) return [...stack.slice(stack.indexOf(nxt)), nxt];
      if (!color.get(nxt)) { const c = visit(nxt); if (c) return c; }
    }
    stack.pop();
    color.set(k, 2);
    return null;
  };
  for (const k of g.keys()) if (!color.get(k)) { const c = visit(k); if (c) return c; }
  return null;
}

/**
 * Thứ tự học: điểm tiên quyết luôn đứng trước (sắp xếp tô-pô, Kahn). Hoà thì giữ thứ tự
 * xuất hiện trong bài học — nên kết quả đọc giống mục lục, chỉ đẩy lên những gì phải biết trước.
 */
export function topoOrder(g) {
  const keys = [...g.keys()];
  const indeg = new Map(keys.map(k => [k, g.get(k).needs.filter(x => g.has(x)).length]));
  const out = [];
  const ready = keys.filter(k => indeg.get(k) === 0);
  while (ready.length) {
    const k = ready.shift();
    out.push(k);
    for (const m of keys) {
      if (!g.get(m).needs.includes(k)) continue;
      indeg.set(m, indeg.get(m) - 1);
      if (indeg.get(m) !== 0) continue;
      const at = ready.findIndex(r => keys.indexOf(r) > keys.indexOf(m));   // giữ thứ tự trong bài học
      if (at < 0) ready.push(m); else ready.splice(at, 0, m);
    }
  }
  return out;                               // thiếu phần tử ⇔ có chu trình (test canh bằng findCycle)
}

/** Tổ tiên theo từng lớp: [[cần trực tiếp], [cần của cần], …] — lớp gần đứng trước. */
export function prereqLayers(g, key) {
  const seen = new Set([key]);
  const layers = [];
  let cur = [key];
  while (cur.length) {
    const next = [];
    for (const k of cur) for (const n of g.get(k)?.needs ?? []) if (!seen.has(n) && g.has(n)) { seen.add(n); next.push(n); }
    if (next.length) layers.push(next);
    cur = next;
  }
  return layers;
}

/** Tỉ lệ đúng của một điểm trên tối đa `last` câu gần nhất (null = chưa làm). */
export function pointAccuracy(events, key, last = 10) {
  const { prefix, kind, tag } = parseKey(key);
  const mine = events.filter(e => e.prefix === prefix && e.kind === kind && (!tag || e.tag === tag)).slice(-last);
  return mine.length ? { acc: mine.filter(e => e.ok).length / mine.length, n: mine.length } : null;
}

/**
 * Gốc có thể của một lỗi, trong các điểm tiên quyết (mọi tầng):
 *   1. có BẰNG CHỨNG yếu — đã làm, chưa nắm, đúng dưới 60%: lấy điểm gần nhất (cùng tầng: đúng ít nhất);
 *   2. không có ⇒ điểm tiên quyết gần nhất CHƯA làm câu nào (có thể bỏ qua khi học);
 *   3. còn lại ⇒ null (tiên quyết đều ổn: lỗi nằm ở chính dạng này).
 * Bằng chứng đứng trước "chưa làm": sai 2/3 câu ô K-map đáng nghi hơn một điểm chưa đụng tới.
 * @returns {{ key, acc: number|null } | null}
 */
export function weakestPrereq(g, key, events) {
  const layers = prereqLayers(g, key).map(layer => layer.map(k => ({ key: k, s: pointAccuracy(events, k) })));
  for (const layer of layers) {
    const weak = layer.filter(({ key: k, s }) => s && !isPassed(events, k) && s.acc < 0.6).sort((a, b) => a.s.acc - b.s.acc);
    if (weak.length) return { key: weak[0].key, acc: weak[0].s.acc };
  }
  for (const layer of layers) {
    const fresh = layer.find(x => !x.s);
    if (fresh) return { key: fresh.key, acc: null };
  }
  return null;
}

/** Điểm nên học tiếp: đầu tiên theo thứ tự tô-pô mà chưa nắm và mọi điểm cần đã nắm. */
export function nextPoint(g, events) {
  return topoOrder(g).find(k => !isPassed(events, k) && g.get(k).needs.every(n => !g.has(n) || isPassed(events, n))) ?? null;
}
