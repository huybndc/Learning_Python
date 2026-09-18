# Chương 1 — Vector

Đại số tuyến tính bắt đầu từ một câu hỏi rất đời thường: *cộng hai mũi tên thì
được gì?* Mọi thứ về sau — ma trận, hệ phương trình, không gian con — đều mọc
ra từ hai phép toán duy nhất trong chương này: **cộng vector** và **nhân vector
với một số**.

## Vector là gì

Một vector trong `R²` là một cặp số có thứ tự, viết dọc thành cột:

```
v = [ 2 ]      w = [ -1 ]
    [ 1 ]          [  3 ]
```

Có ba cách nhìn cùng một vector `v = (2, 1)`, và cả ba đều đúng:

| Cách nhìn | Nghĩa |
|---|---|
| Danh sách số | cặp có thứ tự `(2, 1)` — thành phần thứ nhất là 2, thứ hai là 1 |
| Điểm | điểm nằm ở toạ độ `x = 2`, `y = 1` |
| Mũi tên | mũi tên từ gốc `(0, 0)` tới điểm `(2, 1)` |

Cách nhìn "mũi tên" quan trọng nhất, vì nó cho vector hai thuộc tính đọc được
bằng mắt: **hướng** và **độ dài**. Vị trí thì không quan trọng — mũi tên đi từ
`(5, 5)` tới `(7, 6)` vẫn là chính vector `(2, 1)` đó, chỉ là vẽ ở chỗ khác.

Trong `R³` thì vector có ba thành phần `(x, y, z)`. Trong `R⁵` có năm thành
phần — không vẽ ra được nữa, nhưng phép toán thì không đổi một chữ nào.

## Cộng vector và nhân với một số

Cả hai phép toán đều làm **theo từng thành phần**:

```
v + w = [ 2 ] + [ -1 ] = [ 2 + (-1) ] = [ 1 ]
        [ 1 ]   [  3 ]   [ 1 +   3  ]   [ 4 ]

2v    = 2·[ 2 ] = [ 4 ]        -v = [ -2 ]
          [ 1 ]   [ 2 ]             [ -1 ]
```

Về hình học, `v + w` là đường chéo của hình bình hành dựng bởi `v` và `w`. Có
hai cách đọc cùng một hình, nên nhớ cả hai:

- **Nối đuôi:** đi hết `v`, rồi từ đầu `v` đi tiếp một đoạn bằng `w`. Chỗ dừng
  chính là `v + w`. Đi `w` trước rồi `v` sau cũng tới đúng chỗ đó — đó là lý do
  hình học của luật giao hoán `v + w = w + v`.
- **Hình bình hành:** `v` và `w` là hai cạnh kề, `v + w` là đường chéo dài.

Nhân với số `c` thì **giữ nguyên đường thẳng, chỉ đổi độ dài**: `c > 1` kéo dài
ra, `0 < c < 1` co lại, `c < 0` quay ngược 180°, `c = 0` cho vector 0.

> Vector 0 là vector duy nhất không có hướng. Nó vẫn là vector hợp lệ và rất
> hay gặp — `v + (-v) = 0` — nhưng hỏi "góc của vector 0" thì vô nghĩa.

Còn `v − w` thì sao? Viết lại thành `v + (−w)`: vẫn là phép cộng. Về hình học,
`v − w` là mũi tên **đi từ đầu `w` tới đầu `v`** — nhớ theo chiều "trừ cái nào
thì xuất phát từ cái đó".

## Độ dài của vector

Độ dài (chuẩn) của `v` lấy thẳng từ định lý Pythagoras:

```
‖v‖ = √(v₁² + v₂²)          trong R²
‖v‖ = √(v₁² + v₂² + v₃²)    trong R³
```

Ví dụ `‖(3, 4)‖ = √(9 + 16) = 5`. Độ dài luôn là số không âm, và bằng 0 đúng
khi `v` là vector 0.

Chia một vector cho chính độ dài của nó thì được **vector đơn vị** — giữ nguyên
hướng, độ dài thành 1:

```
u = v / ‖v‖        ví dụ (3, 4)/5 = (0.6, 0.8)
```

Đây là thao tác dùng liên tục về sau (trực chuẩn hoá, Gram-Schmidt ở Ch.4), nên
quen tay sớm thì lợi.

## Tích vô hướng (dot product)

