/* ---------------------------------------------------------------
   NHÓM DẠNG CÂU (D30) — thuần. Luyện tập hiện theo nhóm chủ đề (4 dòng thay 10),
   bấm một nhóm là luyện trộn các dạng trong nhóm; từng dạng vẫn chọn được.
   Ngân hàng khai báo GROUPS = [{ id: 'g-…', kinds }]; dạng không thuộc nhóm nào
   (vd 'concept' thêm bởi withConcepts, hoặc ngân hàng chưa có GROUPS) thành nhóm riêng.
   --------------------------------------------------------------- */

/** @returns {{ id: string, kinds: string[], single: boolean }[]} theo thứ tự GROUPS, dạng lẻ ở cuối */
export function groupsOf(bank) {
  const kinds = bank.KINDS ?? [];
  const groups = (bank.GROUPS ?? [])
    .map(g => ({ id: g.id, kinds: g.kinds.filter(k => kinds.includes(k)), single: false }))
    .filter(g => g.kinds.length);
  const grouped = new Set(groups.flatMap(g => g.kinds));
  return [...groups, ...kinds.filter(k => !grouped.has(k)).map(k => ({ id: k, kinds: [k], single: true }))];
}

/** Địa chỉ #/practice/chN/<x>: x là id nhóm hoặc tên một dạng ⇒ các dạng cần luyện (null = cả chương). */
export function kindsFor(bank, x) {
  if (!x) return null;
  const g = groupsOf(bank).find(gr => gr.id === x);
  if (g) return { group: g.single ? null : g, kinds: g.kinds };
  return bank.KINDS.includes(x) ? { group: groupsOf(bank).find(gr => gr.kinds.includes(x)) ?? null, kinds: [x] } : null;
}
