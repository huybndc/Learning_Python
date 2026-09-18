# PLAN — project_linalg (Ôn tập Linear Algebra trực quan)

## Bối cảnh

`project_kmap` (Logic Circuit) đã chạy tốt: Vite + vanilla JS, `logic/` thuần
tách khỏi `ui/`, song ngữ VI/EN, nội dung Markdown, test Vitest theo module,
build ra 1 file HTML tự chứa. Sản phẩm Linear Algebra kế thừa **toàn bộ** khung
đó, chỉ khác ở tầng trực quan hoá — vector/ma trận cần không gian hình học
(2D/3D), không chỉ bảng chân trị như logic.

**Giáo trình:** khung chuẩn Strang (Linear Algebra and Its Applications /
MIT 18.06). Huy hiện học đến "giới thiệu vector, matrix, giải hệ phương trình
vector" — tương ứng Ch.1–2 của Strang.

**Vì sao khó hơn K-map:** K-map là dữ liệu rời rạc, vẽ bằng canvas 2D tĩnh là
đủ. Linear Algebra cần trực giác hình học liên tục (vector là mũi tên di
chuyển được, ma trận là phép biến đổi không gian, mặt phẳng/không gian con là
đối tượng 3D) — đồ hoạ phải **tương tác kéo-thả và animate**, không chỉ vẽ
tĩnh. Do đó quyết định công nghệ đồ hoạ **theo từng chương** (xem bên dưới),
thay vì cam kết một thư viện duy nhất từ đầu.

## Nguyên tắc kế thừa từ project_kmap (giữ nguyên)

- Mỗi file một trách nhiệm, mục tiêu dưới ~300 dòng (`check_file_sizes.sh`).
- `src/logic/` là hàm thuần (nhận input, trả output), không đụng
  `document`/`window`. `src/ui/` đọc/ghi DOM và gọi `logic/`. `logic/` không
  bao giờ import từ `ui/`.
- Test ở `tests/<tên-module-logic>.test.js`, một file test cho một file logic.
- `logic/` ném mã lỗi `{code, params}` (không biết ngôn ngữ); `ui/` dịch bằng
  `T()`.
- Nội dung lý thuyết ở `src/content/theory-chN.{vi,en}.md`, import bằng `?raw`.
- Điều hướng 2 cấp: Chương → 4 mục con (Lý thuyết / Ví dụ minh hoạ / Tương tác
  / Luyện tập). `index.html` là shell, mỗi chương là 1 partial include.
- Song ngữ bắt buộc cùng tập khoá, test canh lệch khoá/tham số.
- `npm run build` gộp thành 1 file HTML tự chứa (`vite-plugin-singlefile`).
- Không sang milestone mới khi `npm test` đang fail.

## Khác biệt cần thêm so với project_kmap

1. **Tầng hình học (`src/geometry/`)** — lớp mới, thuần, riêng biệt với
   `logic/`. Chứa các phép biến đổi toạ độ ↔ pixel/canvas, phép chiếu 3D→2D,
   nội suy animation (dùng cho cả Canvas 2D lẫn WebGL). `logic/` xử lý toán
   (số, ma trận, định thức...); `geometry/` xử lý "vẽ ở đâu"; `ui/` là chỗ
   ráp hai thứ đó vào DOM/canvas. Ranh giới rõ: `logic/` không biết pixel,
   `geometry/` không biết DOM.
2. **Thư viện đồ hoạ theo chương**, quyết định khi bắt đầu mỗi chương, dựa vào
   mức độ chương đó cần 3D thật:
   - Canvas 2D thuần: Ch.1–2 (vector 2D, hệ phương trình 2 biến, phép biến đổi
     tuyến tính trong mặt phẳng), Ch.5 (định thức là diện tích/thể tích 2D).
   - Thêm Three.js (WebGL): Ch.3–4 khi vào không gian 3 chiều thật sự cần xoay
     góc nhìn (span, independence trong R³, không gian con, eigenvector nhìn
     dưới dạng trục bất biến của phép biến đổi 3D).
   - Quyết định cụ thể ghi lại ở đầu mỗi milestone chương, không đổi giữa
     chừng một chương đã bắt đầu.
3. **Thư viện tính toán ma trận** (`src/logic/matrix.js`): tự viết (không cần
   math.js) vì phép toán ở trình độ nhập môn (cộng/nhân ma trận, định thức,
   Gauss elimination, RREF) — tự viết giúp mỗi bước trung gian trả về đúng
   dạng dữ liệu để hiển thị "step-by-step" giống cách `kmap-explain.js` làm.
