# Chương 1 — Hệ đếm & mã nhị phân

*Tương ứng Digital Design 6th ed., §1.1–1.4. Phần mã hoá (BCD, Excess-3, parity…)
nằm ở cuối chương.*

## 1. Hệ thống số & tín hiệu số

Mạch số làm việc với **tín hiệu rời rạc**: chỉ hai mức điện áp, quy ước là `0`
và `1`. Một chữ số nhị phân gọi là **bit**.

Vì sao dùng 2 mức mà không phải 10? Vì mạch chỉ cần phân biệt "có điện / không
điện" ⇒ chống nhiễu tốt, linh kiện đơn giản, và đại số Boolean (Chương 2) mô tả
được chính xác hành vi của nó.

## 2. Số ở cơ số r

Một số ở **cơ số r** (radix r) được viết bằng các chữ số `0 … r−1`, giá trị tính
theo **trọng số luỹ thừa của r**:

```
a₂a₁a₀ . a₋₁a₋₂  (cơ số r)  =  a₂·r² + a₁·r¹ + a₀·r⁰ + a₋₁·r⁻¹ + a₋₂·r⁻²
```

Ví dụ: `(101001.1011)₂ = 32 + 8 + 1 + 0.5 + 0.125 + 0.0625 = 41.6875`

| Cơ số | Tên | Chữ số dùng |
|---|---|---|
| 2 | Binary (nhị phân) | 0, 1 |
| 8 | Octal (bát phân) | 0–7 |
| 10 | Decimal (thập phân) | 0–9 |
| 16 | Hexadecimal (thập lục phân) | 0–9, A–F |

> Quy ước viết: `(1010)₂`, `(752)₈`, `(2C6B)₁₆` — luôn ghi rõ cơ số khi có thể
> nhầm lẫn. `(11)₂ = 3` chứ không phải "mười một".

## 3. Đổi từ cơ số r sang thập phân

Nhân từng chữ số với trọng số rồi cộng lại — chính là công thức ở mục 2.

```
(630)₈ = 6·8² + 3·8¹ + 0·8⁰ = 384 + 24 + 0 = 408
(F3)₁₆ = 15·16 + 3 = 243
```

## 4. Đổi từ thập phân sang cơ số r

Đây là chỗ hay sai nhất, vì **phần nguyên và phần lẻ dùng hai phép ngược nhau**.

### Phần nguyên — chia liên tiếp cho r, lấy **dư**

Đọc các số dư **từ dưới lên**.

```
41 ÷ 2 = 20  dư 1   ← LSB (bit thấp nhất)
20 ÷ 2 = 10  dư 0
10 ÷ 2 =  5  dư 0
 5 ÷ 2 =  2  dư 1
 2 ÷ 2 =  1  dư 0
 1 ÷ 2 =  0  dư 1   ← MSB (bit cao nhất)

⇒ (41)₁₀ = (101001)₂
```

Vì sao lấy dư? Vì `41 = 2·20 + 1`, số dư chính là chữ số hàng đơn vị (trọng số
`r⁰`); thương `20` còn lại là phần "đã dịch sang phải một chữ số".

### Phần lẻ — nhân liên tiếp với r, lấy **phần nguyên**

Đọc các phần nguyên **từ trên xuống**.

```
0.6875 × 2 = 1.375  → lấy 1, còn 0.375
0.375  × 2 = 0.75   → lấy 0, còn 0.75
0.75   × 2 = 1.5    → lấy 1, còn 0.5
0.5    × 2 = 1.0    → lấy 1, còn 0  ⇒ dừng

⇒ (0.6875)₁₀ = (0.1011)₂
```

Ghép lại: `(41.6875)₁₀ = (101001.1011)₂`

> **Cảnh báo:** phần lẻ thập phân **không phải lúc nào cũng dừng** ở hệ nhị phân.
> `0.1` đổi sang nhị phân là `0.000110011001…` lặp vô hạn — đó chính là lý do
> máy tính không biểu diễn chính xác được `0.1`.

## 5. Nhị phân ↔ bát phân / thập lục phân: gộp nhóm bit

Vì `8 = 2³` và `16 = 2⁴`, hai phép đổi này **không cần đi qua thập phân**: chỉ
gộp bit thành nhóm 3 (octal) hoặc 4 (hex), tính từ **dấu chấm ra hai bên**.

```
       10 110 001 101 011 . 111 100 000 110   (gộp 3)
        2   6   1   5   3 .  7   4   0   6
⇒ (10110001101011.111100000110)₂ = (26153.7406)₈

     10 1100 0110 1011 . 1111 0010            (gộp 4)
      2    C    6    B .    F    2
⇒ (10110001101011.11110010)₂ = (2C6B.F2)₁₆
```

Thiếu bit thì **đệm 0**: phần nguyên đệm bên **trái**, phần lẻ đệm bên **phải**
— vì đệm ở phía đó không làm đổi giá trị.

Chiều ngược lại: mỗi chữ số octal bung thành đúng 3 bit, mỗi chữ số hex bung
thành đúng 4 bit.

Đây là lý do hex được dùng để viết gọn chuỗi bit dài: `1111 1111` khó đọc, `FF`
thì dễ.

## 6. Những chỗ hay sai

- Đọc số dư **từ trên xuống** thay vì từ dưới lên khi đổi phần nguyên.
- Dùng phép chia cho **phần lẻ** (phải dùng phép nhân).
- Quên đệm 0 khi gộp nhóm, hoặc đệm nhầm phía ở phần lẻ.
- Tưởng mọi phần lẻ thập phân đều đổi hết được sang nhị phân.
- Nhầm `(10)₂` là "mười" — nó là `2`.

---

*Xem thêm:* **Gray code** — một loại mã nhị phân đặc biệt mà hai giá trị liên
tiếp chỉ khác nhau 1 bit — được trình bày ở **Chương 3**, vì nó chỉ thực sự
"cần dùng" khi học K-map.
