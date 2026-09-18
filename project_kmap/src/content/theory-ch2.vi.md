# Chương 2 — Đại số Boolean & cổng logic

*Tương ứng Digital Design 6th ed., §2.1–2.8.*

## 1. Tiên đề Huntington

Đại số Boolean là một cấu trúc đại số trên tập `{0, 1}` với hai phép toán `+`
(OR) và `·` (AND), thoả 6 nhóm tiên đề Huntington:

| | Dạng tổng (+) | Dạng tích (·) |
|---|---|---|
| **P1** Đóng | `x + y` thuộc tập | `x · y` thuộc tập |
| **P2** Trung hoà | `x + 0 = x` | `x · 1 = x` |
| **P3** Giao hoán | `x + y = y + x` | `xy = yx` |
| **P4** Phân phối | `x(y + z) = xy + xz` | `x + yz = (x + y)(x + z)` |
| **P5** Phần tử bù | `x + x′ = 1` | `x · x′ = 0` |
| **P6** | tồn tại ít nhất 2 phần tử khác nhau | |

> **Chú ý chỗ khác với đại số thường:** `P4` có **cả hai chiều**. Trong số học
> thông thường `x + yz ≠ (x+y)(x+z)`, nhưng trong Boolean thì đúng. Ngoài ra
> Boolean **không có phép trừ và phép chia**.

### Nguyên lý đối ngẫu (duality)

Mọi tiên đề đều đi thành cặp. Đổi `+ ↔ ·` và `0 ↔ 1` trong một mệnh đề đúng thì
được một mệnh đề đúng khác, gọi là **dual** của nó. Nhờ vậy chứng minh một vế
là tự động có vế kia.

## 2. Các định lý cơ bản

| | Dạng tổng | Dạng tích |
|---|---|---|
| **T1** Luỹ đẳng | `x + x = x` | `x · x = x` |
| **T2** Phần tử nuốt | `x + 1 = 1` | `x · 0 = 0` |
| **T3** Involution | `(x′)′ = x` | |
| **T4** Kết hợp | `x + (y + z) = (x + y) + z` | `x(yz) = (xy)z` |
| **T5** DeMorgan | `(x + y)′ = x′y′` | `(xy)′ = x′ + y′` |
| **T6** Hấp thụ | `x + xy = x` | `x(x + y) = x` |

Định lý **consensus**: `xy + x′z + yz = xy + x′z` — term `yz` là thừa, vì mọi
trường hợp `yz = 1` đều đã được một trong hai term kia phủ.

## 3. Hàm Boolean

Một **hàm Boolean** n biến có thể mô tả bằng ba cách tương đương:

1. **Biểu thức đại số:** `F = x + y′z`
2. **Bảng chân trị:** liệt kê đủ `2ⁿ` dòng và giá trị F ở mỗi dòng.
3. **Sơ đồ mạch:** nối các cổng logic tương ứng.

Bảng chân trị là **duy nhất** cho một hàm; biểu thức thì **không** — cùng một
hàm viết được nhiều cách, và mục tiêu của Chương 3 (K-map) là tìm cách viết
**rẻ nhất**.

Đây chính là chỗ nối sang Chương 3: rút gọn đại số ở chương này làm bằng tay và
phụ thuộc "nhìn ra" định lý nào áp được; K-map làm việc đó một cách **có hệ thống**.

## 4. Rút gọn bằng định lý (Example 2.1)

```
(a) x(x′ + y) = xx′ + xy = 0 + xy = xy
(b) x + x′y  = (x + x′)(x + y) = 1·(x + y) = x + y
(c) (x + y)(x + y′) = x + yy′ = x + 0 = x
(d) xy + x′z + yz = xy + x′z            (consensus)
(e) (x + y)(x′ + z)(y + z) = (x + y)(x′ + z)   (dual của (d))
```

Nhận xét (b) và (c) đáng nhớ: chúng cho thấy **thêm một biến không phải lúc nào
cũng tốn thêm literal**.

## 5. Hàm bù (complement)

Có hai cách lấy `F′`, luôn cho cùng kết quả:

