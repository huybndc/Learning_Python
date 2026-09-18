import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const md = readFileSync(
  fileURLToPath(new URL('../src/content/theory-ch3.md', import.meta.url)),
  'utf-8',
);

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
    expect(html).toContain('A&#39;BC + ABC = BC(A&#39; + A) = BC');
  });

  it('không còn chỗ giữ chỗ chưa điền', () => {
    expect(md).not.toMatch(/<\.\.\.>|TODO|FIXME/);
  });
});
