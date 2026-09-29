import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/**
 * Gộp partial HTML lúc dev: `<!--#include <đường dẫn> -->`.
 * Đường dẫn tính từ THƯ MỤC CỦA FILE HTML đang xử lý (vd `logic/index.html` →
 * `logic/src/pages/ch1.html`), không phải từ `process.cwd()`: cả 3 app chạy chung
 * một máy chủ Vite đặt ở gốc repo, nên cwd không còn là thư mục của app.
 */
export function htmlInclude() {
  const RE = /<!--#include\s+([^\s>]+)\s*-->/g;

  const expand = (html, base, seen = new Set()) => html.replace(RE, (_, rel) => {
    const file = resolve(base, rel);
    if (seen.has(file)) throw new Error('include lặp vòng: ' + rel);
    const next = new Set(seen).add(file);
    return expand(readFileSync(file, 'utf-8'), base, next);
  });

  return {
    name: 'html-include',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => expand(html, dirname(ctx.filename)),
    },
    // dev: sửa partial thì reload trang
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/pages/') && file.endsWith('.html')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}
