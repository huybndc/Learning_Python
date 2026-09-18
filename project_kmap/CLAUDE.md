# CLAUDE.md — project_kmap

App ôn tập Logic Circuit, điều hướng 2 cấp: **Chương → 4 mục con**
(Lý thuyết / Ví dụ minh hoạ / Tương tác / Luyện tập).

## Nguyên tắc
- Mỗi file một trách nhiệm, mục tiêu dưới ~300 dòng. Vượt thì tách tiếp
  (`bash scripts/check_file_sizes.sh .`).
- `src/logic/` là hàm thuần: nhận input, trả output, **không** đụng `document`/`window`.
- `src/ui/` đọc/ghi DOM và gọi `logic/`. `logic/` không bao giờ import từ `ui/`.
- Không sang milestone mới khi `npm test` đang fail.

## Quy ước
- Test đặt ở `tests/<tên-module-logic>.test.js`, một file test cho một file trong `src/logic/`.
- Module logic của chương N đặt tên theo chủ đề (`number-systems.js`), riêng phần
  sinh/chấm đề thì đặt `chN-quiz.js`; UI tương ứng là `chN-<mục con>-page.js`.
- Hàm sinh đề trả về `{ kind, text, answer, hint, meta }` — `meta` giữ tham số ở
  dạng có cấu trúc để test kiểm chứng lại mà không phải bóc tách chuỗi đề.
- Biến đổi biểu thức Boolean (dual, DeMorgan) **phải** làm trên cây cú pháp
  (`logic/bool-ast.js`), không làm trên chuỗi ký tự — AND viết liền và dấu ngoặc
  đều mang thông tin ưu tiên.
- Nội dung học tập dạng văn bản để ở `src/content/*.md`, import bằng `?raw` của Vite.
- Comment và chuỗi hiển thị viết bằng tiếng Việt, giữ nguyên văn phong bản gốc.
- Tên biến công khai của thuật toán (`A/B/C/D/E`, `imp = {v, d}`) giữ nguyên như bản gốc.

## Điều hướng & markup
Điều hướng 2 cấp: Chương (`#chapter-tabs`) → 4 mục con (`.subtabs`), quản lý ở
`src/ui/chapter-nav.js`. Nút nhảy chéo khai báo bằng `data-goto="ch3:interactive"`,
không cần gắn listener riêng.

`index.html` chỉ là shell; markup mỗi chương nằm ở `src/pages/chN.html`, gộp lúc
build bằng `<!--#include src/pages/chN.html -->` (plugin `vite-plugin-include.js`).
Thêm chương mới thì thêm 1 file partial + 1 dòng include + 1 nút tab.

## Tab Lý thuyết
Mỗi chương có `src/content/theory-chN.md`, import bằng `?raw` trong `main.js` rồi
gắn bằng `mountTheory('#theory-chN-body', md)` (`src/ui/theory-page.js`).
Thêm/sửa bài học thì sửa file `.md`, không đụng code.
CSS của trang gom trong khối `.theory-body` ở `src/style.css`.

## Build
`npm run build` dùng `vite-plugin-singlefile` để gộp thành một file HTML tự chứa,
nhờ đó bản dist vẫn mở được bằng `file://` như bản gốc.
