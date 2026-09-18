# Ôn tập Đại số tuyến tính

App học theo chương, **song ngữ Việt/Anh**, chạy hoàn toàn offline trong trình duyệt.
Mỗi chương có 4 mục con: **Lý thuyết → Ví dụ minh hoạ → Tương tác → Luyện tập**.
Nút VI/EN ở góc trên phải; lựa chọn được nhớ lại giữa các lần mở.

Giáo trình tham chiếu: Strang — *Linear Algebra and Its Applications* (MIT 18.06).

| Chương | Nội dung | Tương ứng sách |
|---|---|---|
| Ch.1 | Vector, cộng/nhân vô hướng, độ dài, dot product, góc, tổ hợp tuyến tính, span | Ch.1 |
| Ch.2 | Hệ phương trình, Ax = b, khử Gauss, ma trận bậc thang, hạng, phân loại nghiệm | Ch.2 |
| Ch.3 | Không gian con, column space, null space, độc lập tuyến tính, cơ sở, số chiều | Ch.3 |

## Cách chạy

```bash
cd project_linalg
npm install
npm run dev      # mở http://localhost:5173
```

## Cách test

```bash
npm test         # Vitest, chạy một lần
npm run test:watch
bash scripts/check_file_sizes.sh .   # cảnh báo file vượt 300 dòng
```

## Build bản chia sẻ

```bash
npm run build    # -> dist/index.html (một file tự chứa, mở được bằng file://)
```

## Cấu trúc

```
project_linalg/
├── index.html             # shell: nav 2 cấp + <!--#include --> từng chương
├── vite-plugin-include.js # plugin gộp partial HTML lúc build
├── src/
│   ├── style.css          # toàn bộ CSS
│   ├── main.js            # điểm vào: gọi các setup*Page()
│   ├── pages/chN.html     # markup từng chương (4 mục con)
│   ├── logic/             # toán thuần — không biết pixel, không đụng DOM
│   ├── geometry/          # 2D: toạ độ ↔ pixel, cắt hình, nội suy
│   │                      # 3D: camera xoay, chiếu phối cảnh, cắt đa giác
│   │                      # (tự viết, không dùng thư viện đồ hoạ ngoài)
│   ├── ui/                # DOM + canvas, ráp logic/ với geometry/
│   ├── i18n/{vi,en}/      # từ điển song ngữ
│   └── content/           # theory-chN.{vi,en}.md — nội dung tab Lý thuyết
├── tests/                 # Vitest, mỗi file ứng với một module logic/geometry
└── scripts/               # tiện ích (kiểm tra độ dài file)
```

Quy tắc: `logic/` và `geometry/` **không bao giờ** import từ `ui/`.

## Sửa nội dung Lý thuyết

Sửa thẳng `src/content/theory-chN.vi.md` (và bản `.en.md` tương ứng).
Trang tự render lại khi lưu (`npm run dev`), không cần đụng code.

## Thêm/sửa chuỗi giao diện

Thêm khoá vào **cả hai** `src/i18n/vi/*.js` và `src/i18n/en/*.js`, rồi dùng
`T('khoá')` trong `src/ui/` hoặc `data-i18n="khoá"` trong markup.
`npm test` báo ngay nếu hai từ điển lệch khoá hoặc lệch tham số `{…}`.

## Tiến độ theo milestone

Kế hoạch đầy đủ ở `PLAN.md`.

- [x] **M0** — khung sườn: Vite, nav 2 cấp, song ngữ, `logic/vector.js`,
      `logic/matrix.js`, `geometry/plane2d.js` + test
- [x] **M1** — Ch.1 Vector
- [x] **M2** — Ch.2 Giải hệ Ax = b
- [x] **M3** — Ch.3 Không gian vector (3D tự viết trên Canvas 2D, không thêm
      phụ thuộc — lý do và số đo ở `PLAN.md`)
- [ ] **M4+** — dừng lại xin ý kiến trước khi sang Ch.4 (Orthogonality)

## Checklist đối chiếu

**Chương 1 — Vector**
- [x] Lý thuyết: định nghĩa vector, các phép toán, dot product, góc, span
- [x] Ví dụ: cộng vector bằng hình bình hành có animate
- [x] Ví dụ: dot product minh hoạ bằng hình chiếu, xoay v để thấy dấu đổi
- [x] Tương tác: kéo mũi tên vector, toạ độ/độ dài/góc cập nhật realtime
- [x] Tương tác: slider hệ số tổ hợp tuyến tính, span hiện bằng chấm mờ
- [x] Luyện tập: sinh + chấm 4 dạng bài, chấm theo giá trị số có sai số

**Chương 2 — Giải hệ Ax = b**
- [x] Lý thuyết: biểu diễn ma trận, khử Gauss, hạng, phân loại nghiệm
- [x] Ví dụ: elimination từng bước, mỗi bước 1 dòng row-op + 1 câu lý do
- [x] Ví dụ: hệ 2 ẩn vẽ thành hai đường thẳng, giao điểm là nghiệm
- [x] Tương tác: tự chọn row operation, hệ thống kiểm tra + gợi ý bước tiếp
- [x] Luyện tập: sinh hệ 2×2/3×3, chấm nghiệm và phân loại đúng

**Chương 3 — Không gian vector**
- [x] Lý thuyết: không gian con, C(A), N(A), độc lập, cơ sở, số chiều, định lý hạng
- [x] Ví dụ: span lớn dần qua 4 bước, có bước "thêm vector phụ thuộc mà span không đổi"
- [x] Ví dụ: C(A) và N(A) của cùng một ma trận vẽ chung một hình 3D
- [x] Tương tác: kéo vector trong R³, xoay camera, kiểm tra b có trong span không
- [x] Luyện tập: sinh + chấm 4 dạng, ba dạng chọn đáp án

**Chung (mọi chương)**
- [x] `npm test` pass (252 test)
- [x] `check_file_sizes.sh` không báo file nào
- [x] `npm run build` ra `dist/index.html` mở được bằng `file://`
- [x] Light/dark mode đúng
- [x] VI/EN đổi hết chuỗi, không sót
- [x] Lựa chọn ngôn ngữ nhớ sau khi tải lại
