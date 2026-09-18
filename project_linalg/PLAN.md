# PLAN — project_linalg (Ôn tập Linear Algebra trực quan)

> **Đang ở đâu:** M0, M1, M2, M3 đã xong và đã push
> (nhánh `claude/new-session-skx1dd`). 252 test pass, `dist/index.html` 210 KB.
> **Làm tiếp:** Milestone 4 (Ch.4 — Orthogonality).

## Quy tắc làm việc giữa các phiên

- **Mỗi phiên làm tối đa 2 milestone.** Xong 2 milestone thì cập nhật file này,
  gửi lại `PLAN.md` cho Huy rồi dừng — phiên sau đọc lại file này là tiếp được
  ngay. Không làm dồn 3–4 milestone một lúc.
- Trước khi viết code ở phiên mới: đọc `PLAN.md`, `CLAUDE.md`, `README.md`,
  rồi chạy `npm test` để chắc chắn đang ở trạng thái sạch.
- Không sang milestone mới khi `npm test` đang fail.
- Mỗi quyết định kỹ thuật lớn (chọn/không chọn thư viện, đổi cách vẽ) phải ghi
  lại ngay trong file này, kèm lý do, số đo nếu có, và **điều kiện nào thì nên
  xem lại quyết định đó**.
- Milestone nào đổi khác so với kế hoạch ban đầu thì sửa thẳng vào đây, ghi rõ
  vì sao — đừng để kế hoạch và code nói hai chuyện khác nhau.

## Tình trạng từng milestone

| Milestone | Nội dung | Tình trạng |
|---|---|---|
| M0 | Khung sườn + `vector.js`, `matrix.js`, `plane2d.js` | ✅ xong |
| M1 | Ch.1 — Vector | ✅ xong |
| M2 | Ch.2 — Giải hệ Ax = b | ✅ xong |
| M3 | Ch.3 — Không gian vector (3D tự viết) | ✅ xong |
| M4 | Ch.4 — Orthogonality | ⬜ làm tiếp |
| M5 | Ch.5 — Determinants | ⬜ |
| M6 | Ch.6 — Eigenvalues & eigenvectors | ⬜ |
| M7+ | SVD và ứng dụng | ⬜ chưa lập plan chi tiết |

Những gì đã dựng sẵn và dùng lại được cho các chương sau:

- `logic/`: `vector.js`, `matrix.js`, `num-format.js`, `answer-check.js`,
  `elimination.js`, `linear-system.js`, `subspace.js`
- `geometry/`: `plane2d.js` (2D), `space3d.js` + `polygon3d.js` (3D, tự viết)
- `ui/`: `canvas2d.js`, `canvas3d.js`, `vector-draw.js`, `span-draw.js`,
  `matrix-view.js`, `drag.js`, `drag3d.js`, `chapter-nav.js`, `theory-page.js`
- Mẫu lặp lại cho mỗi chương: `pages/chN.html` (4 mục con) + `i18n/{vi,en}/chN.js`
  + `content/theory-chN.{vi,en}.md` + `logic/chN-quiz.js` + 3–4 file
  `ui/chN-*-page.js`, và một file test cho mỗi module logic/geometry.

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
   - 3D (Ch.3 trở đi): **đã đo và quyết định tự viết trên Canvas 2D**, không
     dùng Three.js — xem "Quyết định 3D" ở Milestone 3 bên dưới.
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

### Milestone 0 — Khung sườn dự án — ĐÃ XONG
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

### Milestone 1 — Chương 1: Vectors (Strang Ch.1) — ĐÃ XONG
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

### Milestone 2 — Chương 2: Solving Linear Equations / Ax = b (Strang Ch.2) — ĐÃ XONG
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

### Milestone 3 — Chương 3: Vector Spaces (Strang Ch.3) — ĐÃ XONG
*Nội dung: không gian con, column space, null space, independence, basis,
dimension.*
- Tương tác: vẽ span của 1–2 vector trong R³ (đường thẳng/mặt phẳng), kiểm
  tra một vector có nằm trong span hay không, xoay camera tự do.

**Quyết định 3D (đo thật rồi mới chọn):** plan ban đầu định thêm Three.js.
Đo bằng chính cấu hình build của project:

