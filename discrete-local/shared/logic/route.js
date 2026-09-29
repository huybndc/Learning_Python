/* ---------------------------------------------------------------
   ĐỊA CHỈ TRONG MỘT APP — menu theo VIỆC (RESEARCH U-R1):
     #/                        Tổng quan
     #/learn                   Học: danh sách chương
     #/learn/ch3/interactive   một khung của chương (theory | example | interactive)
     #/learn/ch3/interactive/1 … và cuộn tới công cụ thứ 2 trong khung (mở từ màn Công cụ)
     #/tools                   Công cụ: mọi công cụ bấm thử + ví dụ giải sẵn của các chương
     #/practice                Luyện tập: danh sách dạng
     #/practice/ch3            trộn cả chương (app chưa có ngân hàng câu: bài luyện cũ)
     #/practice/ch3/sop        một dạng
     #/exam                    Thi thử: chọn đề ; #/exam/run · #/exam/result
   Địa chỉ cũ #/ch3/<mục con> (link trong bài học, bản trước) vẫn đọc được.
   Thuần (không đụng window) để test được; ui/router.js dùng.
   --------------------------------------------------------------- */

export const LEARN_SUBS = ['theory', 'example', 'interactive'];
const EXAM_STEPS = ['setup', 'run', 'result'];

/**
 * @param {string} hash
 * @param {string[]} chapters - vd ['ch1','ch2','ch3']
 * @returns {{view:string, ch?:string, sub?:string, kind?:string, step?:string} | null}
 *   null = địa chỉ không có thật ⇒ nơi gọi về Tổng quan, không mở trang trống.
 */
export function parseRoute(hash, chapters) {
  const parts = String(hash ?? '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const [head, a, b, c] = parts;
  if (!head) return { view: 'home' };
  if (chapters.includes(head)) {                       // địa chỉ cũ
    const sub = a ?? 'theory';
    if (sub === 'practice') return { view: 'practice', ch: head };
    return LEARN_SUBS.includes(sub) ? { view: 'learn', ch: head, sub } : null;
  }
  switch (head) {
    case 'learn':
      if (!a) return { view: 'learn' };
      if (!chapters.includes(a)) return null;
      if (!LEARN_SUBS.includes(b ?? 'theory')) return null;
      if (c === undefined) return { view: 'learn', ch: a, sub: b ?? 'theory' };
      return /^\d+$/.test(c) ? { view: 'learn', ch: a, sub: b, at: Number(c) } : null;
    case 'tools':
      return a ? null : { view: 'tools' };
    case 'practice':
      if (!a) return { view: 'practice' };
      if (!chapters.includes(a)) return null;
      return b ? { view: 'practice', ch: a, kind: b } : { view: 'practice', ch: a };
    case 'exam':
      return EXAM_STEPS.includes(a ?? 'setup') ? { view: 'exam', step: a ?? 'setup' } : null;
    default:
      return null;
  }
}

/** Dựng địa chỉ chuẩn từ kết quả parseRoute (đổi địa chỉ cũ sang dạng mới). */
export function routeOf(r) {
  switch (r.view) {
    case 'learn': return r.ch ? `#/learn/${r.ch}/${r.sub ?? 'theory'}${r.at != null ? `/${r.at}` : ''}` : '#/learn';
    case 'tools': return '#/tools';
    case 'practice': return '#/practice' + (r.ch ? `/${r.ch}` : '') + (r.kind ? `/${r.kind}` : '');
    case 'exam': return r.step && r.step !== 'setup' ? `#/exam/${r.step}` : '#/exam';
    default: return '#/';
  }
}