4. **Không có "8 cổng logic" tương đương** — nhưng có tương đương về tinh
   thần: mỗi chương vẫn cần 1 bộ "thao tác chuẩn" người học bấm thử được
   (row operations, phép nhân ma trận-vector, chiếu vector...).

## Cấu trúc thư mục (nhánh từ project_kmap)

```
project_linalg/
├── index.html
├── vite-plugin-include.js       # copy nguyên từ project_kmap
├── package.json
├── CLAUDE.md                    # bản dịch nguyên tắc riêng cho linalg
├── README.md
├── PLAN.md                      # file này
├── src/
│   ├── style.css
│   ├── main.js
│   ├── pages/chN.html
│   ├── logic/                   # toán thuần: vector, matrix, elimination...
│   ├── geometry/                # MỚI: toạ độ↔pixel, chiếu 3D, animation math
│   ├── ui/                      # DOM + canvas/Three.js, gọi logic + geometry
│   ├── i18n/{vi,en}/{common,ch1,ch2,...}.js
│   └── content/theory-chN.{vi,en}.md
├── tests/
└── scripts/check_file_sizes.sh  # copy nguyên
```

## Lộ trình theo chương (Strang) — mỗi chương là 1 milestone lớn

### Milestone 0 — Khung sườn dự án (làm trước, không phụ thuộc chương nào)
- Bootstrap Vite, copy `vite-plugin-include.js`, `check_file_sizes.sh`,
  cấu trúc i18n rỗng, `chapter-nav.js`, `theory-page.js` (tái dùng gần như
  nguyên bản từ project_kmap).
- `src/logic/matrix.js` + `src/logic/vector.js`: các phép toán nền tảng
  (cộng, nhân vô hướng, tích vô hướng/chéo, nhân ma trận, chuyển vị) — dùng
  chung cho mọi chương sau.
- `src/geometry/plane2d.js`: hệ trục toạ độ 2D ↔ pixel, vẽ lưới, vẽ mũi tên
  vector, animation tuyến tính (dễ, làm trước để Ch.1–2 dùng ngay).
- **Xong khi:** `npm run dev` chạy, có 1 chương rỗng (placeholder) render
  đúng nav 2 cấp, test cho `matrix.js`/`vector.js` pass.

### Milestone 1 — Chương 1: Vectors (Strang Ch.1)
*Nội dung: vector là gì, cộng/trừ, nhân vô hướng, độ dài, tích vô hướng
(dot product), góc giữa hai vector, tổ hợp tuyến tính, span (trong R²).*
- Đồ hoạ: **Canvas 2D thuần**.
- Lý thuyết: `theory-ch1.{vi,en}.md`.
- Ví dụ minh hoạ: cộng vector bằng quy tắc hình bình hành (animate), dot
  product minh hoạ bằng hình chiếu.
- Tương tác: kéo đầu mũi tên vector, xem toạ độ/độ dài/góc cập nhật realtime;
  slider hệ số tổ hợp tuyến tính `c1*v1 + c2*v2` vẽ động.
- Luyện tập: sinh đề tính tổng/hiệu/dot product/góc, chấm theo giá trị số
  (sai số cho phép, không so chuỗi).
- **Xong khi:** checklist chương 1 (xem "Checklist đối chiếu" bên dưới) đạt
  đủ, test pass.

### Milestone 2 — Chương 2: Solving Linear Equations / Ax = b (Strang Ch.2)
*Nội dung: hệ phương trình tuyến tính, biểu diễn ma trận Ax=b, phép khử Gauss,
ma trận bậc thang (row echelon), hạng (rank), nghiệm duy nhất/vô số/vô
nghiệm — đúng phần Huy đang học.*
- Đồ hoạ: **Canvas 2D thuần** (hệ 2 ẩn: hai đường thẳng giao nhau; hệ 3 ẩn có
  thể trì hoãn phần vẽ 3D sang Ch.3 nếu cần, chỉ hiện bảng số ở Ch.2).
- Lý thuyết: `theory-ch2.{vi,en}.md`.
- Ví dụ minh hoạ: Gauss elimination từng bước, mỗi bước là 1 "row op" hiển
  thị rõ (`R2 = R2 - 2*R1`), giống tinh thần `kmap-explain.js` (mỗi bước 1
  dòng công thức + 1 câu lý do).
- Tương tác: người dùng tự chọn row operation để đưa ma trận về bậc thang,
  hệ thống kiểm tra từng bước.
