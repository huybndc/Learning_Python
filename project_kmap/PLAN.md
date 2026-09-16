# PLAN — Tái cấu trúc Gray code & K-map thành mini project

## Mục tiêu

Tách `graycode-kmap.html` (1.868 dòng, 1 file) thành project nhiều file theo chuẩn
mini-project-setup: logic thuần tách khỏi DOM, test chạy bằng Node, mỗi file dưới ~300 dòng.
**Không thêm, bớt hay đổi bất kỳ hành vi nào** — bản build ra phải hoạt động giống hệt bản hiện tại.

## Phạm vi

**Làm:**
- Tách JS thành `src/logic/` (thuần, test được) và `src/ui/` (chạm DOM).
- Tách CSS thành 4 file theo nhóm trách nhiệm; tách markup ra `index.html`.
- Dựng Vite + Vitest, đưa bộ 76 assertion hiện có vào test chạy bằng Node.
- Thêm `vite-plugin-singlefile` để `npm run build` gộp lại thành 1 file HTML tự chứa.
- Đối chứng hành vi bản cũ ↔ bản mới bằng bộ e2e Playwright.

**Không làm:**
- Không đổi thuật toán, giao diện, văn bản tiếng Việt, tên biến công khai (`runTests`, `A/B/C/D/E`...).
- Không thêm tính năng mới, không đổi màu/bố cục.
- Không đụng `project_RPG/`, `project_student/`.
- Không thêm framework UI (React/Vue...) — vẫn vanilla JS.

## Quyết định đã chốt

| Vấn đề | Chốt |
|---|---|
| Mở bằng `file://` | Giữ được — `npm run build` gộp thành 1 file tự chứa |
| Vị trí source | `project_kmap/` (theo quy ước `project_RPG/`, `project_student/`) |
| `graycode-kmap.html` ở root | Giữ lại, là **bản build** sinh ra từ `project_kmap/` |
| `runTests()` trong console | Giữ nguyên, vẫn gọi được — đồng thời chạy được bằng `npm test` |

## Cấu trúc dự kiến

```
project_kmap/
├── index.html                  # markup 3 tab (~195 dòng)
├── package.json                # scripts: dev, build, test, test:e2e
├── vite.config.js              # vite-plugin-singlefile
├── PLAN.md  README.md  CLAUDE.md  .gitignore
├── scripts/
│   └── check-file-sizes.sh     # liệt kê file > 300 dòng (skill thiếu file này)
├── src/
│   ├── main.js                 # entry: gắn các setup*, expose window.runTests   (~25)
│   ├── styles/
│   │   ├── tokens.css          # biến màu, light/dark                            (~60)
│   │   ├── base.css            # body, tab, card, button, input, table           (~65)
│   │   ├── gray.css            # bảng gray, reflect-and-prefix, converter         (~35)
│   │   └── kmap.css            # ô K-map, lưới, khung nhóm, expr, legend          (~65)
│   ├── logic/                  # THUẦN — không đụng document/window
│   │   ├── gray.js             # toBits, binToGray, grayToBin, grayList, *Steps   (~80)
│   │   ├── implicant.js        # varNames, popcount, implicantMinterms, impCovers,
│   │   │                       #   impContains, implicantToSOP/POS               (~75)
│   │   ├── quine-mccluskey.js  # primeImplicants, minimalCover (branch & bound)  (~105)
│   │   ├── minimize.js         # splitValues, minimizeSOP, minimizePOS           (~55)
│   │   ├── kmap-layout.js      # mapLayout, cellMinterm, contiguousSegments,
│   │   │                       #   implicantRects (mảnh wrap-around)             (~85)
│   │   ├── expression.js       # parseBoolExpr, exprTruthTable, sopStats        (~100)
│   │   ├── spec.js             # parseSpec (Σm/ΠM/d), formatSpec                 (~55)
│   │   ├── practice-check.js   # cellsToImplicant, checkGroup                    (~50)
│   │   ├── random-function.js  # randomValues                                    (~25)
│   │   ├── explain.js          # explainTerm (chuỗi giải thích, thuần)           (~25)
│   │   └── self-test.js        # runTests() — 76 assertion, giữ nguyên          (~205)
│   └── ui/                     # chạm DOM, import từ logic/ (KHÔNG ngược lại)
│       ├── dom.js              # $, el, GAP, HUES                                (~20)
│       ├── tabs.js             # setupTabs                                       (~25)
│       ├── gray-page.js        # bảng gray, reflect-and-prefix, converter       (~150)
│       ├── kmap-view.js        # buildMap, paintValues, rectStyle, drawGroups,
│       │                       #   setHot — dùng chung 2 tab                     (~120)
│       ├── kmap-page.js        # state K, truth table, renderExpr, kRefresh     (~175)
│       ├── kmap-steps.js       # buildSteps, renderStep, stepGo                 (~115)
│       ├── practice-page.js    # state P, pPaint, pCommit, pShowAnswer          (~125)
│       ├── practice-select.js  # pPointerDown, pSelectRect, cellUnder            (~50)
│       └── practice-result.js  # pCheck — render kết quả chấm                    (~75)
└── tests/
    ├── self-test.test.js       # chạy runTests(), phải 76/76                     (~15)
    ├── minimize-bruteforce.test.js  # đối chứng vét cạn (xem M2)                 (~60)
    ├── expression.test.js      # case biên của parser                            (~45)
    └── e2e/behavior.spec.js    # 43 check Playwright, đối chứng cũ ↔ mới        (~200)
```