| Phương án | `dist/index.html` |
|---|---|
| Không có 3D (sau M2) | 160 KB |
| Three.js, cảnh tối giản | 287 KB |
| Three.js dùng thật (WebGLRenderer + OrbitControls + mặt trong suốt + raycast) | **703 KB** |
| Tự viết trên Canvas 2D (thực tế đã làm) | **200 KB** |

Chọn **tự viết**, vì ở mức nội dung của giáo trình này Three.js không đổi lại
được gì về khả năng học:

- Thứ cần vẽ chỉ là vài mũi tên, vài mặt phẳng qua gốc, một lưới và một
  camera xoay được — Canvas 2D làm đủ, và tương tác (xoay, kéo vector trong
  không gian, animate) không mất gì.
- Giữ được kỷ luật kiến trúc: toàn bộ toán 3D nằm ở `geometry/space3d.js` và
  `geometry/polygon3d.js` dưới dạng hàm thuần, **test được bằng Node**. Nếu
  dùng Three.js thì camera/projection/raycast nằm trong đối tượng WebGL,
  không test được nếu không dựng context đồ hoạ.
- Dự án giữ nguyên tính chất "không phụ thuộc ngoài, chạy offline từ một file".

Điểm phải tự làm bù: thuật toán người thợ sơn (vẽ xa trước, gần sau) vẽ sai
khi hai mặt phẳng **cắt nhau** — mà giao của hai không gian con lại đúng là
nội dung Ch.3. Xử lý bằng cách cắt đa giác (và cắt cả đoạn thẳng) theo mặt
phẳng của nhau trước khi sắp thứ tự; cắt xong thì không mảnh nào xuyên mảnh
nào nên người thợ sơn cho kết quả đúng (`geometry/polygon3d.js`).

**Xem lại quyết định này khi nào:** nếu một chương sau cần vẽ hàng nghìn vật
cùng lúc (ví dụ trường vector dày đặc ở Ch.6) thì Canvas 2D mới đuối. Lúc đó
đổi renderer chỉ đụng `ui/canvas3d.js`, vì phần toán đã tách sẵn ở
`geometry/`.

### Milestone 4 — Chương 4: Orthogonality (Strang Ch.4) — LÀM TIẾP Ở ĐÂY
*Nội dung: trực giao, hình chiếu (projection), least squares, Gram-Schmidt.*
- Đồ hoạ: **dùng lại nguyên hạ tầng 3D của Ch.3** (`geometry/space3d.js`,
  `geometry/polygon3d.js`, `ui/canvas3d.js`, `ui/drag3d.js`). Không phát sinh
  quyết định kỹ thuật mới.
- Đã có sẵn dùng lại được: `vector.js` có `projection`, `perpendicular`,
  `isOrthogonal`; `ui/vector-draw.js` có `drawProjection` (vẽ hình chiếu kèm
  đường gióng nét đứt và ký hiệu góc vuông) — Ch.1 đã dùng cho dot product 2D.
- Việc mới cần viết: `logic/orthogonal.js` (Gram-Schmidt từng bước,
  chiếu lên không gian con nhiều chiều, nghiệm least squares qua AᵀAx̂ = Aᵀb).
- Tương tác nổi bật: minh hoạ least squares bằng "khoảng cách vuông góc nhỏ
  nhất" trực quan, Gram-Schmidt từng bước có animation (dùng lại kiểu stepper
  của Ch.2: mỗi bước một công thức + một câu lý do).

### Milestone 5 — Chương 5: Determinants (Strang Ch.5)
*Nội dung: định thức, tính chất, công thức cofactor, định thức = thể tích.*
- Đồ hoạ: quay lại **Canvas 2D thuần** cho định nghĩa "định thức = diện tích
  hình bình hành" (2D dễ hiểu hơn, không cần 3D); nếu minh hoạ thể tích 3D thì
  tái dùng `space3d.js` đã có sẵn từ Ch.3 (`polygon3d.js` đã có
  `parallelogram3`).
- Đã có sẵn: `matrix.js` có `determinant`, `cofactor`, `minorMatrix`;
  `vector.js` có `cross2` (định thức 2×2) và `cross`.
- Tương tác: kéo 2 vector, xem diện tích hình bình hành = |det| cập nhật
  realtime.

