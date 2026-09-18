# PLAN v3 — Đổi tên biến, sắp xếp lại K-map, song ngữ VI/EN

## Bối cảnh

Người dùng mới thử kỹ tab K-map (Chương 3) nên góp ý tập trung ở đó. Bốn góp ý:

1. Đổi tên biến từ `A/B/C/D` sang `w/x/y/z`.
2. Đảo thứ tự các card: K-map → Kết quả rút gọn → Giải thích → Truth table.
3. Thêm tiếng Anh đầy đủ; text cả VI lẫn EN súc tích hơn.
4. Phần "giải thích từng bước" đang rối — nên diễn đạt thành **Boolean function**.

Góp ý 2–4 là góp ý **về nguyên tắc**, không riêng K-map. Nên áp dụng cùng
nguyên tắc cho Chương 1 và Chương 2 (người dùng chưa thử tới nên chưa nhận xét
được, nhưng lỗi thiết kế là như nhau).

## Nguyên tắc rút ra & áp dụng toàn app

| Góp ý ở K-map | Nguyên tắc | Áp dụng chỗ khác |
|---|---|---|
| Đổi A/B → w,x,y,z | Dùng đúng ký hiệu sách Mano | Ch.2 (biểu thức mẫu, 16 hàm), Ch.1 (không có biến) |
| Kết quả trước dữ liệu thô | Đặt cái người học cần xem trước, bảng tra cứu xuống dưới | Ch.1: kết quả trước bảng tra mã; Ch.2: kết quả trước bảng 16 hàm |
| Giải thích thành Boolean function | Mỗi bước hiện **một dòng F = …** thay vì đoạn văn | Ch.1 bảng nhiều cột, Ch.2 bảng derivation |
| Text súc tích | Bỏ chữ thừa, câu ngắn, không lặp lại điều đã hiển thị | Toàn bộ |

## Quyết định chốt

1. **Quy ước tên biến theo Mano (Digital Design 6th ed.):**
   `n=2 → x,y` · `n=3 → x,y,z` · `n=4 → w,x,y,z` · `n=5 → v,w,x,y,z`.
   Tức là lấy **n ký tự cuối** của `v,w,x,y,z`, riêng n=2 dùng `x,y` (không phải
   `y,z`) cho khớp sách. Parser chấp nhận cả chữ hoa lẫn chữ thường.
2. **Ngôn ngữ:** nút chuyển VI/EN ở header, nhớ lựa chọn bằng `localStorage`.
   Mặc định VI. Chuỗi UI lấy qua `t(key)`; markup tĩnh dùng `data-i18n`.
   Nội dung lý thuyết tách thành `theory-chN.vi.md` / `theory-chN.en.md`.
3. **Thông báo lỗi của `logic/`** cũng phải song ngữ ⇒ `logic/` **ném mã lỗi**
   (`{ code, params }`) thay vì chuỗi tiếng Việt, `ui/` dịch sang ngôn ngữ đang
   chọn. Giữ nguyên tắc `logic/` không đụng DOM và không biết ngôn ngữ.
4. **Giải thích từng bước:** mỗi bước trả về `{ title, formula, reason, groups }`.
   `formula` là một dòng `F = …` duy nhất; `reason` là một câu. Bỏ danh sách
   `<ul>` dài và các đoạn văn giải thích trong HTML.

## Milestone

### Milestone G — [x] Đổi tên biến sang v/w/x/y/z
- `logic/quine-mccluskey.js`: `varNames(n)` theo quy ước Mano.
- Sửa regex `[A-Ea-e]` trong `expr-parser.js`, `nand-conversion.js`.
- Cập nhật biểu thức mẫu ở `boolean-examples.js`, `ch2-quiz.js`, placeholder HTML.
- **Xong khi:** `npm test` pass, K-map hiện `w x y z`, parser đọc được cả hoa/thường.

### Milestone H — [x] Sắp xếp lại card & giải thích thành Boolean function
*(gộp thực hiện cùng Milestone I để không phải viết chuỗi hai lần)*
- `src/pages/ch3.html`: đổi thứ tự card trong mục Tương tác.
- `logic/kmap-explain.js` (mới): sinh các bước dạng `{title, formula, reason}`.
- `ui/kmap-steps.js`: render gọn lại, bỏ HTML dài.
- Áp dụng nguyên tắc "kết quả trước dữ liệu thô" cho Ch.1 và Ch.2.
- **Xong khi:** mỗi bước chỉ còn 1 dòng công thức + 1 câu lý do; test pass.

### Milestone I — [x] Hạ tầng song ngữ + chuỗi UI
- `src/i18n/{index,vi,en}.js`; nút chuyển ngôn ngữ; `data-i18n` cho markup tĩnh.
- `logic/` đổi sang ném mã lỗi; `ui/` dịch.
- **Xong khi:** chuyển ngôn ngữ đổi hết chuỗi UI, không sót chuỗi cứng.

### Milestone J — [x] Nội dung lý thuyết EN + rút gọn VI
- `theory-chN.vi.md` (rút gọn) + `theory-chN.en.md` (dịch, cũng súc tích).
- **Xong khi:** cả 3 chương đọc được ở cả hai ngôn ngữ.

### Milestone K — [x] Rà soát chéo, kiểm chứng, mở PR
- Đối chiếu 12 mục con ở cả 2 ngôn ngữ, light/dark, 390px.
- `npm test` + `npm run build` + `check_file_sizes.sh`.
- Mở pull request.
