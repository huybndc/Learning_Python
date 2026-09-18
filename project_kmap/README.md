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

## Checklist đối chiếu với bản gốc

Bản gốc là commit trước của `../graycode-kmap.html` (file HTML tự chứa viết tay).
Sau mỗi thay đổi lớn, đối chiếu lại từng mục:

**Tab Gray code**
- [ ] Bảng Gray đổi theo n = 1..5, bit đổi được gạch chân đỏ (hàng đầu so hàng cuối)
- [ ] Dòng tổng kết ghi đúng số mã và nhắc chu trình Hamilton
- [ ] "Bước tiếp" chạy đủ reflect → prefix tới n = 5 rồi tự khoá nút
- [ ] "Về đầu" đưa lại n = 1
- [ ] Converter đổi được hai chiều, in đủ các bước XOR và giá trị thập phân
- [ ] Converter báo lỗi khi nhập ký tự khác 0/1 hoặc quá 12 bit
- [ ] Nút "Sang phần K-map" nhảy tab và cuộn lên đầu

**Tab K-map**
- [ ] Đổi n = 2..5 (n = 5 hiện 2 sheet A=0 / A=1)
- [ ] Click ô K-map và click hàng truth table đều đổi 0 → 1 → X
- [ ] Ô "Biểu thức" nhận Σm(...), ΠM(...), d(...); spec sai hiện thông báo lỗi
- [ ] SOP/POS, dòng chi phí (term/literal/số PI) và legend khớp nhau
- [ ] Hover chip term làm sáng đúng nhóm trên K-map (các nhóm khác mờ đi)
- [ ] Giải thích từng bước: Next/Back/Bắt đầu lại, K-map vẽ nhóm của bước hiện tại

**Tab Luyện tập**
- [ ] "Tạo hàm ngẫu nhiên" sinh đề mới, có/không don't care theo checkbox
- [ ] Kéo chuột quét được vùng chữ nhật; click từng ô chọn được nhóm wrap-around
- [ ] Chốt nhóm / Bỏ chọn / Xoá nhóm cuối / Xoá hết nhóm
- [ ] "Kiểm tra" chấm được: nhóm sai, nhóm chưa lớn nhất, chưa phủ hết ô 1,
      biểu thức sai, biểu thức sai cú pháp, biểu thức đúng nhưng chưa tối giản
- [ ] "Xem đáp án" vẽ các nhóm tối ưu và giải thích từng term

**Tab Lý thuyết**
- [ ] Nội dung `src/content/theory.md` render đủ 6 mục, có bảng và khối code
- [ ] Nút "Đọc lý thuyết ▶" ở tab Gray code nhảy đúng tab
- [ ] Hiển thị đúng ở cả light mode và dark mode

**Chung**
- [ ] `npm test` pass
- [ ] `npm run build` chạy được và `dist/index.html` mở trực tiếp bằng `file://`
