import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { vi } from '../src/i18n/vi/index.js';
import { en } from '../src/i18n/en/index.js';

const read = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8');

describe('hai từ điển phải khớp nhau', () => {
  it('cùng tập khoá', () => {
    const a = Object.keys(vi).sort();
    const b = Object.keys(en).sort();
    expect(b.filter(k => !vi[k]), 'thiếu ở vi').toEqual([]);
    expect(a.filter(k => !en[k]), 'thiếu ở en').toEqual([]);
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
    const viChars = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
    for (const [k, v] of Object.entries(en)) {
      expect(viChars.test(v), 'en.' + k + ' = ' + v).toBe(false);
    }
  });
});

describe('markup và mã nguồn dùng đúng khoá', () => {
  const htmlFiles = ['../index.html', '../src/pages/ch1.html', '../src/pages/ch2.html', '../src/pages/ch3.html'];
  const html = htmlFiles.map(read).join('\n');

  it('mọi data-i18n* trong markup đều có trong từ điển', () => {
    const used = [...html.matchAll(/data-i18n(?:-html|-ph|-title)?="([^"]+)"/g)].map(m => m[1]);
    expect(used.length).toBeGreaterThan(20);
    const missing = [...new Set(used)].filter(k => !(k in vi));
    expect(missing, 'khoá không có trong từ điển').toEqual([]);
  });

  it('mọi khoá T("…") trong src/ui đều có trong từ điển', () => {
    const dir = fileURLToPath(new URL('../src/ui/', import.meta.url));
    const used = new Set();
    for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
      const code = readFileSync(dir + f, 'utf-8');
      for (const m of code.matchAll(/\bT\('([\w.]+)'/g)) used.add(m[1]);
    }
    const missing = [...used].filter(k => !(k in vi));
    expect(missing, 'khoá dùng trong ui/ nhưng chưa khai báo').toEqual([]);
  });

  it('logic/ không import i18n và không chứa chuỗi tiếng Việt hiển thị', () => {
    const dir = fileURLToPath(new URL('../src/logic/', import.meta.url));
    for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
      const code = readFileSync(dir + f, 'utf-8');
      expect(/^\s*import .*i18n/m.test(code), 'logic/' + f + ' import i18n').toBe(false);
      // bỏ comment trước, phần còn lại mới là mã thật
      const bare = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const strings = [...bare.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map(m => m[1] ?? m[2]);
      const viChars = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
      const leaked = strings.filter(x => viChars.test(x));
      expect(leaked, 'logic/' + f + ' còn chuỗi tiếng Việt').toEqual([]);
    }
  });
});