Tích vô hướng nhân từng cặp thành phần rồi cộng lại. Kết quả là **một số**,
không phải vector:

```
v · w = v₁w₁ + v₂w₂ = 2·(-1) + 1·3 = 1
```

Ba tính chất cần thuộc:

- `v · w = w · v` (đối xứng)
- `v · (w + u) = v · w + v · u` (tuyến tính)
- `v · v = ‖v‖²` — tích vô hướng của một vector với chính nó chính là bình
  phương độ dài. Đây là cầu nối giữa "đại số" và "hình học".

Điều quan trọng nhất: **dấu của `v · w` cho biết hai vector hướng về cùng phía
hay không.**

| `v · w` | Ý nghĩa hình học |
|---|---|
| `> 0` | góc nhọn — hai vector cùng hướng đại khái |
| `= 0` | **vuông góc** (trực giao) |
| `< 0` | góc tù — ngược hướng nhau |

Trường hợp `v · w = 0` là trường hợp đáng nhớ nhất trong cả chương: thử `(1, 1)`
và `(1, −1)` thì được `1 − 1 = 0`, và đúng là hai mũi tên đó vuông góc.

## Góc giữa hai vector

Công thức nối dot product với góc:

```
cos θ = (v · w) / (‖v‖ · ‖w‖)
```

Vì `|cos θ| ≤ 1`, công thức này kéo theo **bất đẳng thức Schwarz**:

```
|v · w| ≤ ‖v‖ · ‖w‖
```

Dấu bằng xảy ra đúng khi `v` và `w` cùng phương. Từ đó suy ra **bất đẳng thức
tam giác** `‖v + w‖ ≤ ‖v‖ + ‖w‖` — đi đường chéo không bao giờ xa hơn đi vòng
qua hai cạnh.

Liên quan chặt với góc là **hình chiếu** của `v` lên `w`:

```
proj_w(v) = ((v · w) / (w · w)) · w
```

Đây là "cái bóng" của `v` đổ lên đường thẳng chứa `w`. Phần còn lại
`v − proj_w(v)` luôn vuông góc với `w` — kiểm tra bằng dot product thấy ngay
bằng 0. Ý này chính là hạt giống của least squares ở Chương 4.

## Tổ hợp tuyến tính và span

Ghép hai phép toán của chương lại thì được khái niệm trung tâm của cả môn:

```
c·v + d·w        với c, d là số bất kỳ
```

gọi là **tổ hợp tuyến tính** của `v` và `w`. Tập hợp *tất cả* các tổ hợp tuyến
tính như vậy gọi là **span** của `v` và `w`.

Trong `R²`, span của hai vector chỉ có ba khả năng:

| Trường hợp | Span là |
|---|---|
| `v`, `w` không cùng phương | **toàn bộ mặt phẳng** `R²` |
| `v`, `w` cùng phương (và khác 0) | **một đường thẳng** qua gốc |
| cả hai đều là vector 0 | **một điểm** — chính gốc toạ độ |

Câu hỏi "vector `b` có nằm trong span của `v` và `w` không?" nghe hình học,
nhưng thật ra chính là câu hỏi **"hệ phương trình `c·v + d·w = b` có nghiệm
không?"** — và đó đúng là nội dung Chương 2. Hai chương này là một câu chuyện
duy nhất nhìn từ hai phía: Chương 1 nhìn bằng hình, Chương 2 nhìn bằng số.

## Những chỗ hay sai

- **Dot product không phải vector.** `v · w` là một số. Viết `v · w = (2, 3)`
  là sai ngay từ kiểu dữ liệu.
- **Không có phép "chia vector".** Không viết `v / w`. Chỉ chia được cho *số*.
- **`‖v + w‖ ≠ ‖v‖ + ‖w‖`** trong hầu hết trường hợp. Hai vế chỉ bằng nhau khi
  `v` và `w` cùng hướng.
- **Vector 0 không có hướng**, nên không hỏi góc giữa nó và vector khác, và
  không chuẩn hoá được (chia cho 0).
- **Cùng phương ≠ bằng nhau.** `(1, 2)` và `(2, 4)` cùng phương nhưng khác nhau;
  chúng có cùng span, không phải cùng giá trị.
- **Thứ tự khi trừ.** `v − w` và `w − v` ngược chiều nhau. Vẽ hình một lần là
  nhớ: `v − w` đi *từ* `w` *tới* `v`.
