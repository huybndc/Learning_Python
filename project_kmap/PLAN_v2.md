# PLAN v2 (bản chốt) — App ôn tập Logic Circuit theo chương

## Bối cảnh & đánh giá hiện trạng

`project_kmap` hiện tại (9/9 milestone của PLAN.md gốc đã xong) là một công cụ
**đơn chủ đề, chất lượng cao**: Gray code + K-map/Quine–McCluskey, kiến trúc
`logic/` (thuần, có test) tách khỏi `ui/` (DOM), build ra 1 file HTML tự chứa,
674 dòng test Vitest. Đây là nền tảng kỹ thuật tốt để mở rộng — **không cần
viết lại**, chỉ cần tái cấu trúc lớp điều hướng và bổ sung nội dung/tương tác
mới theo cùng khuôn mẫu.

Khoảng trống so với sách (`Digital Design...6th ed.`) và slide:
- **Chapter 1** (Digital Systems and Binary Numbers): chưa có gì trong app.
- **Chapter 2** (Boolean Algebra and Logic Gates): phần tiên đề, định lý,
  minterm/maxterm, canonical SOP/POS đã học qua chat nhưng **chưa số hoá**;
  phần 16 hàm 2 biến, 8 cổng chuẩn, rút gọn đại số bằng định lý, hàm bù
  (complement) qua DeMorgan/dual — **chưa có trong app lẫn theory.md**.
- **Chapter 3** (Gate-Level Minimization): đã có đầy đủ (Gray code + K-map).

## Mục tiêu kiến trúc mới

Đổi điều hướng 2 cấp: **Chương** (tab ngoài) → **4 mục con** (sub-tab):
`Lý thuyết` / `Ví dụ minh hoạ` / `Tương tác` / `Luyện tập`.

```
Chương 1: Hệ đếm & mã nhị phân     [Lý thuyết|Ví dụ|Tương tác|Luyện tập]
Chương 2: Đại số Boolean & cổng logic [Lý thuyết|Ví dụ|Tương tác|Luyện tập]
Chương 3: Gray code & K-map         [Lý thuyết|Ví dụ|Tương tác|Luyện tập]  ← nội dung cũ, sắp xếp lại
```

Nội dung 4 tab cũ (Gray code, K-map, Lý thuyết, Luyện tập) được **map lại**
làm 4 mục con của "Chương 3", không xoá không viết lại logic — chỉ đổi
điều hướng bọc ngoài.

### Cấu trúc thư mục dự kiến

```
project_kmap/
├── index.html                # shell: 3 chương x 4 sub-tab, mount points
├── src/
│   ├── logic/
│   │   ├── gray.js, quine-mccluskey.js, kmap-layout.js,          (giữ nguyên — Ch.3)
│   │   │   expr-parser.js, practice-check.js, explain.js,
│   │   │   random-function.js
│   │   ├── number-systems.js       [MỚI Ch.1] convert base r↔r, tách phần nguyên/lẻ
│   │   ├── complements.js          [MỚI Ch.1] radix/diminished-radix complement, trừ bằng complement
│   │   ├── signed-binary.js        [MỚI Ch.1] signed-magnitude/1's/2's-complement, cộng/trừ có dấu, overflow
│   │   ├── binary-codes.js         [MỚI Ch.1] BCD (+cộng có hiệu chỉnh), 2421, Excess-3, parity
│   │   ├── boolean-algebra.js      [MỚI Ch.2] áp định lý từng bước, đếm term/literal
│   │   ├── boolean-complement.js   [MỚI Ch.2] bù hàm qua DeMorgan tổng quát & qua dual
│   │   └── logic-gates.js          [MỚI Ch.2] bảng 16 hàm F0-F15, phân loại, mở rộng multi-input NAND/NOR/XOR
│   ├── ui/
│   │   ├── (giữ nguyên các file Ch.3 cũ, đổi tên nhẹ nếu cần)
│   │   ├── chapter-nav.js          [MỚI] điều hướng 2 cấp chương→sub-tab (thay tabs.js cũ)
│   │   ├── ch1-*.js                [MỚI] 4 file ui cho 4 sub-tab Chương 1
│   │   └── ch2-*.js                [MỚI] 4 file ui cho 4 sub-tab Chương 2
│   └── content/
│       ├── theory-ch1.md           [MỚI]
│       ├── theory-ch2.md           [MỚI]
│       └── theory.md → đổi tên theory-ch3.md (nội dung giữ nguyên)
├── tests/                     # 1 file test / 1 file logic, như quy ước cũ
└── PLAN.md (cũ, đã DONE) + PLAN_v2.md (file này)
```

