import { onLangChange, t as T } from '../i18n/index.js';
import { LIMITS, VARS, clamp, setVars, pasteBlock, loadTable, kmapLayout, loadKmap, clickCell } from '../logic/scratch-table.js';

/* ---------------------------------------------------------------
   NGĂN "BẢNG" VÀ "BÌA K" CỦA NHÁP (D45). Nguyên tắc: làm hộ phần CHÉP TAY, không làm hộ bước đang bị kiểm tra.
   - Bảng: chọn số biến ⇒ 2^n hàng, cột biến điền sẵn tổ hợp (việc chép); cột F và cột trung gian người học tự tính.
     Sửa như bảng tính (D49): mũi tên/Enter/Tab đi giữa ô, kéo chuột hoặc Shift+mũi tên chọn vùng, Delete xoá vùng,
     ⌘C chép vùng, dán khối từ Excel/Sheets. Chữ ở ô bị ẩn khi thu nhỏ vẫn giữ.
   - Bìa K (chỉ Logic): khung trống có nhãn Gray + số minterm; bấm ô ⇒ 1 → 0 → X → trống; cầm bút màu ⇒ bấm ô để
     tô nhóm. Không tự điền từ bảng, không tự khoanh nhóm.
   Lưu theo môn trong localStorage (scratch-table:<môn>, scratch-kmap:<môn>).
   --------------------------------------------------------------- */

const PENS = 4;                                       // số màu nhóm — bìa 4 biến hiếm khi cần hơn 4 nhóm

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* đầy/riêng tư */ } };

/** Ngăn Bảng chân trị: vẽ vào `host`. */
export function mountTable(host, subject) {
  const key = 'scratch-table:' + subject;
  let st = loadTable(read(key), subject);
  const save = () => write(key, st);
  const bar = el('div', 'grid-bar'), wrap = el('div', 'grid-wrap');
  host.append(bar, wrap);

  const num = (which, onSet) => {
    const label = el('label', 'grid-num');
    const input = el('input');
    Object.assign(input, { type: 'number', min: LIMITS[which][0], max: LIMITS[which][1], value: st[which] });
    input.addEventListener('input', () => { if (input.value !== '') onSet(clamp(Number(input.value), LIMITS[which])); });
    label.append(el('span'), input);
    return label;
  };
  // vùng chọn: ô neo + ô đang đứng (như bảng tính)
  let anchor = null, head = null, dragging = false;
  const inRange = (r, c) => anchor && r >= Math.min(anchor.r, head.r) && r <= Math.max(anchor.r, head.r)
    && c >= Math.min(anchor.c, head.c) && c <= Math.max(anchor.c, head.c);
  const multi = () => anchor && (anchor.r !== head.r || anchor.c !== head.c);
  const pos = input => ({ r: Number(input.dataset.r), c: Number(input.dataset.c) });
  const setCell = (r, c, v) => {
    const row = (st.cells[r] ??= []);
    for (let j = row.length; j < c; j++) row[j] = '';
    row[c] = v;
  };
  let table;
  addEventListener('mouseup', () => { dragging = false; });
  const at = (r, c) => table.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
  const paint = () => table.querySelectorAll('input').forEach(i => { const p = pos(i); i.classList.toggle('sel', !!multi() && inRange(p.r, p.c)); });
  const go = (r, c, extend) => {
    const next = at(Math.min(st.rows, Math.max(0, r)), Math.min(st.cols - 1, Math.max(0, c)));
    if (!next) return;
    if (extend) head = pos(next); else anchor = head = pos(next);
    next.focus();
    next.select();
    paint();
  };
  const eachSel = fn => {
    for (let r = Math.min(anchor.r, head.r); r <= Math.max(anchor.r, head.r); r++) fn(r);
  };

  const drawTable = () => {
    table = el('table', 'grid-table');
    for (let i = 0; i <= st.rows; i++) {
      const tr = el('tr');
      tr.append(el(i ? 'td' : 'th', 'grid-idx', i ? String(i - 1) : 'm'));
      for (let j = 0; j < st.cols; j++) {
        const cell = el(i ? 'td' : 'th');
        const input = el('input');
        input.value = st.cells[i]?.[j] ?? '';
        input.dataset.r = i;
        input.dataset.c = j;
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.setAttribute('aria-label', i ? T('grid.cell', { r: i - 1, c: j + 1 }) : T('grid.head', { c: j + 1 }));
        cell.append(input);
        tr.append(cell);
      }
      table.append(tr);
    }
    table.addEventListener('input', e => { const { r, c } = pos(e.target); setCell(r, c, e.target.value); save(); });
    table.addEventListener('mousedown', e => {
      if (!e.target.matches('input')) return;
      const p = pos(e.target);
      if (e.shiftKey && anchor) { e.preventDefault(); head = p; e.target.focus(); } else anchor = head = p;
      dragging = true;
      paint();
    });
    table.addEventListener('mouseover', e => {
      if (!dragging || !e.target.matches('input')) return;
      head = pos(e.target);
      if (multi()) getSelection()?.removeAllRanges();
      paint();
    });
    table.addEventListener('focusin', e => { if (!dragging && !multi()) { anchor = head = pos(e.target); } });
    table.addEventListener('keydown', e => {
      if (e.isComposing) return;
      const input = e.target, { r, c } = pos(input), from = head ?? { r, c };
      const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const atEnd = input.selectionStart === input.value.length;
      const whole = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      const move = {
        ArrowDown: [1, 0], ArrowUp: [-1, 0], Enter: e.shiftKey ? [-1, 0] : [1, 0],
        ArrowLeft: (e.shiftKey || atStart || whole) && [0, -1], ArrowRight: (e.shiftKey || atEnd || whole) && [0, 1],
      }[e.key];
      if (move) {
        e.preventDefault();
        const extend = e.shiftKey && e.key !== 'Enter';
        go((extend ? from.r : r) + move[0], (extend ? from.c : c) + move[1], extend);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && multi()) {
        e.preventDefault();
        eachSel(i => { for (let j = Math.min(anchor.c, head.c); j <= Math.max(anchor.c, head.c); j++) { setCell(i, j, ''); at(i, j).value = ''; } });
        save();
      } else if (e.key === 'Escape' && multi()) {
        anchor = head = { r, c };
        paint();
      }
    });
    table.addEventListener('copy', e => {
      if (!multi()) return;
      const lines = [];
      eachSel(i => {
        const row = [];
        for (let j = Math.min(anchor.c, head.c); j <= Math.max(anchor.c, head.c); j++) row.push(st.cells[i]?.[j] ?? '');
        lines.push(row.join('\t'));
      });
      e.clipboardData.setData('text/plain', lines.join('\n'));
      e.preventDefault();
    });
    table.addEventListener('paste', e => {
      const text = e.clipboardData.getData('text/plain');
      if (!/[\t\n]/.test(text.replace(/\r?\n$/, ''))) return;     // một ô: để ô tự dán như thường
      e.preventDefault();
      const p = multi() ? { r: Math.min(anchor.r, head.r), c: Math.min(anchor.c, head.c) } : pos(e.target);
      st = pasteBlock(st, p.r, p.c, text);
      save();
      draw();
      go(p.r, p.c);
    });
    wrap.replaceChildren(table);
    anchor = head = null;
  };
  const draw = () => {
    const rows = num('rows', n => { st.rows = n; save(); drawTable(); });
    const cols = num('cols', n => { st.cols = n; save(); drawTable(); });
    const vars = el('div', 'calc-bases grid-vars');
    vars.title = T('grid.fillTip');
    vars.append(el('span', 'grid-num', T('grid.varsLabel')), ...Array.from({ length: VARS[1] }, (_, i) => {
      const n = i + 1, b = el('button', null, String(n));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(st.vars === n && st.rows === 2 ** n));
      b.setAttribute('aria-label', T('grid.vars', { n }));
      b.addEventListener('click', () => { st = setVars(st, n, subject); save(); draw(); });
      return b;
    }));
    const clear = el('button', 'link', T('grid.clear'));
    clear.type = 'button';
    clear.addEventListener('click', () => { st.cells = []; save(); drawTable(); });
    rows.firstChild.textContent = T('grid.rows');
    cols.firstChild.textContent = T('grid.cols');
    bar.replaceChildren(vars, rows, cols, clear);
    drawTable();
  };
  draw();
  onLangChange(draw);
}