- Luyện tập: sinh hệ phương trình 2×2/3×3 ngẫu nhiên, chấm nghiệm; phân loại
  vô nghiệm/vô số nghiệm.
- **Xong khi:** giải đúng cả 3 trường hợp nghiệm, test pass, đối chiếu
  checklist.

### Milestone 3 — Chương 3: Vector Spaces (Strang Ch.3)
*Nội dung: không gian con, column space, null space, independence, basis,
dimension.*
- Đồ hoạ: **thêm Three.js** — đây là điểm bắt đầu cần R³ thật (mặt phẳng đi
  qua gốc toạ độ, đường thẳng, giao của không gian con) và cần xoay góc nhìn
  bằng chuột để hiểu "phẳng" nghĩa là gì trong 3D.
- Tương tác: vẽ span của 1–2 vector trong R³ (đường thẳng/mặt phẳng), kiểm
  tra một vector có nằm trong span hay không, xoay camera tự do.
- **Quyết định kỹ thuật ghi ở đầu milestone này:** thêm `three` vào
  `package.json`, tạo `src/geometry/space3d.js` (camera, projection, raycast
  để kéo-thả vector trong 3D).

### Milestone 4 — Chương 4: Orthogonality (Strang Ch.4)
*Nội dung: trực giao, hình chiếu (projection), least squares, Gram-Schmidt.*
- Đồ hoạ: tiếp tục Three.js (kế thừa hạ tầng Ch.3).
- Tương tác nổi bật: minh hoạ least squares bằng "khoảng cách vuông góc nhỏ
  nhất" trực quan, Gram-Schmidt từng bước có animation.

### Milestone 5 — Chương 5: Determinants (Strang Ch.5)
*Nội dung: định thức, tính chất, công thức cofactor, định thức = thể tích.*
- Đồ hoạ: quay lại **Canvas 2D thuần** cho định nghĩa "định thức = diện tích
  hình bình hành" (2D dễ hiểu hơn, không cần 3D); nếu minh hoạ thể tích 3D thì
  tái dùng `space3d.js` đã có sẵn từ Ch.3.
- Tương tác: kéo 2 vector, xem diện tích hình bình hành = |det| cập nhật
  realtime.

### Milestone 6 — Chương 6: Eigenvalues and Eigenvectors (Strang Ch.6)
*Nội dung: trị riêng, vector riêng, chéo hoá, ứng dụng (Markov, hệ vi phân
tuyến tính cơ bản).*
- Đồ hoạ: Three.js — đây là chỗ trực quan hoá "ăn tiền" nhất: cho một phép
  biến đổi tuyến tính, vẽ trường vector và tô đậm trục bất biến (eigenvector),
  animate "không gian bị kéo giãn" dọc theo trục đó.
- Tương tác: nhập ma trận 2×2/3×3 tuỳ ý, hệ thống tính eigenvalue/eigenvector
  và animate phép biến đổi tương ứng lên lưới điểm.

### Milestone 7+ — Các chương sau (SVD, ứng dụng...)
- Để ngỏ, lập plan chi tiết khi Huy học tới, theo đúng mẫu các milestone
  trên (nội dung → quyết định đồ hoạ 2D/3D → lý thuyết/ví dụ/tương tác/luyện
  tập → điều kiện "xong khi").

## Checklist đối chiếu (mẫu, mở rộng dần theo README project_kmap)

**Chương 1 — Vectors**
- [ ] Lý thuyết: định nghĩa vector, các phép toán, dot product, góc, span
- [ ] Ví dụ: cộng vector bằng hình bình hành có animate
- [ ] Tương tác: kéo mũi tên vector, toạ độ/độ dài/góc cập nhật realtime
- [ ] Luyện tập: sinh + chấm 4 dạng bài, chấm theo giá trị số có sai số

**Chương 2 — Solving Ax = b**
- [ ] Lý thuyết: biểu diễn ma trận, Gauss elimination, rank, phân loại nghiệm
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

## Việc cần làm ngay (theo đúng tiến độ hiện tại của Huy)

Huy đang ở Ch.2 (giải hệ phương trình vector) → thực hiện theo thứ tự:
1. Milestone 0 (khung sườn + `matrix.js`/`vector.js`/`plane2d.js`)
2. Milestone 1 (Ch.1 — vì Ch.2 cần khái niệm vector/dot product làm nền)
3. Milestone 2 (Ch.2 — đúng chương đang học)
4. Dừng lại xin ý kiến trước khi sang Milestone 3 (điểm chuyển sang Three.js —
   quyết định kỹ thuật lớn, nên xác nhận lại lúc đó thay vì cam kết trước).
