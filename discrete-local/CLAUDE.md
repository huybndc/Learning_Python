# CLAUDE.md — discrete (Toán rời rạc)

App ôn tập Discrete Math theo MCS (MIT 6.042J, bản 2017), Rosen làm nền. Quy tắc chung: `../CLAUDE.md`.

## Chương = số của syllabus (PLAN.md)
Chương mang số D-number, đủ phạm vi giữa kỳ: ch1 Mệnh đề · ch2 Lượng từ & chứng minh · ch3 Tập hợp & hàm · ch4 Quy nạp ·
ch5 Bất biến & quy nạp mạnh · ch6 Chia hết & gcd · ch7 Đồng dư & RSA · ch8 Đồ thị (sau giữa kỳ). Phần chứng minh thuần lập luận (chọn phương pháp, tìm lỗi
chứng minh) bổ sung bằng câu khái niệm (scripts/gen, D27). Thêm chương: `src/pages/chN.html` + 1 dòng include trong `index.html` + mục trong `main.js`
+ `SUBJECTS.discrete` ở `shared/logic/syllabus.js`.

## Lõi thuần
- `logic/prop-logic.js`: parser mệnh đề (¬ ∧ ∨ ⊕ → ↔ và ASCII ~ & | -> <->), bảng chân trị, tương đương, in lại có ngoặc như sách.
  Dòng 0 của bảng = mọi biến sai (khớp widget bảng chân trị dùng chung).
- `logic/number-theory.js`: Euclid, Pulverizer (bất biến r = s·a + t·b), nghịch đảo, lũy thừa mod (bình phương liên tiếp), φ, RSA.
  Mỗi hàm trả kèm các bước để làm lời giải.
- `logic/quant.js`: ∀/∃ trên miền hữu hạn (vét cạn), phủ định đẩy ¬ vào trong; `sameOnSamples` kiểm hai công thức
  khác nghĩa qua diễn giải ngẫu nhiên — dùng để loại nhiễu lỡ tương đương với đáp án.
- `logic/graph.js`: đồ thị đơn { n, edges } đỉnh 0…n−1 (tên a, b, c…), BFS, thành phần, tô 2 màu → chu trình lẻ, Euler,
  Havel–Hakimi, đẳng cấu vét cạn. Hình SVG ở `ui/graph-figure.js` (figure type 'graph'), công cụ ở `ui/graph-tool.js`.
- `logic/chN-quiz.js`: đáp án luôn TÍNH ra, không lấy từ nhãn soạn tay; câu có nhiều đáp án đúng (Bézout, nghịch đảo) chấm
  bằng cách kiểm tính chất, không so chuỗi. Test: mọi dạng × 200 hạt giống (`tests/quiz.test.js`).

## Công cụ (D34)
- `ui/tools.js`: bảng chân trị (D1), Euclid/Pulverizer từng dòng (D6), lũy thừa mod + RSA (D7). Markup ở khung
  `pane-chN-interactive` trong `pages/chN.html`; chữ ở `i18n/{vi,en}/tools.js`. Chỉ gọi lõi `logic/`, không tính lại.
