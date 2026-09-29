/* ---------------------------------------------------------------
   TÁCH BÀI HỌC MARKDOWN THÀNH THẺ — thuần, test được bằng Node.
   Quy ước file theory-chN.{vi,en}.md:
     # Tiêu đề chương          (bỏ — topbar đã có tên chương)
     *một dòng nguồn*          (phần mở đầu, hiện nhỏ phía trên thẻ)
     ## Tiêu đề thẻ            (mỗi mục ## là MỘT thẻ, một ý)
     …nội dung ngắn…
     <details><summary>…</summary> phần dài, mở khi cần </details>
     <div data-check="c1q:convert"></div>   (câu hỏi nhanh trong thẻ)
   --------------------------------------------------------------- */

/** @returns {{ intro: string, cards: { title: string, body: string }[] }} */
export function splitCards(md) {
  const intro = [];
  const cards = [];
  for (const line of String(md).split('\n')) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      cards.push({ title: h2[1].replace(/^\d+\.\s*/, '').trim(), body: [] });
    } else if (cards.length) {
      cards.at(-1).body.push(line);
    } else if (!/^#\s/.test(line)) {
      intro.push(line);
    }
  }
  return {
    intro: intro.join('\n').trim(),
    cards: cards.map(c => ({ title: c.title, body: c.body.join('\n').trim() })),
  };
}

/**
 * Số chữ ĐỌC NGAY trên thẻ: bỏ phần gập <details>, khối code, bảng, thẻ HTML
 * và ký hiệu Markdown. Dùng cho test "mỗi thẻ ngắn" — chặn bài học phình lại.
 */
export function visibleWords(body) {
  const text = String(body)
    .replace(/<details[\s\S]*?<\/details>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n').filter(l => !/^\s*\|/.test(l)).join('\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`[^`]*`/g, ' x ')
    .replace(/[#>*_[\]()|-]/g, ' ');
  return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * Dạng câu → thẻ dạy dạng đó (thẻ ĐẦU TIÊN có `data-check="p:k"` hoặc `data-also="p:k …"`).
 * Câu hỏi nhanh trong thẻ vốn đã là mối nối "dạng ↔ khái niệm", nên không cần bảng riêng:
 * làm sai dạng nào thì mở đúng thẻ đó để ôn (thẻ có sẵn câu thử của chính dạng ấy).
 * @returns {Map<string, number>} 'c3q:sop' → chỉ số thẻ
 */
export function kindCards(md) {
  const out = new Map();
  splitCards(md).cards.forEach((c, i) => {
    for (const m of c.body.matchAll(/data-(?:check|also)="([^"]+)"/g)) {
      for (const k of m[1].split(/\s+/)) if (!out.has(k)) out.set(k, i);   // k = 'p:kind' hoặc 'p:kind:nhãn'
    }
  });
  return out;
}

/**
 * Các thẻ <div data-check="…" data-needs="…"> trong một thẻ bài học (thứ tự thuộc tính tuỳ ý).
 * @returns {{ check: string[], needs: string[] }[]}
 */
export function pointTags(body) {
  const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '').split(/\s+/).filter(Boolean);
  return [...String(body).matchAll(/<div\b[^>]*\bdata-check="[^"]*"[^>]*>/g)]
    .map(m => ({ check: attr(m[0], 'data-check'), needs: attr(m[0], 'data-needs') }));
}
