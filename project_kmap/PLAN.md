# PLAN — Gray code & K-map (refactor + trang lý thuyết)

## Mục tiêu
1. Tách file `graycode-kmap.html` (1869 dòng, 1 file) thành project nhiều file
   theo `mini-project-setup`, giữ nguyên 100% hành vi/UI hiện có.
2. Chuyển bộ `runTests()` (chạy tay qua console) thành test Vitest thật, chạy
   bằng `npm test`, để mọi bước sau đều kiểm chứng được tự động.
3. Thêm tab "Lý thuyết" render nội dung Markdown, làm chỗ chứa ghi chú học tập
   (có thể copy thẳng từ vault Obsidian `CAU_1st`), giải quyết việc thiếu
   trang học tập.

## Phạm vi
**Làm:**
- Tách CSS / HTML / JS logic / JS UI thành các file riêng.
- Viết lại `runTests()` thành các file test Vitest theo từng module logic.
- Thêm tab Lý thuyết đọc file `.md`, render bằng thư viện markdown nhẹ.
- Giữ nguyên giao diện, hành vi, class CSS của 3 tab hiện có (Gray code,
  K-map, Luyện tập).

**Không làm (ngoài phạm vi lần này):**
- Không đổi thuật toán Quine–McCluskey hay công thức Gray/Binary.
- Không đổi thiết kế UI/UX (progress indicator, điều hướng tuần tự — để sau,
  xem hướng "3. Dọn UI/UX" đã trao đổi trước đó).
- Không xây hệ thống đồng bộ 2 chiều với Obsidian — chỉ đọc file `.md` tĩnh
  trong project.
- Không thêm backend/server — vẫn là site tĩnh chạy offline trong trình duyệt.

## Cấu trúc thư mục dự kiến

```
project_kmap/
├── index.html                      # shell HTML: 3 tab (Gray, K-map, Lý thuyết, Luyện tập) + mount point
├── src/
│   ├── style.css                   # toàn bộ CSS hiện có, nguyên trạng
│   ├── logic/                      # hàm thuần, không đụng DOM — test bằng Node
│   │   ├── gray.js                 # toBits, binToGray, grayToBin, grayList,
│   │   │                           #   binToGraySteps, grayToBinSteps, diffPositions
│   │   ├── quine-mccluskey.js      # popcount, literalCount, implicantMinterms,
│   │   │                           #   impCovers, impContains, primeImplicants,
│   │   │                           #   minimalCover, implicantToSOP/POS,
│   │   │                           #   minimizeSOP, minimizePOS, totalLiterals
│   │   ├── kmap-layout.js          # mapLayout, cellMinterm, mintermPositions,
│   │   │                           #   contiguousSegments, implicantRects
│   │   ├── expr-parser.js          # parseBoolExpr, exprTruthTable, sopStats,
│   │   │                           #   parseSpec, formatSpec, splitValues
│   │   └── practice-check.js       # cellsToImplicant, checkGroup
│   ├── ui/                         # đọc/ghi DOM, gắn sự kiện, gọi logic/
│   │   ├── dom-helpers.js          # $, el, HUES, GAP (tiện ích dùng chung)
│   │   ├── tabs.js                 # setupTabs, activateTab (đã thêm tab lý thuyết)
│   │   ├── gray-page.js            # renderGrayTable, gb* (reflect&prefix demo),
│   │   │                           #   renderConverter, setupGrayPage
│   │   ├── kmap-common.js          # buildMap, paintValues, rectStyle,
│   │   │                           #   drawGroups, setHot (dùng chung K-map & Luyện tập)
│   │   ├── kmap-page.js            # state K, kSetN/kBuild/kRefresh, renderTruthTable,
│   │   │                           #   renderExpr, explainTerm, buildSteps, renderStep,
│   │   │                           #   stepGo, randomValues, setupKmapPage, applySpec
│   │   ├── practice-page.js        # state P, pSetN/pBuild, cellUnder, pPointerDown,
│   │   │                           #   pSelectRect, pPaint, pNewProblem, pCommit,
│   │   │                           #   pCheck, pShowAnswer, setupPracticePage
│   │   └── theory-page.js          # MỚI: fetch + render file .md, setup tab lý thuyết
│   ├── content/
│   │   └── theory.md               # MỚI: nội dung lý thuyết (bắt đầu bằng card
│   │                                #   "Vì sao K-map dùng Gray" chuyển từ HTML cũ)
│   └── main.js                     # điểm vào: import CSS, gọi các setupXxxPage()
├── tests/
│   ├── gray.test.js                 # ↔ T1, T2 trong runTests() cũ
│   ├── quine-mccluskey.test.js       # ↔ T3, T4 (một phần)
│   ├── kmap-layout.test.js           # ↔ T6
│   ├── expr-parser.test.js           # ↔ T5
│   └── practice-check.test.js        # ↔ T7
├── PLAN.md
├── README.md
├── CLAUDE.md
├── .gitignore
└── package.json
```

