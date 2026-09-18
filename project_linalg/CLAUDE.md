# CLAUDE.md — project_linalg

App ôn tập Đại số tuyến tính (khung Strang / MIT 18.06), điều hướng 2 cấp:
**Chương → 4 mục con** (Lý thuyết / Ví dụ minh hoạ / Tương tác / Luyện tập).
Kế thừa nguyên khung của `project_kmap`; khác biệt duy nhất về kiến trúc là
có thêm tầng `src/geometry/`.

## Nguyên tắc
- Mỗi file một trách nhiệm, mục tiêu dưới ~300 dòng (`bash scripts/check_file_sizes.sh .`).
- Ba tầng, ranh giới rõ ràng:
  - `src/logic/` — toán thuần (vector, ma trận, khử Gauss). Nhận số, trả số.
    **Không** biết pixel, **không** đụng `document`/`window`.
  - `src/geometry/` — "vẽ ở đâu": đổi toạ độ toán ↔ pixel, cắt đường thẳng theo
    khung nhìn, nội suy animation. Thuần, **không** đụng DOM, **không** làm toán
    tuyến tính (gọi sang `logic/` nếu cần).
  - `src/ui/` — đọc/ghi DOM và canvas, ráp `logic/` với `geometry/`.
- `logic/` và `geometry/` không bao giờ import từ `ui/` (`tests/i18n.test.js` canh).
- Không sang milestone mới khi `npm test` đang fail.
- **Mỗi phiên làm tối đa 2 milestone**, xong thì cập nhật `PLAN.md` và gửi lại
  file đó cho Huy rồi dừng. Trạng thái hiện tại và việc làm tiếp luôn nằm ở đầu
  `PLAN.md`.

## Quy ước
- Test ở `tests/<tên-module>.test.js`, một file test cho một file logic/geometry.
- Module của chương N: phần sinh/chấm đề đặt `chN-quiz.js`; UI tương ứng là
  `chN-<mục con>-page.js`.
- Hàm sinh đề trả về `{ kind, textKey, textParams, answer, hintKey, hintParams, meta }`
  — `meta` giữ tham số ở dạng có cấu trúc để test kiểm chứng lại mà không phải
  bóc tách chuỗi đề.
- Chấm bài **theo giá trị số có sai số cho phép** (`logic/answer-check.js`),
  không so chuỗi: `3, -2` và `(3, -2)` và `3 -2` đều phải được chấp nhận.
- Số hiển thị đi qua `logic/num-format.js` (`fmt`): hệ số kiểu 2/3 viết thành
  phân số chứ không phải `0.667`.
- Nội dung học tập dạng văn bản để ở `src/content/*.md`, import bằng `?raw`.
- Comment và chuỗi hiển thị viết bằng tiếng Việt, bản EN dịch song song.

## Tầng hình học
- Vector là mảng số: `[x, y]` trong R², `[x, y, z]` trong R³.
- Ma trận là mảng các hàng: `[[a, b], [c, d]]`.
- Toạ độ "thế giới" (world) là toạ độ toán học, **y hướng lên**. Toạ độ pixel là
  toạ độ canvas, **y hướng xuống**. `createView()` giữ tỉ lệ vuông để góc vuông
  trên hình đúng là góc vuông.
- Thư viện đồ hoạ quyết định **theo từng chương**, ghi lại ở đầu mỗi milestone
  trong `PLAN.md`. Hiện tại: **Canvas 2D thuần cho tất cả, kể cả 3D** — dự án
  không có phụ thuộc đồ hoạ ngoài nào. Lý do và số đo cụ thể ở mục
  "Quyết định 3D" trong `PLAN.md`.
- 3D: `geometry/space3d.js` là camera quay quanh điểm ngắm (chiếu phối cảnh,
  tia chuột, kéo–thả), `geometry/polygon3d.js` cắt đa giác và sắp thứ tự vẽ.
  Cả hai **thuần và có test**; `ui/canvas3d.js` chỉ nhận danh sách "vật" rồi
  vẽ. Muốn đổi sang WebGL sau này thì chỉ phải viết lại `ui/canvas3d.js`.
- Vẽ 3D bằng thuật toán người thợ sơn: **luôn cắt đa giác/đoạn thẳng theo mặt
  phẳng của nhau trước khi sắp thứ tự**, nếu không thì hai mặt cắt nhau sẽ vẽ
  sai (mặt này đè hẳn lên mặt kia).

## Song ngữ VI/EN
- Chuỗi UI lấy qua `T(key, params)` (`src/i18n/index.js`). Bí danh import **luôn
  là `T`** — không dùng `t` (đụng biến cục bộ) hay `tr`.
- Markup tĩnh dùng `data-i18n` / `-html` / `-ph` / `-title`.
- Từ điển ở `src/i18n/{vi,en}/{common,chN}.js`. Hai bản **bắt buộc cùng tập khoá
  và cùng tham số `{…}`** — `tests/i18n.test.js` canh việc này.
- `logic/` và `geometry/` **không được** biết ngôn ngữ: ném `AppError(key, params)`
  (`logic/app-error.js`) hoặc trả về `labelKey/reasonKey/textKey` + params.
  `ui/` dịch bằng `T()` / `tError()`.

## Điều hướng & markup
Chương (`#chapter-tabs`) → 4 mục con (`.subtabs`), quản lý ở `src/ui/chapter-nav.js`.
Nút nhảy chéo khai báo bằng `data-goto="ch2:interactive"`.

`index.html` chỉ là shell; markup mỗi chương nằm ở `src/pages/chN.html`, gộp lúc
build bằng `<!--#include src/pages/chN.html -->` (`vite-plugin-include.js`).
Thêm chương mới thì thêm 1 file partial + 1 dòng include + 1 nút tab.

## Tab Lý thuyết
Mỗi chương có `src/content/theory-chN.{vi,en}.md`, import bằng `?raw` trong
`main.js` rồi gắn bằng `mountTheory('#theory-chN-body', md)`. Hai bản phải cùng
số heading cấp 2. Sửa bài học thì sửa file `.md`, không đụng code.

## Build
`npm run build` dùng `vite-plugin-singlefile` để gộp thành một file HTML tự chứa,
mở được trực tiếp bằng `file://`.
