import { onLangChange, t as T } from '../i18n/index.js';
import { evaluate, show } from '../logic/calc.js';
import { mountTable, mountKmap } from './scratch-grid.js';

/* ---------------------------------------------------------------
   NHÁP: ngăn kéo bên phải để tính tay khi giải bài, chia NGĂN (D45) — mỗi lúc chỉ hiện một công cụ,
   môn nào có ngăn nấy (TABS). Sang chương khác ⇒ tự mở ngăn hợp với chương (SUGGEST), trừ khi ở
   chương đó Huy đã tự chọn ngăn khác (nhớ theo môn + chương).
   Nguyên tắc (D45): làm hộ phần chép tay, KHÔNG làm hộ bước đang bị kiểm tra.
   - Máy tính: DEC là máy tính thường (thập phân, chia thật); chọn 2/8/16 để tính TRONG cơ số đó
     (+ − × ÷ %, ngoặc). Kết quả chỉ hiện ở cơ số đang gõ và đổi cơ số thì xoá ô — không tự đổi
     cơ số, vì đổi cơ số là chính bài Logic ch1. Bấm kết quả để chép xuống ô đang gõ.
   - Bảng chân trị + bìa K trống: shared/ui/scratch-grid.js.
   - Ô ghi chú font đều (mono) để cộng cột bit thẳng hàng, kèm hàng ký hiệu bàn phím không gõ
     được (Σ Π ′ ⊕ …) — chèn vào ô đang gõ (ghi chú hoặc ô bảng).
   Lưu theo từng môn trong localStorage — đóng, mở, F5 vẫn còn.
   ponytail: chỉ có chữ, chưa vẽ tay; thêm canvas khi dùng máy có bút.
   --------------------------------------------------------------- */

const BASES = [2, 8, 10, 16];
const SYMBOLS = ['Σm(', 'ΠM(', '′', '⊕', '·', '→', '≠'];
const TABS = { logic: ['notes', 'calc', 'table', 'kmap'], discrete: ['notes', 'calc', 'table'] };
const SUGGEST = {
  logic: { ch1: 'calc', ch2: 'table', ch3: 'kmap', ch4: 'table' },     // ch1 cơ số/bù 2 · ch2, ch4 bảng chân trị · ch3 bìa K
  discrete: { ch1: 'table', ch6: 'calc', ch7: 'calc' },                // ch1 mệnh đề · ch6, ch7 số học modulo
};