## Quyết định chốt lúc thực hiện

| Vấn đề | Chốt |
|---|---|
| Thư mục project | `project_kmap/` (theo quy ước sẵn có `project_RPG/`, `project_student/`), không phải `gray-kmap/` |
| `graycode-kmap.html` ở root | Giữ lại, trở thành **bản build** sinh từ `npm run build` |
| Mở bằng `file://` | Giữ được nhờ `vite-plugin-singlefile` — build gộp về một file HTML tự chứa |
| `runTests()` trong console | Bỏ, thay hoàn toàn bằng `npm test` (Vitest); footer trang đã đổi chữ tương ứng |
| `src/ui/kmap-page.js` quá dài | Tách thêm `src/ui/kmap-steps.js` để mọi file đều dưới 300 dòng |

## Milestone

Mỗi milestone: làm xong → `npm test` pass → commit → báo ngắn gọn rồi mới sang
milestone tiếp theo. Không sang milestone mới khi test đang fail.

---

### Milestone 0 — [x] Khung project chạy được
**Làm:**
- `npm create vite@latest gray-kmap -- --template vanilla`, cài `vitest`.
- Xoá file mẫu của Vite, tạo cấu trúc thư mục ở trên (rỗng, có file `.gitkeep` nếu cần).
- Copy nguyên `style.css` từ file gốc vào `src/style.css`.
- `index.html`: chỉ có shell HTML của 3 tab gốc (Gray, K-map, Luyện tập) +
  `<div id="app">` rỗng cho tab Lý thuyết sẽ thêm ở Milestone 5.
- 1 test mẫu (`tests/sample.test.js`) cho 1 hàm dummy để xác nhận Vitest chạy.

**Xong khi:**
- `npm run dev` mở được trang, thấy đúng CSS/HTML tĩnh (chưa có tương tác JS).
- `npm test` pass (1 test mẫu).

**Commit:** `chore: initial project setup`

---

### Milestone 1 — [x] Tách logic Gray code
**Làm:**
- Copy nguyên hàm `toBits, binToGray, grayToBin, grayList, binToGraySteps,
  grayToBinSteps, diffPositions` vào `src/logic/gray.js`, export từng hàm.
- Viết `tests/gray.test.js` chuyển từ khối T1 + T2 trong `runTests()` cũ:
  - Với n = 1..5: `grayList(n)` có đúng 2^n phần tử, không trùng, mỗi bước kề
    nhau (kể cả vòng cuối→đầu) khác đúng 1 bit.
  - Với mọi v trong 0..2^n-1: `binToGray` ↔ `grayToBin` khứ hồi đúng, khớp
    với `grayList`, và các hàm `*Steps` trả về đúng kết quả cuối.

**Xong khi:** `npm test` pass toàn bộ test Gray (đúng số case như T1+T2 cũ).

**Commit:** `feat(logic): extract Gray code functions + tests`

---

### Milestone 2 — [x] Tách logic Quine–McCluskey (rút gọn SOP/POS)
**Làm:**
- Copy `VAR_NAMES, varNames, popcount, literalCount, implicantMinterms,
  impCovers, impKey, impContains, primeImplicants, minimalCover,
  implicantToSOP, implicantToPOS, splitValues, minimizeSOP, minimizePOS,
  totalLiterals` vào `src/logic/quine-mccluskey.js`.
