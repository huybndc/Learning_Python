# Ôn tập Đại số tuyến tính

App học theo chương, **song ngữ Việt/Anh**, chạy hoàn toàn offline trong trình duyệt.
Mỗi chương có 4 mục con: **Lý thuyết → Ví dụ minh hoạ → Tương tác → Luyện tập**.
Nút VI/EN ở góc trên phải; lựa chọn được nhớ lại giữa các lần mở.

Giáo trình tham chiếu: Strang — *Linear Algebra and Its Applications* (MIT 18.06).

| Chương | Nội dung | Tương ứng sách |
|---|---|---|
| Ch.1 | Vector, cộng/nhân vô hướng, độ dài, dot product, góc, tổ hợp tuyến tính, span | Ch.1 |
| Ch.2 | Hệ phương trình, Ax = b, khử Gauss, ma trận bậc thang, hạng, phân loại nghiệm | Ch.2 |

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
│   ├── geometry/          # toạ độ ↔ pixel, cắt hình, nội suy — không đụng DOM
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
- [ ] **M1** — Ch.1 Vector
- [ ] **M2** — Ch.2 Giải hệ Ax = b
- [ ] **M3+** — dừng lại xin ý kiến trước khi chuyển sang Three.js (Ch.3)

## Checklist đối chiếu

**Chương 1 — Vector**
- [ ] Lý thuyết: định nghĩa vector, các phép toán, dot product, góc, span
- [ ] Ví dụ: cộng vector bằng hình bình hành có animate
- [ ] Tương tác: kéo mũi tên vector, toạ độ/độ dài/góc cập nhật realtime
- [ ] Luyện tập: sinh + chấm 4 dạng bài, chấm theo giá trị số có sai số

**Chương 2 — Giải hệ Ax = b**
- [ ] Lý thuyết: biểu diễn ma trận, khử Gauss, hạng, phân loại nghiệm
- [ ] Ví dụ: elimination từng bước, mỗi bước 1 dòng row-op + 1 câu lý do
- [ ] Tương tác: tự chọn row operation, hệ thống kiểm tra
- [ ] Luyện tập: sinh hệ 2×2/3×3, chấm nghiệm và phân loại đúng

**Chung (mọi chương)**
- [ ] `npm test` pass
- [ ] `check_file_sizes.sh` không báo file nào
- [ ] `npm run build` ra `dist/index.html` mở được bằng `file://`
- [ ] Light/dark mode đúng
- [ ] VI/EN đổi hết chuỗi, không sót
- [ ] Lựa chọn ngôn ngữ nhớ sau khi tải lại