export function setupScratch() {
  const subject = document.documentElement.dataset.subject || 'home';
  const key = 'scratch:' + subject;
  const baseKey = 'calc-base:' + subject;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scratch-btn';
  btn.setAttribute('aria-expanded', 'false');
  const pane = document.createElement('aside');
  pane.className = 'scratch';
  pane.hidden = true;
  pane.innerHTML = '<header><b></b><button type="button" class="link"></button>'
    + '<button type="button" class="scratch-x">×</button></header>'
    + '<nav class="scratch-tabs calc-bases"></nav><div class="scratch-syms"></div>'
    + '<section class="sp" data-tab="notes"><textarea spellcheck="false"></textarea></section>'
    + '<section class="sp calc" data-tab="calc"><div class="calc-bases" role="group"></div>'
    + '<input type="text" class="calc-in" spellcheck="false" autocomplete="off">'
    + '<p class="calc-err" hidden></p><dl class="calc-out"></dl></section>'
    + '<section class="sp" data-tab="table"></section><section class="sp" data-tab="kmap"></section>';
  const [title, clear, close, ta, bases, inp, errEl, out, syms] =
    ['b', '.link', '.scratch-x', 'textarea', '.calc .calc-bases', '.calc-in', '.calc-err', '.calc-out', '.scratch-syms'].map(s => pane.querySelector(s));
  const tabs = TABS[subject] ?? ['notes', 'calc'];
  const panel = tab => pane.querySelector(`.sp[data-tab="${tab}"]`);
  pane.querySelectorAll('.sp').forEach(sp => { if (!tabs.includes(sp.dataset.tab)) sp.remove(); });
  if (tabs.includes('table')) mountTable(panel('table'), subject);
  if (tabs.includes('kmap')) mountKmap(panel('kmap'), subject);

  /* ---------- ngăn ---------- */
  const nav = pane.querySelector('.scratch-tabs');
  const chapter = () => location.hash.match(/\/(ch\d+)/)?.[1] ?? '';
  const tabKey = () => `scratch-tab:${subject}:${chapter()}`;
  let tab = 'notes';
  const openTab = (t, remember) => {
    tab = t;
    pane.dataset.tab = t;
    pane.querySelectorAll('.sp').forEach(sp => { sp.hidden = sp.dataset.tab !== t; });
    nav.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
    if (remember) try { localStorage.setItem(tabKey(), t); } catch { /* riêng tư */ }
  };
  const pick = () => {
    let saved = null;
    try { saved = localStorage.getItem(tabKey()); } catch { /* riêng tư */ }
    openTab(tabs.includes(saved) ? saved : SUGGEST[subject]?.[chapter()] ?? 'notes');
  };
  let lastCh = chapter();
  addEventListener('hashchange', () => { if (chapter() && chapter() !== lastCh) { lastCh = chapter(); pick(); } });

  try { ta.value = localStorage.getItem(key) || ''; } catch { /* chế độ riêng tư */ }
  const save = () => { try { localStorage.setItem(key, ta.value); } catch { /* đầy/riêng tư */ } };
  ta.addEventListener('input', save);

  // ký hiệu / kết quả máy tính đi vào ô gõ gần nhất: ghi chú hoặc một ô của bảng
  let target = ta;
  pane.addEventListener('focusin', e => { if (e.target.matches('textarea, .grid-table input')) target = e.target; });
  const insert = text => {
    const f = target.isConnected ? target : ta;
    openTab(f.closest('.sp').dataset.tab, true);                  // kết quả máy tính ⇒ mở lại ngăn đang gõ
    const { selectionStart: a, selectionEnd: b, value } = f;
    f.value = value.slice(0, a) + text + value.slice(b);
    f.selectionStart = f.selectionEnd = a + text.length;
    f.focus();
    f.dispatchEvent(new Event('input', { bubbles: true }));   // để ô tự lưu như khi gõ
  };
  SYMBOLS.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s;
    b.addEventListener('click', () => insert(s));
    syms.append(b);
  });

  /* ---------- máy tính ---------- */
  let base = 10;
  try { base = Number(localStorage.getItem(baseKey)) || 10; } catch { /* riêng tư */ }
  const drawBases = () => {
    bases.replaceChildren(...BASES.map(r => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = T('calc.base' + r);
      b.setAttribute('aria-pressed', String(r === base));
      b.addEventListener('click', () => {
        // đổi cơ số ⇒ xoá ô, không đổi hộ số đang có (D45)
        base = r;
        try { localStorage.setItem(baseKey, String(r)); } catch { /* riêng tư */ }
        inp.value = '';
        drawBases();
        calc();
        inp.focus();
      });
      return b;
    }));
    inp.placeholder = T('calc.ph' + base);
  };
  const calc = () => {
    const r = evaluate(inp.value, base);
    errEl.hidden = !r.error;
    if (r.error) errEl.textContent = T(r.error, { at: r.at, base });
    out.replaceChildren(...[base].flatMap(b => {
      const dt = document.createElement('dt');
      dt.textContent = T('calc.base' + b);
      const dd = document.createElement('dd');
      dd.textContent = r.value == null ? '—' : show(r.value, b);
      if (r.value != null) {
        dd.title = T('calc.copy');
        dd.addEventListener('click', () => insert(`${dd.textContent}`));
      }
      dt.classList.add('on');
      return [dt, dd];
    }));
  };
  inp.addEventListener('input', calc);

  const open = on => {
    pane.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    if (on) panel(tab).querySelector('textarea, input, button')?.focus(); else btn.focus();
  };
  btn.addEventListener('click', () => open(pane.hidden));
  close.addEventListener('click', () => open(false));
  clear.addEventListener('click', () => { ta.value = ''; save(); ta.focus(); });
  pane.addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });

  const label = () => {
    btn.textContent = title.textContent = T('shell.scratch');
    clear.textContent = T('shell.scratchClear');
    close.setAttribute('aria-label', T('shell.close'));
    ta.placeholder = T('shell.scratchPh');
    syms.title = T('calc.syms');
    nav.replaceChildren(...tabs.map(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.tab = t;
      b.textContent = T('scratch.' + t);
      b.addEventListener('click', () => { openTab(t, true); panel(t).querySelector('textarea, input, button')?.focus(); });
      return b;
    }));
    openTab(tab);
    drawBases();
    calc();
  };
  pick();
  label();
  onLangChange(label);
  document.body.append(btn, pane);
}
