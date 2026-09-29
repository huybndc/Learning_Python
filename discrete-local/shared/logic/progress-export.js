/* ---------------------------------------------------------------
   XUẤT TIẾN ĐỘ cho "nguồn tiến độ chung" (~/study-progress/*.json, schema study-progress/1).
   Thuần: nhận nhật ký sự kiện {ts,prefix,kind,ok,mode,tag?}, trả các mục theo (chương, dạng câu).
   Chỉ mục ĐÃ LÀM mới xuất hiện — vắng mặt nghĩa là chưa thử.
   --------------------------------------------------------------- */

const RECENT = 5;

/** weak: sai nhiều · strong: chắc · few: chưa đủ câu kết luận · ok: còn lại. */
export function statusOf(attempts, accuracy) {
  if (attempts < 3) return 'few';
  if (accuracy < 0.6) return 'weak';
  return attempts >= 5 && accuracy >= 0.85 ? 'strong' : 'ok';
}

/**
 * @param {string} subject  logic | linalg | discrete
 * @param {object[]} events
 * @param {(prefix:string, kind:string)=>string} labelOf tên hiển thị của dạng câu
 */
export function buildItems(subject, events, labelOf = (p, k) => `${p}.${k}`) {
  const groups = new Map();
  for (const e of [...events].sort((a, b) => a.ts - b.ts)) {
    const id = `${e.prefix}.${e.kind}`;
    const g = groups.get(id) ?? { prefix: e.prefix, kind: e.kind, attempts: 0, correct: 0, lastTs: 0, recent: [], wrongTags: {} };
    g.attempts++;
    if (e.ok) g.correct++;
    else if (e.tag) g.wrongTags[e.tag] = (g.wrongTags[e.tag] ?? 0) + 1;
    g.lastTs = e.ts;
    g.recent = [...g.recent, e.ok ? 1 : 0].slice(-RECENT);
    groups.set(id, g);
  }
  return [...groups].map(([topic, g]) => {
    const accuracy = Math.round((g.correct / g.attempts) * 100) / 100;
    const status = statusOf(g.attempts, accuracy);
    const lastThreeWrong = g.recent.length >= 3 && g.recent.slice(-3).every(x => !x);
    return {
      subject, topic, label: labelOf(g.prefix, g.kind),
      attempts: g.attempts, correct: g.correct, accuracy,
      lastTs: g.lastTs, recent: g.recent, status,
      stuck: status === 'weak' || lastThreeWrong,
      ...(Object.keys(g.wrongTags).length && { wrongTags: g.wrongTags }),
    };
  });
}

/** Gộp mục của một môn vào file math.json cũ: thay toàn bộ mục của môn đó, giữ môn khác. */
export function mergeSubject(doc, subject, items, now = Date.now()) {
  const kept = (doc?.items ?? []).filter(i => i.subject !== subject);
  return {
    schema: 'study-progress/1', app: 'math',
    exportedAt: new Date(now).toISOString(),
    items: [...kept, ...items],
  };
}
