/* Tiện ích DOM dùng chung cho mọi trang. */

export const $ = sel => document.querySelector(sel);

export const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

/* Màu dùng nhất quán cho vector khắp các chương: v (xanh), w (vàng),
   kết quả (xanh lá), phụ trợ (xám). Lấy từ biến CSS để tự đổi theo light/dark. */
export const COLORS = ['--accent', '--warn', '--ok', '--ink-dim', '--bad'];

/** Đọc một biến CSS đang có hiệu lực (theo light/dark mode hiện tại). */
export const cssVar = name =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';

/**
 * Dựng bảng đọc số <dl class="readout"> từ danh sách [nhãn, giá trị, lớp css].
 * Dùng chung cho mọi bảng vẽ nên chỗ nào cũng hiện số theo một kiểu.
 */
export function renderReadout(host, rows) {
  host.innerHTML = '';
  for (const [label, value, cls] of rows) {
    host.appendChild(el('dt', null, label));
    host.appendChild(el('dd', cls || null, String(value)));
  }
}
