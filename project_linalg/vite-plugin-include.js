import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/**
 * Gộp partial HTML lúc build/dev: `<!--#include <đường dẫn> -->`.
 * Đường dẫn tính từ thư mục gốc project. Cho phép tách markup từng chương
 * ra file riêng mà vẫn giữ index.html là HTML thuần, không cần framework.
 */
export function htmlInclude(root = process.cwd()) {
  const RE = /<!--#include\s+([^\s>]+)\s*-->/g;

  const expand = (html, seen = new Set()) => html.replace(RE, (_, rel) => {
    const file = resolve(root, rel);
    if (seen.has(file)) throw new Error('include lặp vòng: ' + rel);
    const next = new Set(seen).add(file);
    return expand(readFileSync(file, 'utf-8'), next);
  });

  return {
    name: 'html-include',
    transformIndexHtml: {
      order: 'pre',
      handler: html => expand(html),
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