### Milestone 6 — Chương 6: Eigenvalues and Eigenvectors (Strang Ch.6)
*Nội dung: trị riêng, vector riêng, chéo hoá, ứng dụng (Markov, hệ vi phân
tuyến tính cơ bản).*
- Đồ hoạ: mặc định vẫn Canvas 2D tự viết. **Đây là chương duy nhất có thể phải
  xem lại quyết định không dùng Three.js** — nếu trường vector cần vẽ hàng nghìn
  mũi tên cùng lúc thì Canvas 2D mới đuối. Cách làm: thử trước bằng lưới thưa
  (ví dụ 5×5×5 = 125 mũi tên), đo fps thật rồi mới quyết. Nếu phải đổi renderer
  thì chỉ viết lại `ui/canvas3d.js`, phần toán ở `geometry/` giữ nguyên.
- Nội dung trực quan: cho một phép biến đổi tuyến tính, vẽ trường vector và tô
  đậm trục bất biến (eigenvector), animate "không gian bị kéo giãn" dọc trục đó.
- Tương tác: nhập ma trận 2×2/3×3 tuỳ ý, hệ thống tính eigenvalue/eigenvector
  và animate phép biến đổi tương ứng lên lưới điểm.

### Milestone 7+ — Các chương sau (SVD, ứng dụng...)
- Để ngỏ, lập plan chi tiết khi Huy học tới, theo đúng mẫu các milestone
  trên (nội dung → quyết định đồ hoạ 2D/3D → lý thuyết/ví dụ/tương tác/luyện
  tập → điều kiện "xong khi").

## Checklist đối chiếu (mẫu, mở rộng dần theo README project_kmap)

**Chương 1 — Vectors**
- [x] Lý thuyết: định nghĩa vector, các phép toán, dot product, góc, span
- [x] Ví dụ: cộng vector bằng hình bình hành có animate
- [x] Tương tác: kéo mũi tên vector, toạ độ/độ dài/góc cập nhật realtime
- [x] Luyện tập: sinh + chấm 4 dạng bài, chấm theo giá trị số có sai số

**Chương 2 — Solving Ax = b**
- [x] Lý thuyết: biểu diễn ma trận, Gauss elimination, rank, phân loại nghiệm
- [x] Ví dụ: elimination từng bước, mỗi bước 1 dòng row-op + 1 câu lý do
- [x] Tương tác: tự chọn row operation, hệ thống kiểm tra
- [x] Luyện tập: sinh hệ 2×2/3×3, chấm nghiệm và phân loại đúng

**Chương 3 — Vector Spaces**
- [x] Lý thuyết: không gian con, C(A), N(A), độc lập, cơ sở, số chiều, định lý hạng
- [x] Ví dụ: span lớn dần, có bước thêm vector phụ thuộc mà span không đổi
- [x] Ví dụ: C(A) và N(A) của cùng một ma trận vẽ chung một hình 3D
- [x] Tương tác: kéo vector trong R³, xoay camera, kiểm tra b có trong span
- [x] Luyện tập: sinh + chấm 4 dạng, ba dạng chọn đáp án

**Chung (mọi chương)**
- [ ] `npm test` pass
- [ ] `check_file_sizes.sh` không báo file nào
- [ ] `npm run build` ra `dist/index.html` mở được bằng `file://`
- [ ] Light/dark mode đúng
- [ ] VI/EN đổi hết chuỗi, không sót
- [ ] Lựa chọn ngôn ngữ nhớ sau khi tải lại

## Việc cần làm ở phiên sau

1. Đọc `PLAN.md` (file này), `CLAUDE.md`, `README.md`; chạy `npm test` trong
   `project_linalg/` để chắc chắn 252 test vẫn pass.
2. **Milestone 4 — Ch.4 Orthogonality.**
3. **Milestone 5 — Ch.5 Determinants** (nếu còn sức trong cùng phiên).
4. Hết 2 milestone thì cập nhật file này, gửi lại `PLAN.md` cho Huy rồi dừng.

Chưa có câu hỏi nào đang chờ Huy quyết. Quyết định 3D đã chốt (xem Milestone 3),
chỉ xem lại nếu Ch.6 cần vẽ trường vector quá dày.