Quy ước từ `CLAUDE.md` giữ nguyên: file <300 dòng, `logic/` không đụng DOM,
comment/chuỗi hiển thị tiếng Việt, không sang milestone mới khi `npm test` fail.

## Milestone (xen kẽ Ch.1 / Ch.2, mỗi milestone dùng được ngay)

Mỗi milestone: code → `npm test` pass → đối chiếu tay → commit → báo ngắn gọn.

---

### Milestone A — Khung điều hướng 2 cấp (chuẩn bị, không đổi nội dung)
- Viết `chapter-nav.js` thay `tabs.js`: quản lý chương đang mở + sub-tab đang mở.
- Bọc 4 tab cũ vào "Chương 3", đổi nhãn, giữ nguyên toàn bộ hành vi.
- `theory.md` → đổi tên `theory-ch3.md`, sửa import trong `theory-page.js`.
- **Xong khi:** app trông giống hệt cũ về hành vi, chỉ khác điều hướng có
  thêm 1 cấp "Chương 3" bao ngoài; `npm test` pass.

---

### Milestone B — Ch.1: Lý thuyết + Ví dụ minh hoạ (hệ đếm cơ số)
- `logic/number-systems.js`: chuyển đổi base r ↔ decimal ↔ base r' (nhị/bát/thập lục phân), có/không phần lẻ.
- `content/theory-ch1.md`: §1.2–1.4 (hệ đếm, cơ số r, bit, chuyển đổi, octal/hex).
- Ví dụ minh hoạ tái hiện Example 1.1–1.3 (chia lấy dư, nhân lấy phần nguyên) — hiển thị từng bước như bảng trong slide.
- Test: round-trip convert đúng cho nhiều base; case có phần lẻ.
- **Xong khi:** sub-tab Lý thuyết + Ví dụ của Chương 1 dùng được, test pass.

---

### Milestone C — Ch.2: Lý thuyết + Ví dụ (phần còn thiếu của Boolean Algebra)
- `content/theory-ch2.md`: bổ sung mục *chưa có* — hàm Boolean qua truth
  table/mạch, rút gọn đại số bằng định lý (Example 2.1), hàm bù qua DeMorgan
  mở rộng & qua dual (Example 2.2–2.3). (Phần Huntington/minterm/maxterm/
  canonical SOP-POS đã dạy qua chat — viết lại thành nội dung ở đây luôn,
  vì hiện chưa nằm trong file nào của app.)
- `logic/boolean-algebra.js`: áp một số định lý cơ bản lên biểu thức mẫu,
  trả về từng bước rút gọn (tương tự Example 2.1) + đếm term/literal trước/sau.
- Test: các case rút gọn mẫu từ Example 2.1 phải khớp kết quả sách.
- **Xong khi:** sub-tab Lý thuyết + Ví dụ Chương 2 phản ánh đủ nội dung sách
  2.2–2.6, test pass.

---

### Milestone D — Ch.1: Tương tác + Luyện tập (complement & số có dấu)
- `logic/complements.js` + `logic/signed-binary.js`.
- Tương tác: nhập số ở 1 cơ số bất kỳ, đổi qua cơ số khác theo từng bước
  (giống bộ converter Gray code hiện có — tái dùng UI pattern `conv-steps`).
  Thêm ô tính (r-1)'s complement / r's complement, và trừ bằng complement.
  Thêm minh hoạ signed-magnitude / 1's-complement / 2's-complement + phát
  hiện overflow khi cộng.
