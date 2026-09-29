import { t as T } from '../i18n/index.js';
import { ht as h } from './dom.js';

/* ---------------------------------------------------------------
   WIDGET TRẢ LỜI dùng chung — thay ô gõ chữ bằng thao tác trực tiếp.
   Mỗi widget: (spec, ctx) → { el, get() }
     spec: q.input của câu hỏi (vd { type: 'bits', length: 8 })
     ctx:  { given, locked, answer, onSubmit }
   get() trả về CHUỖI đáp án theo đúng định dạng checkAnswer đang nhận,
   nên phần chấm (logic/) không phải biết widget nào đã dùng.
   Trả rỗng khi chưa làm xong → bộ chạy nhắc "nhập đáp án trước đã".
   --------------------------------------------------------------- */

/**
 * Dãy bit bấm được. Bấm: trống → 1 → 0 → 1…; gõ 0/1 khi đang chọn ô cũng được,
 * Backspace lùi. spec = { length, group? } — group = số bit mỗi nhóm (vd 4 cho BCD).
 */
export function bits(spec, ctx) {
  const n = spec.length;
  const val = Array.from({ length: n }, (_, i) => (ctx.given ? ctx.given.replace(/\s+/g, '')[i] ?? '' : ''));
  const box = h('div', 'w-bits');
  const cells = [];
  const paint = () => cells.forEach((b, i) => {
    b.textContent = val[i] || '·';
    b.dataset.v = val[i];
    if (ctx.locked && ctx.answer != null) {
      const want = String(ctx.answer).replace(/\s+/g, '').padStart(n, '0')[i];
      b.classList.toggle('good', val[i] === want);
      b.classList.toggle('bad', val[i] !== want);
    }
  });
  for (let i = 0; i < n; i++) {
    if (spec.group && i && i % spec.group === 0) box.append(h('span', 'w-gap'));
    const b = h('button', 'w-bit');
    b.type = 'button';
    b.disabled = !!ctx.locked;
    b.setAttribute('aria-label', `bit ${i + 1}`);
    b.addEventListener('click', () => { val[i] = val[i] === '1' ? '0' : '1'; paint(); });
    b.addEventListener('keydown', e => {
      if (e.key === '0' || e.key === '1') { val[i] = e.key; paint(); cells[i + 1]?.focus(); e.preventDefault(); }
      else if (e.key === 'Backspace') { val[i] = ''; paint(); cells[i - 1]?.focus(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') cells[i + 1]?.focus();
      else if (e.key === 'ArrowLeft') cells[i - 1]?.focus();
      else if (e.key === 'Enter') { e.preventDefault(); ctx.onSubmit(); }
    });
    cells.push(b);
    box.append(b);
  }
  paint();
  return { el: box, get: () => (val.every(Boolean) ? val.join('') : ''), focus: () => cells[0].focus() };
}

/**
 * Bảng chân trị bấm được. spec = { vars: ['x','y','z'], mode, target }
 *  - mode 'column': bấm ô F để điền 0/1 → trả chuỗi bit theo thứ tự dòng.
 *  - mode 'rows':   bấm chọn các dòng (vd dòng có F = target) → trả "1, 3, 5".
 */
export function truth(spec, ctx) {
  const n = spec.vars.length, rows = 1 << n;
  const t = h('table', 'w-truth ' + spec.mode);
  const head = h('tr');
  spec.vars.forEach(v => head.append(h('th', null, v)));
  head.append(h('th', 'out', spec.mode === 'column' ? 'F' : ''));
  const thead = h('thead'); thead.append(head); t.append(thead);
  const tbody = h('tbody'); t.append(tbody);

  const given = ctx.given ?? '';
  const col = Array.from({ length: rows }, (_, m) => (spec.mode === 'column' ? given.replace(/\s+/g, '')[m] ?? '' : ''));
  const picked = new Set(spec.mode === 'rows' ? (given.match(/\d+/g) || []).map(Number) : []);
  const want = ctx.locked && ctx.answer != null ? ctx.answer : null;

  const trs = [];
  for (let m = 0; m < rows; m++) {
    const tr = h('tr');
    for (let i = 0; i < n; i++) tr.append(h('td', null, String((m >> (n - 1 - i)) & 1)));
    const out = h('td', 'out');
    tr.append(out);
    tbody.append(tr);
    trs.push({ tr, out });
    if (ctx.locked) continue;
    if (spec.mode === 'column') {
      out.tabIndex = 0;
      out.addEventListener('click', () => { col[m] = col[m] === '1' ? '0' : '1'; paint(); });
      out.addEventListener('keydown', e => {
        if (e.key === '0' || e.key === '1') { col[m] = e.key; paint(); trs[m + 1]?.out.focus(); e.preventDefault(); }
        if (e.key === 'Enter') { e.preventDefault(); ctx.onSubmit(); }
      });
    } else {
      tr.tabIndex = 0;
      const flip = () => { if (picked.has(m)) picked.delete(m); else picked.add(m); paint(); };
      tr.addEventListener('click', flip);
      tr.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); flip(); } if (e.key === 'Enter') { e.preventDefault(); ctx.onSubmit(); } });
    }
  }
  function paint() {
    trs.forEach(({ tr, out }, m) => {
      if (spec.mode === 'column') {
        out.textContent = col[m] || '·';
        out.dataset.v = col[m];
        if (want != null) out.className = 'out ' + (col[m] === String(want)[m] ? 'good' : 'bad');
      } else {
        tr.classList.toggle('picked', picked.has(m));
        out.textContent = picked.has(m) ? `m${m}` : '';
        if (want != null) {                       // chọn thừa → đỏ · bỏ sót → viền xanh
          tr.classList.toggle('bad', picked.has(m) && !want.includes(m));
          tr.classList.toggle('want', !picked.has(m) && want.includes(m));
        }
      }
    });
  }
  paint();
  const wrap = h('div', 'w-truth-wrap');
  if (spec.mode === 'rows') wrap.append(h('p', 'w-tip', T(spec.target === 0 ? 'wid.pickRows0' : 'wid.pickRows1')));
  wrap.append(t);
  return {
    el: wrap,
    get: () => (spec.mode === 'column'
      ? (col.every(Boolean) ? col.join('') : '')
      : (picked.size ? [...picked].sort((a, b) => a - b).join(', ') : '')),
  };
}