- Viết `tests/quine-mccluskey.test.js` chuyển từ khối T3 + T4:
  - 120 hàm ngẫu nhiên/mỗi n (2..4, có ~12% don't care): SOP và POS phải khớp
    bảng chân trị tại mọi ô đã định nghĩa; mọi term trong cover không được
    phủ ô 0.
  - Case kinh điển: 4 góc K-map 4 biến → `B'D'`; hàm hằng 1/0; hàm XOR/parity
    (không rút gọn được, luôn essential); case don't care giúp rút gọn
    Σm(1,3,5,7,9)+d(11,13,15) → `D`; case essential-PI kinh điển
    Σm(0,1,2,5,6,7,8,9,10,14) → 3 term, 7 literal.

**Xong khi:** `npm test` pass toàn bộ test QM (giữ nguyên số ca ngẫu nhiên/mỗi n
như bản gốc, hoặc ghi rõ trong test nếu giảm để chạy nhanh hơn).

**Commit:** `feat(logic): extract Quine-McCluskey minimizer + tests`

---

### Milestone 3 — [x] Tách logic hình học K-map
**Làm:**
- Copy `mapLayout, cellMinterm, mintermPositions, contiguousSegments,
  implicantRects` vào `src/logic/kmap-layout.js`.
- Viết `tests/kmap-layout.test.js` chuyển từ khối T6:
  - Với n = 2..5: tổng diện tích các hình chữ nhật của mỗi prime implicant
    (khi hàm luôn = 1) bằng đúng số minterm nó chứa; mỗi implicant 1 ô luôn
    vẽ ra đúng 1 hình 1×1.
  - Hai ô kề nhau (kể cả wrap-around) trên layout K-map luôn khác đúng 1 bit.

**Xong khi:** `npm test` pass toàn bộ test kmap-layout.

**Commit:** `feat(logic): extract K-map layout/geometry + tests`

---

### Milestone 4 — [x] Tách logic parser biểu thức & spec
**Làm:**
- Copy `parseBoolExpr, exprTruthTable, sopStats, parseSpec, formatSpec` vào
  `src/logic/expr-parser.js` (dùng lại `splitValues` từ Milestone 2 nếu cần,
  import chéo giữa hai file logic — vẫn hợp lệ vì cả hai đều ở `logic/`).
- Copy `cellsToImplicant, checkGroup` vào `src/logic/practice-check.js`
  (dùng `primeImplicants`, `implicantMinterms`, `impContains` từ Milestone 2).
- Viết `tests/expr-parser.test.js` chuyển từ khối T5:
  - `parseSpec`/`formatSpec` round-trip đúng cho dạng Σm/d và ΠM; spec sai
    (minterm vượt phạm vi) phải throw.
  - `exprTruthTable` đúng cho biểu thức có NOT/AND/OR/ngoặc; biểu thức sai
    cú pháp phải throw.
  - `sopStats` đếm đúng số term và literal.
- Viết `tests/practice-check.test.js` chuyển từ khối T7:
  - Nhóm 4 góc hợp lệ, không có ghi chú "chưa lớn nhất".
  - Nhóm 2 ô (chưa lớn nhất) → có đúng 1 ghi chú gợi ý mở rộng.
  - Nhóm 3 ô không hợp lệ, nhóm chứa ô giá trị 0, nhóm 2 ô không kề nhau đều
    phải bị từ chối (`ok: false`).

**Xong khi:** `npm test` pass toàn bộ 2 file test mới. Tổng số test ở
Milestone 1–4 phải bao phủ đúng 7 nhóm T1–T7 của bản gốc (đối chiếu lại
`runTests()` cũ để không sót case nào).

**Commit:** `feat(logic): extract expression parser + practice group checker, tests`

---

### Milestone 5 — [x] Tách UI cho tab Gray code
**Làm:**
- `src/ui/dom-helpers.js`: `$`, `el`, hằng số `HUES`, `GAP` dùng chung.
- `src/ui/tabs.js`: `setupTabs`, `activateTab`.
- `src/ui/gray-page.js`: toàn bộ phần render bảng Gray, demo "reflect and
  prefix" (`gb*`), bộ chuyển đổi hai chiều (`renderConverter`), `setupGrayPage`
  — import hàm từ `src/logic/gray.js`.
- Nối vào `src/main.js`, xoá phần JS tương ứng khỏi `index.html` gốc.
- Không có test logic mới ở bước này (đây là lớp UI/DOM); xác nhận bằng tay:
  `npm run dev`, thao tác tab Gray code giống hệt bản gốc.
- Chạy `npm test` để đảm bảo không phá test đã có ở Milestone 1–4.

**Xong khi:** Tab Gray code trên `npm run dev` hoạt động y hệt bản gốc (bảng
Gray, demo reflect&prefix, bộ chuyển đổi, nút "Sang phần K-map"), và
`npm test` vẫn pass toàn bộ.

**Commit:** `feat(ui): wire Gray code page`

---

### Milestone 6 — [x] Tách UI cho tab K-map
**Làm:**
- `src/ui/kmap-common.js`: `buildMap, paintValues, rectStyle, drawGroups,
  setHot` (dùng chung với tab Luyện tập ở Milestone 7).
- `src/ui/kmap-page.js`: state `K`, `kSetN/kBuild/kRefresh`, `renderTruthTable`,
  `renderExpr`, `explainTerm`, `buildSteps`, `renderStep`, `stepGo`,
  `randomValues`, `setupKmapPage`, `applySpec` — import từ `logic/quine-mccluskey.js`,
  `logic/kmap-layout.js`, `logic/expr-parser.js`.
- Nối vào `src/main.js`, xoá phần JS tương ứng khỏi `index.html` gốc.
- `npm test` phải vẫn pass (không đổi logic).

**Xong khi:** Tab K-map hoạt động y hệt bản gốc: nhập hàm qua ô số + biểu
thức, click đổi giá trị, K-map/truth table/SOP/POS/giải thích từng bước đều
đồng bộ.

**Commit:** `feat(ui): wire K-map page`

---

### Milestone 7 — [x] Tách UI cho tab Luyện tập
**Làm:**
- `src/ui/practice-page.js`: state `P`, `pSetN/pBuild`, `cellUnder`,
  `pPointerDown`, `pSelectRect`, `pPaint`, `pNewProblem`, `pCommit`, `pCheck`,
  `pShowAnswer`, `setupPracticePage` — dùng `kmap-common.js` và
  `logic/practice-check.js`.
- Nối vào `src/main.js`.
- `npm test` vẫn pass.

**Xong khi:** Tab Luyện tập hoạt động y hệt bản gốc: kéo chọn vùng, click/shift
+click chọn ô lẻ, chốt nhóm, kiểm tra biểu thức, xem đáp án.

**Commit:** `feat(ui): wire practice page`

---

### Milestone 8 — [x] Xác nhận refactor hoàn tất, dọn file gốc
**Làm:**
- Đối chiếu tay từng tab giữa bản gốc (`graycode-kmap.html`) và bản mới
  (`npm run dev`) — checklist trong README.
- Chạy `bash scripts/check_file_sizes.sh .` của skill, tách thêm nếu còn file
  > 300 dòng.
- `npm run build` → xác nhận `dist/` chạy được (mở file tĩnh, không cần dev
  server).

**Xong khi:** Không còn khác biệt hành vi so với bản gốc; không file nào (trừ
`kmap-page.js` nếu vẫn hơi dài) vượt 300 dòng; `npm test` + `npm run build`
đều pass.

**Commit:** `refactor: complete multi-file split of graycode-kmap.html`

---

### Milestone 9 — [x] Trang Lý thuyết (Markdown)
**Làm:**
- Cài thư viện markdown nhẹ (`marked`, không cần cú pháp toán phức tạp vì nội
  dung chủ yếu là Boolean algebra viết bằng ký hiệu văn bản như bản gốc).
- `src/content/theory.md`: bắt đầu bằng nội dung của card "4. Vì sao K-map
  dùng thứ tự Gray?" (chuyển nguyên văn từ `index.html` gốc, bỏ khỏi tab Gray
  code cũ hoặc giữ link chéo — quyết định lúc làm milestone này).