- Luyện tập: sinh đề ngẫu nhiên (đổi cơ số, hoặc trừ bằng 2's complement),
  chấm đáp án.
- Test: complement round-trip, cộng/trừ có dấu khớp ví dụ 1.5–1.8 trong slide.
- **Xong khi:** đủ 4 sub-tab của Chương 1, test pass, đối chiếu tay với ví dụ
  slide 1.5–1.8.

---

### Milestone E — Ch.2: Tương tác + Luyện tập (16 hàm & 8 cổng logic)
- `logic/logic-gates.js`: bảng 16 hàm F0–F15 (2 biến), tự phân loại 3 nhóm
  (constant / unary / binary-operator), liệt kê 8 cổng chuẩn với ký hiệu.
- Tương tác: chọn 2 giá trị x,y → xem đồng thời kết quả 8 cổng (AND/OR/NAND/
  NOR/XOR/XNOR/complement/transfer); minh hoạ mở rộng multi-input NAND/NOR
  (chỉ ra tính không kết hợp) và cascaded-NAND-implements-SOP (Fig 2.7c).
- Luyện tập: cho bảng chân trị 2 biến ngẫu nhiên → yêu cầu chọn đúng cổng/Fi
  tương ứng; hoặc cho biểu thức AND-OR → yêu cầu chuyển thành toàn NAND.
- Test: bảng 16 hàm sinh đúng theo định nghĩa; phân loại đúng nhóm.
- **Xong khi:** đủ 4 sub-tab Chương 2, test pass.

---

### Milestone F — Hoàn thiện chéo
- `theory-ch1.md` bổ sung nốt các mục chưa làm ở Milestone B/D (mã BCD +
  cộng BCD có hiệu chỉnh +6, mã 2421/Excess-3/ASCII/parity, thanh ghi, logic
  nhị phân cơ bản — phần này có thể chỉ cần Lý thuyết + 1-2 ví dụ, không cần
  tương tác riêng nếu thời lượng hạn chế).
- Đối chiếu toàn bộ 3 chương với sách/slide theo checklist mới trong README.
- `bash scripts/check_file_sizes.sh .` — tách tiếp file nào vượt 300 dòng.
- `npm run build` xác nhận `dist/index.html` vẫn mở được bằng `file://`.
- **Xong khi:** không còn khoảng trống nội dung lớn so với Ch.1–3; test +
  build đều pass.

---

## Các quyết định chốt (thay vì để ngỏ)

1. **Độ sâu Ch.1 phần mã hoá (BCD/2421/Excess-3/ASCII/parity, §1.7–1.9):**
   → Chỉ Lý thuyết + Ví dụ, gộp vào Milestone F. Lý do: đây là các bảng mã
   tra cứu (không có thuật toán rút gọn/tối ưu như K-map), nên "Tương tác"
   thực sự hữu ích chỉ ở phần cộng BCD có hiệu chỉnh +6 và parity — hai điểm
   này được thêm dưới dạng ví dụ minh hoạ có thao tác (nhập số, xem bước
   hiệu chỉnh), không cần dựng riêng sub-tab Tương tác/Luyện tập đầy đủ.
2. **Vị trí Gray code:** giữ nguyên trong Chương 3 (gắn với K-map), có thêm
   một dòng tham chiếu chéo ở cuối `theory-ch1.md` trỏ sang Chương 3. Lý do
   sư phạm: Gray code chỉ thực sự "cần dùng" khi học K-map; tách nó về
   Chương 1 sẽ làm gián đoạn mạch học K-map hiện có mà không tăng thêm hiểu
   biết gì mới ở giai đoạn đó.
3. **Huntington's postulates / minterm–maxterm / canonical SOP-POS:** đưa
   toàn bộ vào Milestone C, soạn lại từ sách (không có nguồn Obsidian riêng
   nào khác cho phần này ngoài vault chung `CAU_1st`). Đây cũng là dịp để
   nội dung đã học qua chat được "chốt" thành tài liệu tham khảo cố định
   thay vì chỉ nằm trong lịch sử hội thoại.

## Bản chốt milestone (không đổi so với bản nháp)

Thứ tự A → B → C → D → E → F giữ nguyên như trên. Không có milestone nào bị
gộp/xoá — chỉ độ sâu nội dung của một vài mục trong Milestone F được thu hẹp
theo quyết định #1.
