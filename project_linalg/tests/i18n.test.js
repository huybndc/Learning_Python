import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { vi } from '../src/i18n/vi/index.js';
import { en } from '../src/i18n/en/index.js';

const dirOf = rel => fileURLToPath(new URL(rel, import.meta.url));
const read = rel => readFileSync(dirOf(rel), 'utf-8');
const jsFiles = rel => readdirSync(dirOf(rel)).filter(f => f.endsWith('.js'))
  .map(f => ({ name: rel.replace('../src/', '') + f, code: read(rel + f) }));

const VI_CHARS = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
/** Bỏ comment để chỉ còn mã thật — comment tiếng Việt trong logic/ là hợp lệ. */
const stripComments = code => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('hai từ điển phải khớp nhau', () => {
  it('cùng tập khoá', () => {
    const a = Object.keys(vi).sort();
    const b = Object.keys(en).sort();
    expect(b.filter(k => !(k in vi)), 'thiếu ở vi').toEqual([]);
    expect(a.filter(k => !(k in en)), 'thiếu ở en').toEqual([]);
    expect(a).toEqual(b);
  });

  it('không khoá nào bỏ trống', () => {
    for (const [k, v] of Object.entries(vi)) expect(v, 'vi.' + k).toBeTruthy();
    for (const [k, v] of Object.entries(en)) expect(v, 'en.' + k).toBeTruthy();
  });

  it('cùng bộ tham số {…} trong mỗi chuỗi', () => {
    const slots = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    for (const k of Object.keys(vi)) {
      expect(slots(en[k]), 'khác tham số ở khoá ' + k).toEqual(slots(vi[k]));
    }
  });

  it('bản EN không còn sót dấu tiếng Việt', () => {
    for (const [k, v] of Object.entries(en)) {
      expect(VI_CHARS.test(v), 'en.' + k + ' = ' + v).toBe(false);
    }
  });
});

describe('markup và mã nguồn dùng đúng khoá', () => {
  const html = ['../index.html', ...readdirSync(dirOf('../src/pages/')).map(f => '../src/pages/' + f)]
    .map(read).join('\n');

  it('mọi data-i18n* trong markup đều có trong từ điển', () => {
    const used = [...html.matchAll(/data-i18n(?:-html|-ph|-title)?="([^"]+)"/g)].map(m => m[1]);
    expect(used.length).toBeGreaterThan(5);
    expect([...new Set(used)].filter(k => !(k in vi)), 'khoá không có trong từ điển').toEqual([]);
  });

  it('mọi khoá i18n xuất hiện trong src/ui đều có trong từ điển', () => {
    // bắt cả T('khoá') lẫn khoá viết trong bảng tra (STEP_KEYS, SIGN_KEYS…),
    // vì ghép chuỗi khoá thì test không soi được — quy ước là viết thẳng ra.
    const shaped = /'((?:app|nav|sub|common|err|c\d+q?)\.[\w.]+)'/g;
    const used = new Set();
    for (const { code } of jsFiles('../src/ui/')) {
      for (const m of stripComments(code).matchAll(shaped)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(20);
    expect([...used].filter(k => !(k in vi)), 'khoá dùng trong ui/ nhưng chưa khai báo').toEqual([]);
  });

  it('mọi khoá i18n trong logic/ và geometry/ đều có trong từ điển', () => {
    // gồm cả mã lỗi fail('err.…') lẫn khoá trả ra cho ui/ (textKey, reasonKey…),
    // dù truyền theo tên hay truyền thẳng làm tham số
    const shaped = /'((?:app|nav|sub|common|err|c\d+q?)\.[\w.]+)'/g;
    const used = new Set();
    for (const { code } of [...jsFiles('../src/logic/'), ...jsFiles('../src/geometry/')]) {
      for (const m of stripComments(code).matchAll(shaped)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(20);
    expect([...used].filter(k => !(k in vi)), 'khoá chưa có bản dịch').toEqual([]);
  });
});

describe('logic/ và geometry/ không biết ngôn ngữ, không biết DOM', () => {
  const pure = [...jsFiles('../src/logic/'), ...jsFiles('../src/geometry/')];

  it('không import i18n và không chứa chuỗi tiếng Việt hiển thị', () => {
    for (const { name, code } of pure) {
      expect(/^\s*import .*i18n/m.test(code), name + ' import i18n').toBe(false);
      const strings = [...stripComments(code).matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map(m => m[1] ?? m[2]);
      expect(strings.filter(x => VI_CHARS.test(x)), name + ' còn chuỗi tiếng Việt').toEqual([]);
    }
  });

  it('không đụng document/window', () => {
    for (const { name, code } of pure) {
      expect(/\bdocument\b|\bwindow\b|\blocalStorage\b/.test(stripComments(code)), name).toBe(false);
    }
  });

  it('logic/ và geometry/ không import từ ui/', () => {
    for (const { name, code } of pure) {
      expect(/from\s+'[^']*\/ui\//.test(code), name).toBe(false);
    }
  });
});
