/* Hình kèm đề dùng chung cho bộ chạy luyện tập (shared/ui/runner.js). */

/**
 * Bảng chân trị nhỏ: { vars: ['x','y'], out: 'F', rows: [[0,0,1], …] }
 * (mỗi hàng: giá trị các biến rồi tới giá trị đầu ra).
 */
export function truthFigure({ vars, out, rows }) {
  const t = document.createElement('table');
  t.className = 'fig-truth';
  const head = [...vars.map(v => `<th>${v}</th>`), `<th class="out">${out}</th>`].join('');
  const body = rows.map(r => `<tr>${r.map((v, i) => `<td${i === r.length - 1 ? ' class="out"' : ''}>${v}</td>`).join('')}</tr>`).join('');
  t.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  return t;
}
