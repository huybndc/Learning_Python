# Gray code & Karnaugh map

Công cụ trực quan hỗ trợ môn Logic Circuit — chạy hoàn toàn offline trong trình duyệt.

> Đây là bản tái cấu trúc nhiều file của `graycode-kmap.html` (file HTML tự chứa ở thư mục gốc repo).

## Cách chạy

```bash
cd project_kmap
npm install
npm run dev      # mở http://localhost:5173
```

## Cách test

```bash
npm test         # Vitest, chạy một lần
npm run test:watch
```

## Build bản chia sẻ

```bash
npm run build    # -> dist/index.html (một file tự chứa, mở được bằng file://)
```

## Cấu trúc

```
project_kmap/
├── index.html            # markup 4 tab + mount point
├── src/
│   ├── style.css         # toàn bộ CSS
│   ├── main.js           # điểm vào: gọi các setup*Page()
│   ├── logic/            # hàm thuần, không đụng DOM — test bằng Node
│   ├── ui/               # đọc/ghi DOM, gắn sự kiện, gọi logic/
│   └── content/          # nội dung Markdown cho tab Lý thuyết
├── tests/                # test Vitest, mỗi file ứng với một module logic
└── scripts/              # tiện ích (kiểm tra độ dài file)
```

Quy tắc: `logic/` **không bao giờ** import từ `ui/`.

## Sửa nội dung tab Lý thuyết

Sửa thẳng `src/content/theory.md` (Markdown thường, có thể copy từ vault Obsidian `CAU_1st`).
Trang tự render lại khi lưu (`npm run dev`), không cần đụng code.