/** Vài ô số có nhãn (vd khoảng biểu diễn: nhỏ nhất / lớn nhất) → nối bằng " … ". */
export function fields(spec, ctx) {
  const box = h('div', 'w-fields');
  const parts = String(ctx.given ?? '').split('…').map(s => s.trim());
  const inputs = spec.labels.map((key, i) => {
    const lab = h('label', 'w-field');
    lab.append(h('span', null, T(key)));
    const inp = h('input');
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.autocomplete = 'off';
    inp.value = parts[i] ?? '';
    inp.disabled = !!ctx.locked;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ctx.onSubmit(); } });
    lab.append(inp);
    box.append(lab);
    return inp;
  });
  return {
    el: box,
    get: () => (inputs.every(i => i.value.trim()) ? inputs.map(i => i.value.trim()).join(' … ') : ''),
    focus: () => inputs[0].focus(),
  };
}

/** Bấm chọn các số 0…count−1 (vd chỉ số minterm/maxterm) → trả "1, 3, 5". */
export function numset(spec, ctx) {
  const picked = new Set((String(ctx.given ?? '').match(/\d+/g) || []).map(Number));
  const want = ctx.locked && Array.isArray(ctx.answer) ? new Set(ctx.answer) : null;
  const box = h('div', 'w-numset');
  for (let i = 0; i < spec.count; i++) {
    const b = h('button', 'w-num', String(i));
    b.type = 'button';
    b.disabled = !!ctx.locked;
    b.setAttribute('aria-pressed', String(picked.has(i)));
    if (want) {
      b.classList.toggle('bad', picked.has(i) && !want.has(i));
      b.classList.toggle('want', !picked.has(i) && want.has(i));
    }
    b.addEventListener('click', () => {
      if (picked.has(i)) picked.delete(i); else picked.add(i);
      b.setAttribute('aria-pressed', String(picked.has(i)));
    });
    box.append(b);
  }
  return { el: box, get: () => (picked.size ? [...picked].sort((a, b) => a - b).join(', ') : '') };
}

export const SHARED_WIDGETS = { bits, truth, fields, numset };
