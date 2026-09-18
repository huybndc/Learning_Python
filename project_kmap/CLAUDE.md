# CLAUDE.md — project_kmap

## Nguyên tắc
- Mỗi file một trách nhiệm, mục tiêu dưới ~300 dòng. Vượt thì tách tiếp
  (`bash scripts/check_file_sizes.sh .`).
- `src/logic/` là hàm thuần: nhận input, trả output, **không** đụng `document`/`window`.
- `src/ui/` đọc/ghi DOM và gọi `logic/`. `logic/` không bao giờ import từ `ui/`.
- Không sang milestone mới khi `npm test` đang fail.

## Quy ước
- Test đặt ở `tests/<tên-module-logic>.test.js`, một file test cho một file trong `src/logic/`.
- Nội dung học tập dạng văn bản để ở `src/content/*.md`, import bằng `?raw` của Vite.
- Comment và chuỗi hiển thị viết bằng tiếng Việt, giữ nguyên văn phong bản gốc.
- Tên biến công khai của thuật toán (`A/B/C/D/E`, `imp = {v, d}`) giữ nguyên như bản gốc.

## Tab Lý thuyết
Nội dung nằm ở `src/content/theory.md`, import bằng `?raw` và render bằng `marked`
trong `src/ui/theory-page.js`. Thêm/sửa bài học thì sửa file `.md`, không đụng code.
CSS của trang gom trong khối `#theory-body` ở `src/style.css`.

## Build
`npm run build` dùng `vite-plugin-singlefile` để gộp thành một file HTML tự chứa,
nhờ đó bản dist vẫn mở được bằng `file://` như bản gốc.