- `src/ui/theory-page.js`: đọc `theory.md` (import dạng raw text qua Vite,
  `import theoryMd from '../content/theory.md?raw'`), render bằng `marked`,
  chèn vào tab mới.
- Thêm tab "Lý thuyết" vào `index.html` và `src/ui/tabs.js` (giữ nguyên cách
  tab hiện có hoạt động, chỉ thêm 1 mục).
- Test: `tests/theory-render.test.js` — kiểm tra `marked` parse `theory.md`
  không lỗi và output HTML chứa các heading mong đợi (test đơn giản, không
  cần test UI đầy đủ).

**Xong khi:** Tab "Lý thuyết" hiển thị đúng nội dung `theory.md` đã render;
`npm test` pass; `npm run dev` xác nhận bằng mắt.

**Commit:** `feat: add theory tab rendering Markdown content`

---

## Sau khi hoàn tất
- Cập nhật `README.md`: tính năng, cách chạy (`npm run dev`), cách test
  (`npm test`), cấu trúc thư mục, cách thêm/sửa nội dung `theory.md`.
- Cập nhật `CLAUDE.md` nếu phát sinh quy ước mới trong lúc làm (vd. cách đặt
  tên file test, cách tổ chức `content/`).
- Các hướng đã thống nhất nhưng để sau (progress indicator, điều hướng tuần
  tự rõ hơn, tách UI "giải thích từng bước" khỏi "luyện tập") sẽ là các
  milestone/PLAN riêng, làm sau khi refactor này ổn định.