**Cách 1 — DeMorgan mở rộng (Example 2.2):** đổi mọi `+` thành `·`, mọi `·`
thành `+`, đồng thời bù từng literal.

```
F  = A + B′C
F′ = A′(B + C′)
```

**Cách 2 — qua dual (Example 2.3):** lấy **dual** của F (chỉ đổi `+ ↔ ·`, giữ
nguyên biến), rồi bù từng literal.

```
F      = A + B′C
dual F = A(B′ + C)
F′     = A′(B + C′)      ← bù từng literal
```

> **Chỗ cực dễ sai:** phải tôn trọng **thứ tự ưu tiên**. `B′C` là một tích, nên
> dual của nó là `(B′ + C)` — **có ngoặc**. Nếu chỉ đổi dấu trên chuỗi ký tự mà
> quên ngoặc thì sẽ ra `A · B′ + C`, sai hoàn toàn.

## 6. Minterm & maxterm, dạng chuẩn tắc

Với n biến:

- **Minterm** `mᵢ`: tích của đủ n literal, bằng 1 tại **đúng một** dòng. Biến
  bằng 0 thì viết phủ định. Ví dụ n = 3: `m₅ = AB′C` (vì 5 = 101).
- **Maxterm** `Mᵢ`: tổng của đủ n literal, bằng 0 tại **đúng một** dòng. Quy ước
  **ngược lại**: biến bằng 1 thì viết phủ định. Ví dụ `M₅ = A′ + B + C′`.

Quan hệ: `Mᵢ = (mᵢ)′`.

**Dạng chuẩn tắc (canonical form):**

- **Canonical SOP** = tổng các minterm ứng với dòng F = 1 ⇒ viết `F = Σm(…)`
- **Canonical POS** = tích các maxterm ứng với dòng F = 0 ⇒ viết `F = ΠM(…)`

Hai dạng bù nhau về chỉ số: nếu `F = Σm(1,3,5,7)` với n = 3 thì `F = ΠM(0,2,4,6)`.

Dạng chuẩn tắc luôn **duy nhất** nhưng thường **không tối giản** — đó là lý do
cần K-map (Chương 3).

## 7. 16 hàm hai biến & 8 cổng logic chuẩn

Với 2 biến có `2^(2²) = 16` hàm khả dĩ, từ `F0 = 0` (hằng 0) tới `F15 = 1`
(hằng 1). Chúng chia làm 3 nhóm:

- **Hằng:** `F0 = 0`, `F15 = 1`
- **Một biến (unary):** transfer `x`, `y` và bù `x′`, `y′`
- **Toán tử hai ngôi:** AND, OR, NAND, NOR, XOR, XNOR, và các phép "ức chế"
  (inhibition) / "kéo theo" (implication)

Trong đó **8 cổng được chế tạo thành linh kiện chuẩn**: AND, OR, NOT (inverter),
Buffer (transfer), NAND, NOR, XOR, XNOR.

### Ba điều dễ nhầm về cổng nhiều ngõ vào

1. AND, OR, XOR **có tính kết hợp** ⇒ mở rộng nhiều ngõ vào tự nhiên.
2. NAND và NOR **KHÔNG kết hợp**: `(x↑y)↑z ≠ x↑(y↑z)`. Vì vậy NAND 3 ngõ vào
   được **định nghĩa lại** là `(xyz)′` chứ không phải ghép hai NAND 2 ngõ.
3. NAND và NOR là **cổng phổ quát (universal)**: chỉ dùng một loại cổng này là
   dựng được mọi hàm Boolean. Đây là lý do mạch thực tế hay chuyển toàn bộ
   AND-OR thành toàn NAND.

## 8. Những chỗ hay sai

- Quên rằng `P4` đúng **cả hai chiều** (`x + yz = (x+y)(x+z)`).
- Lấy dual/bù trên chuỗi ký tự mà quên thứ tự ưu tiên ⇒ thiếu ngoặc.
- Nhầm quy ước phủ định giữa minterm và maxterm (chúng **ngược nhau**).
- Tưởng NAND nhiều ngõ vào là ghép NAND 2 ngõ vào (sai — không kết hợp).
- Dừng ở dạng chuẩn tắc và tưởng đó đã là đáp án tối giản.
