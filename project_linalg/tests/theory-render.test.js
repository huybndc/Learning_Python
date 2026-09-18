import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const dir = fileURLToPath(new URL('../src/content/', import.meta.url));
const load = name => readFileSync(dir + name, 'utf-8');
/** Các chương đang có file lý thuyết — tự phát hiện để thêm chương khỏi sửa test. */
const CHAPTERS = [...new Set(readdirSync(dir)
  .map(f => f.match(/^theory-ch(\d+)\.(vi|en)\.md$/)).filter(Boolean).map(m => Number(m[1])))].sort();

const VI_CHARS = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

describe('nội dung lý thuyết', () => {
  it('có ít nhất một chương', () => {
    expect(CHAPTERS.length).toBeGreaterThan(0);
  });

  it('mỗi chương có đủ bản vi và en, đều parse được', () => {
    for (const n of CHAPTERS) {
      for (const lang of ['vi', 'en']) {
        const text = load(`theory-ch${n}.${lang}.md`);
        expect(text.length, `ch${n}.${lang}`).toBeGreaterThan(20);
        expect(marked.parse(text, { async: false }).length).toBeGreaterThan(20);
      }
    }
  });

  it('bản en không còn dấu tiếng Việt', () => {
    for (const n of CHAPTERS) {
      const bad = load(`theory-ch${n}.en.md`).split('\n').filter(l => VI_CHARS.test(l));
      expect(bad, `theory-ch${n}.en.md`).toEqual([]);
    }
  });

  it('hai bản có cùng số heading cấp 2', () => {
    for (const n of CHAPTERS) {
      const count = lang => (load(`theory-ch${n}.${lang}.md`).match(/^## /gm) || []).length;
      expect(count('en'), `ch${n} lệch số mục`).toBe(count('vi'));
    }
  });

  it('không còn chỗ giữ chỗ chưa điền', () => {
    for (const n of CHAPTERS) {
      for (const lang of ['vi', 'en']) {
        expect(load(`theory-ch${n}.${lang}.md`)).not.toMatch(/<\.\.\.>|TODO|FIXME/);
      }
    }
  });
});
