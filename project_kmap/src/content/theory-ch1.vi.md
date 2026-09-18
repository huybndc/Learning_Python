# Chương 1 — Hệ đếm & mã nhị phân

*Tương ứng Digital Design 6th ed., §1.1–1.11.*

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

## 6. Mã BCD & các mã thập phân khác (§1.7)

Con người dùng hệ thập phân, máy dùng nhị phân. **Mã thập phân** là cách mã hoá
**từng chữ số** thập phân bằng một nhóm bit, thay vì đổi cả số sang nhị phân.

| Chữ số | BCD (8421) | 2421 | Excess-3 |
|---|---|---|---|
| 0 | 0000 | 0000 | 0011 |
| 1 | 0001 | 0001 | 0100 |
| 2 | 0010 | 0010 | 0101 |
| 3 | 0011 | 0011 | 0110 |
| 4 | 0100 | 0100 | 0111 |
| 5 | 0101 | 1011 | 1000 |
| 6 | 0110 | 1100 | 1001 |
| 7 | 0111 | 1101 | 1010 |
| 8 | 1000 | 1110 | 1011 |
| 9 | 1001 | 1111 | 1100 |

> **BCD ≠ nhị phân.** `(185)₁₀` ở BCD là `0001 1000 0101` (12 bit), còn ở nhị
> phân là `10111001` (8 bit). Hai thứ hoàn toàn khác nhau.

Mỗi nhóm 4 bit có 16 tổ hợp nhưng chỉ dùng 10; 6 tổ hợp còn lại là **không hợp lệ**.

**2421 và Excess-3 là mã tự bù (self-complementing):** mã của `d` và mã của
`9 − d` là **bù 1** của nhau. Tính chất này giúp mạch trừ thập phân đơn giản
hơn nhiều. BCD **không** có tính chất này.

### Cộng BCD: quy tắc hiệu chỉnh +6

Cộng hai chữ số BCD như nhị phân bình thường. Nếu tổng **lớn hơn 9**, kết quả
rơi vào vùng 6 tổ hợp không hợp lệ ⇒ phải **cộng thêm 0110 (+6)** và sinh nhớ
sang chữ số kế tiếp.

```
   184 + 576 = 760

   đơn vị:  4 + 6 = 10 > 9  ⇒ +6 ⇒ chữ số 0, nhớ 1
   chục:    8 + 7 + 1 = 16 > 9  ⇒ +6 ⇒ chữ số 6, nhớ 1
   trăm:    1 + 5 + 1 = 7 ≤ 9   ⇒ giữ nguyên ⇒ chữ số 7
```

Vì sao là +6? Vì 4 bit đếm được 16 giá trị nhưng thập phân chỉ dùng 10 — cộng 6
chính là **bù lại khoảng chênh 16 − 10**.

## 7. Mã ASCII (§1.8)

ASCII mã hoá ký tự bằng **7 bit** (128 ký tự): chữ hoa, chữ thường, chữ số, dấu
câu và các ký tự điều khiển.

```
'A' = 1000001 (65)      '0' = 0110000 (48)
'a' = 1100001 (97)      ' ' = 0100000 (32)
```

Mẹo nhớ: `'a' − 'A' = 32`, và `'0'` bắt đầu ở 48 — nên đổi ký tự số sang giá trị
chỉ cần trừ 48.

## 8. Bit parity — phát hiện lỗi (§1.9)

Thêm **1 bit** vào chuỗi để tổng số bit `1` luôn chẵn (**even parity**) hoặc
luôn lẻ (**odd parity**).

```
'A' = 1000001  (hai bit 1 ⇒ đã chẵn)
even parity ⇒ 1000001|0
odd  parity ⇒ 1000001|1
```

Bên nhận đếm lại số bit 1. Sai lệch ⇒ có lỗi.

> **Giới hạn quan trọng:** parity chỉ **phát hiện** được lỗi ở **số bit lẻ**
> (1, 3, 5… bit). Lỗi 2 bit làm số bit 1 đổi một số chẵn nên parity vẫn khớp ⇒
> **không phát hiện được**. Và parity chỉ phát hiện chứ **không sửa** được lỗi.

## 9. Thanh ghi & logic nhị phân (§1.10–1.11)

Một **thanh ghi (register)** n bit là nhóm n phần tử nhớ, mỗi phần tử giữ 1 bit.
Cùng một nội dung thanh ghi có thể được **diễn giải** theo nhiều cách khác nhau —
chỉ ngữ cảnh mới quyết định:

```
01000001  →  số nhị phân không dấu 65
          →  số 2's complement 65
          →  ký tự ASCII 'A'
          →  BCD thì KHÔNG hợp lệ (0100 = 4, 0001 = 1 ⇒ "41", tuỳ cách đọc)
```

Đây là ý quan trọng nhất của chương: **bit không mang ý nghĩa tự thân**, ý nghĩa
đến từ cách ta quy ước đọc chúng.

## 10. Những chỗ hay sai

- Đọc số dư **từ trên xuống** thay vì từ dưới lên khi đổi phần nguyên.
- Dùng phép chia cho **phần lẻ** (phải dùng phép nhân).
- Quên đệm 0 khi gộp nhóm, hoặc đệm nhầm phía ở phần lẻ.
- Tưởng mọi phần lẻ thập phân đều đổi hết được sang nhị phân.
- Nhầm `(10)₂` là "mười" — nó là `2`.
- Nhầm **BCD với nhị phân** (`185` ở BCD dài 12 bit, ở nhị phân chỉ 8 bit).
- Quên hiệu chỉnh **+6** khi tổng BCD vượt 9.
- Tưởng parity phát hiện được **mọi** lỗi (chỉ lỗi số bit lẻ).

---

*Xem thêm:* **Gray code** — một loại mã nhị phân đặc biệt mà hai giá trị liên
tiếp chỉ khác nhau 1 bit — được trình bày ở **Chương 3**, vì nó chỉ thực sự
"cần dùng" khi học K-map.
