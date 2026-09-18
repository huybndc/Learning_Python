# Ôn tập Logic Circuit

App học theo chương, **song ngữ Việt/Anh**, chạy hoàn toàn offline trong trình duyệt.
Mỗi chương có 4 mục con: **Lý thuyết → Ví dụ minh hoạ → Tương tác → Luyện tập**.
Nút VI/EN ở góc trên phải; lựa chọn được nhớ lại giữa các lần mở.

| Chương | Nội dung | Tương ứng sách |
|---|---|---|
| Ch.1 | Hệ đếm, chuyển cơ số, complement, số có dấu, mã BCD/parity | §1.1–1.11 |
| Ch.2 | Đại số Boolean, định lý, hàm bù, minterm/maxterm, 16 hàm & 8 cổng | §2.1–2.8 |
| Ch.3 | Gray code, K-map, Quine–McCluskey | Ch.3 |

> `graycode-kmap.html` ở thư mục gốc repo là **bản build** của project này.

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
├── index.html            # shell: nav 2 cấp + <!--#include --> từng chương
├── vite-plugin-include.js# plugin gộp partial HTML lúc build
├── src/
│   ├── style.css         # toàn bộ CSS
│   ├── main.js           # điểm vào: gọi các setup*Page()
│   ├── pages/chN.html    # markup từng chương (4 mục con)
│   ├── logic/            # hàm thuần, không đụng DOM — test bằng Node
│   ├── ui/               # đọc/ghi DOM, gắn sự kiện, gọi logic/
│   └── content/          # theory-chN.md — nội dung Lý thuyết từng chương
├── tests/                # test Vitest, mỗi file ứng với một module logic
└── scripts/              # tiện ích (kiểm tra độ dài file)
```

Quy tắc: `logic/` **không bao giờ** import từ `ui/`.

## Sửa nội dung Lý thuyết

Sửa thẳng `src/content/theory-chN.vi.md` (và bản `.en.md` tương ứng — Markdown
thường, có thể copy từ vault Obsidian `CAU_1st`). Trang tự render lại khi lưu
(`npm run dev`), không cần đụng code.

## Thêm/sửa chuỗi giao diện

Thêm khoá vào **cả hai** `src/i18n/vi/*.js` và `src/i18n/en/*.js`, rồi dùng
`T('khoá')` trong `src/ui/` hoặc `data-i18n="khoá"` trong markup.
`npm test` sẽ báo nếu hai từ điển lệch khoá hoặc lệch tham số `{…}`.

## Thêm một chương mới

1. `src/pages/ch4.html` — copy khung 4 mục con từ một chương có sẵn.
2. Thêm 1 dòng `<!--#include src/pages/ch4.html -->` và 1 nút tab trong `index.html`.
3. `src/content/theory-ch4.md` + `mountTheory('#theory-ch4-body', md)` trong `main.js`.
4. Logic mới vào `src/logic/`, UI vào `src/ui/`, test vào `tests/`.

## Checklist đối chiếu với sách/slide

**Chương 1 — Hệ đếm & mã nhị phân**
- [ ] Lý thuyết: đủ 10 mục (§1.1–1.11), bảng và khối code render đúng
- [ ] Ví dụ: chia lấy dư (Ex 1.1–1.2), nhân lấy phần nguyên (Ex 1.3), gộp nhóm bit (§1.4)
- [ ] Ví dụ: bảng mã BCD/2421/Excess-3 + đánh dấu mã tự bù, cộng BCD có hiệu chỉnh +6
- [ ] Ví dụ: parity — lật 1 bit thì phát hiện được, lật 2 bit thì không
- [ ] Tương tác: đổi cơ số nhiều chiều, complement & trừ bằng complement có kiểm chứng ngược
- [ ] Tương tác: bảng 3 dạng số có dấu, cộng/trừ 2's complement chỉ rõ tràn số
- [ ] Luyện tập: sinh + chấm được cả 4 dạng, gợi ý đúng, đếm điểm

**Chương 2 — Đại số Boolean & cổng logic**
- [ ] Lý thuyết: đủ 8 mục (§2.1–2.8), có bảng Huntington và bảng định lý
- [ ] Ví dụ: 5 lời giải Example 2.1 (a–e), mỗi bước được kiểm chứng tự động
- [ ] Ví dụ: hai cách lấy hàm bù cho cùng kết quả, kèm bảng chân trị F/F′
- [ ] Tương tác: 8 cổng phản ứng theo (x, y); bảng 16 hàm highlight đúng dòng/cột
- [ ] Tương tác: bảng NAND/NOR đánh dấu 4/8 dòng lệch ⇒ không kết hợp
- [ ] Tương tác: SOP → toàn NAND, đếm đúng số cổng mỗi tầng, bảng chân trị khớp
- [ ] Luyện tập: 3 dạng; câu biểu thức chấm theo bảng chân trị (viết khác vẫn đúng)

**Chương 3 — Gray code & K-map**
- [ ] Ví dụ: bảng Gray đổi theo n = 1..5, reflect&prefix, bộ chuyển đổi hai chiều
- [ ] Biến đặt tên w, x, y, z (n=4) đúng quy ước Mano
- [ ] Thứ tự card: K-map → Kết quả rút gọn → Giải thích → Truth table
- [ ] Giải thích từng bước: mỗi bước một dòng `F = …` + một câu lý do
- [ ] Tương tác: K-map n = 2..5, click ô/hàng truth table, spec Σm/ΠM/d
- [ ] Tương tác: hover chip term làm sáng đúng nhóm trên K-map
- [ ] Luyện tập: kéo chọn vùng, nhóm wrap-around, chấm nhóm và biểu thức, xem đáp án
- [ ] Lý thuyết: 6 mục render đủ

**Chung**
- [ ] `npm test` pass
- [ ] `bash scripts/check_file_sizes.sh .` không báo file nào
- [ ] `npm run build` chạy được và `dist/index.html` mở trực tiếp bằng `file://`
- [ ] Hiển thị đúng ở cả light mode và dark mode
- [ ] Chuyển VI/EN đổi hết chuỗi, không sót tiếng Việt ở bản EN
- [ ] Lựa chọn ngôn ngữ được nhớ sau khi tải lại trang