/** Ngăn Bìa K (chỉ Logic): vẽ vào `host`. */
export function mountKmap(host, subject) {
  const key = 'scratch-kmap:' + subject;
  let km = loadKmap(read(key)), pen = null;
  const save = () => write(key, km);
  const bar = el('div', 'grid-bar'), wrap = el('div', 'grid-wrap');
  host.append(bar, wrap);

  const drawKmap = () => {
    const L = kmapLayout(km.n);
    const table = el('table', 'kmap');
    const head = el('tr');
    head.append(el('th', 'kmap-corner', `${L.rowVars} \\ ${L.colVars}`), ...L.cols.map(c => el('th', null, c)));
    table.append(head);
    L.rows.forEach((r, i) => {
      const tr = el('tr');
      tr.append(el('th', null, r));
      L.cells[i].forEach(m => {
        const b = el('button', 'kmap-cell');
        b.type = 'button';
        b.append(el('small', null, String(m)), el('b', null, km.marks[m] ?? ''));
        const gs = km.groups[m] ?? [];
        b.style.boxShadow = gs.map((g, k) => `inset 0 0 0 ${2 * (k + 1)}px var(--pen${g})`).join(', ');
        b.setAttribute('aria-label', `m${m}: ${km.marks[m] || '—'}`);
        b.addEventListener('click', () => { km = clickCell(km, m, pen); save(); drawKmap(); });
        const td = el('td');
        td.append(b);
        tr.append(td);
      });
      table.append(tr);
    });
    wrap.replaceChildren(table);
  };
  const draw = () => {
    const vars = el('div', 'calc-bases');
    vars.append(...[2, 3, 4].map(n => {
      const b = el('button', null, T('grid.vars', { n }));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(km.n === n));
      b.addEventListener('click', () => { km = { n, marks: {}, groups: {} }; pen = null; save(); draw(); });
      return b;
    }));
    const pens = el('div', 'kmap-pens');
    pens.title = T('grid.penTip');
    pens.append(...Array.from({ length: PENS }, (_, g) => {
      const b = el('button');
      b.type = 'button';
      b.style.setProperty('--c', `var(--pen${g})`);
      b.setAttribute('aria-pressed', String(pen === g));
      b.setAttribute('aria-label', T('grid.pen', { n: g + 1 }));
      b.addEventListener('click', () => { pen = pen === g ? null : g; draw(); });
      return b;
    }));
    const clear = el('button', 'link', T('grid.clear'));
    clear.type = 'button';
    clear.addEventListener('click', () => { km = { n: km.n, marks: {}, groups: {} }; save(); drawKmap(); });
    bar.replaceChildren(vars, pens, clear);
    drawKmap();
  };
  draw();
  onLangChange(draw);
}