Không file nào vượt 300 dòng. File lớn nhất: `self-test.js` (~205).

## Milestone

### M1 — Khung project chạy được
- `npm create vite` (vanilla) trong `project_kmap/`, cài `vitest`, `vite-plugin-singlefile`, `playwright`.
- Scripts: `dev`, `build`, `test`, `test:watch`, `test:e2e`.
- Tạo `README.md`, `CLAUDE.md`, `.gitignore`, `scripts/check-file-sizes.sh`.
- Tách `src/logic/gray.js` + `tests/gray.test.js`.
- **Xong khi:** `npm test` pass, `npm run dev` mở được trang.

### M2 — Tách toàn bộ logic thuần
- Tách 10 file `src/logic/`, chuyển `runTests()` sang `self-test.js`.
- Commit bộ **đối chứng vét cạn** (hiện chỉ chạy tạm, chưa lưu): duyệt toàn bộ 6.561 hàm 3 biến
  + 4.000 hàm 4 biến ngẫu nhiên, so kết quả `minimizeSOP` với duyệt mọi tập con prime implicant.
- **Xong khi:** `npm test` pass (76/76 + brute-force), không file logic nào >300 dòng,
  `grep -r "document\|window" src/logic/` không ra kết quả.

### M3 — Tách CSS và markup
- `index.html` + 4 file CSS.
- **Xong khi:** `npm run dev` hiển thị giống hệt bản cũ (so ảnh chụp light + dark).

### M4 — Tách UI
- Tách 9 file `src/ui/` + `main.js`.
- **Xong khi:** `npm run dev` đủ 3 tab, không lỗi console.

### M5 — Build một file + đối chứng hành vi  ⟵ *cửa chặn quan trọng nhất*
- Bật `vite-plugin-singlefile`, `npm run build` → copy ra `../graycode-kmap.html`.
- Chạy bộ e2e Playwright trên **cả hai** bản: bản cũ (`git show <commit>:graycode-kmap.html`)
  và bản build mới → **43/43 phải giống hệt nhau**.
- **Xong khi:** e2e 43/43 trên bản mới, `runTests()` trong console = 76/76,
  0 lỗi JS, mở bằng `file://` chạy được.

### M6 — Hoàn thiện
- Cập nhật `README.md`, `CLAUDE.md`, đánh dấu milestone trong PLAN.md.
- Cập nhật README gốc của repo (thêm mục project này).

## Rủi ro đã lường trước

| Rủi ro | Cách xử lý |
|---|---|
| ES module không chạy qua `file://` | `vite-plugin-singlefile` gộp hết vào 1 file (M5) |
| Thứ tự khai báo đổi khi tách file làm hỏng hoisting | Tách theo đúng thứ tự phụ thuộc, `npm test` sau mỗi file |
| Lỡ đổi hành vi mà không biết | Cửa chặn M5: chạy cùng bộ e2e trên bản cũ và bản mới |
| `runTests()` mất khỏi console sau khi module hoá | `main.js` gán `window.runTests` tường minh, có check trong e2e |
