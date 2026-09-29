import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mergeSubject } from './logic/progress-export.js';

/**
 * Chỉ khi chạy `npm run dev`: nhận POST /__progress từ trình duyệt và ghi
 * ~/study-progress/math.json (đổi thư mục bằng STUDY_PROGRESS_DIR) để Claude Code / skill đọc được.
 */
export function progressSink() {
  const dir = process.env.STUDY_PROGRESS_DIR || join(homedir(), 'study-progress');
  const file = join(dir, 'math.json');
  return {
    name: 'progress-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__progress', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', () => {
          try {
            const { subject, items } = JSON.parse(body);
            if (!/^[a-z]+$/.test(subject) || !Array.isArray(items)) throw new Error('bad payload');
            let doc = null;
            try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch { /* chưa có file */ }
            mkdirSync(dir, { recursive: true });
            const tmp = `${file}.tmp`;
            writeFileSync(tmp, JSON.stringify(mergeSubject(doc, subject, items), null, 2));
            renameSync(tmp, file);
            res.statusCode = 204;
          } catch { res.statusCode = 400; }
          res.end();
        });
      });
    },
  };
}
