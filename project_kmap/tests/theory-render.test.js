import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const load = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8');
const md = load('../src/content/theory-ch3.vi.md');

describe('theory-ch3.md', () => {
  const html = marked.parse(md, { async: false });

  it('marked parse được, không throw', () => {
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(500);
  });

  it('có các heading mong đợi', () => {
    for (const h of [
      'Gray code là gì',
      'Vì sao K-map dùng thứ tự Gray',
      'Quy tắc khoanh nhóm trên K-map',
      'Prime implicant',
      'SOP và POS',
      'Những chỗ hay sai',
    ]) {
      expect(html, `thiếu heading "${h}"`).toContain(h);
    }
  });

  it('render được bảng và khối code', () => {
    expect(html).toContain('<table>');
    expect(html).toContain('<code>');
  });

  it('giữ lại nội dung card "Vì sao K-map dùng Gray" của bản gốc', () => {
    expect(html).toContain('wrap-around');
    expect(html).toContain('siêu khối');
    // marked escape dấu nháy đơn thành &#39; trong khối code
    expect(html).toContain('x&#39;yz + xyz = yz(x&#39; + x) = yz');
  });

  it('không còn chỗ giữ chỗ chưa điền', () => {
    expect(md).not.toMatch(/<\.\.\.>|TODO|FIXME/);
  });
});

describe('nội dung lý thuyết cả hai ngôn ngữ', () => {
  const CHAPTERS = [1, 2, 3];

  it('mỗi chương có đủ bản vi và en, đều parse được', () => {
    for (const n of CHAPTERS) {
      for (const lang of ['vi', 'en']) {
        const text = load(`../src/content/theory-ch${n}.${lang}.md`);
        expect(text.length, `ch${n}.${lang}`).toBeGreaterThan(1000);
        expect(marked.parse(text, { async: false }).length).toBeGreaterThan(1000);
      }
    }
  });

  it('bản en không còn dấu tiếng Việt', () => {
    const viChars = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
    for (const n of CHAPTERS) {
      const bad = load(`../src/content/theory-ch${n}.en.md`)
        .split('\n').filter(l => viChars.test(l));
      expect(bad, `theory-ch${n}.en.md`).toEqual([]);
    }
  });

  it('hai bản có cùng số heading cấp 2', () => {
    for (const n of CHAPTERS) {
      const count = lang => (load(`../src/content/theory-ch${n}.${lang}.md`).match(/^## /gm) || []).length;
      expect(count('en'), `ch${n} lệch số mục`).toBe(count('vi'));
    }
  });

  it('không còn dùng tên biến A/B/C/D cho hàm Boolean', () => {
    for (const n of CHAPTERS) {
      for (const lang of ['vi', 'en']) {
        const text = load(`../src/content/theory-ch${n}.${lang}.md`);
        expect(/\bA['′]B\b|\bB['′]D['′]\b/.test(text), `ch${n}.${lang}`).toBe(false);
      }
    }
  });
});
