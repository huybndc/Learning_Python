# Chương 2 — Giải hệ phương trình tuyến tính (Ax = b)

Chương 1 hỏi *"b có nằm trong span của các vector không?"*. Chương này trả lời
câu hỏi đó bằng một quy trình máy móc, làm được bằng tay và luôn kết thúc:
**phép khử Gauss**.

## Từ hệ phương trình tới Ax = b

Một hệ hai phương trình hai ẩn:

```
 x + 2y = 5
3x + 4y = 6
```

tách được thành ba phần: bảng hệ số `A`, cột ẩn `x`, cột vế phải `b`.

```
A = [ 1  2 ]     x = [ x ]     b = [ 5 ]
    [ 3  4 ]         [ y ]         [ 6 ]
```

Viết gọn lại là `Ax = b`. Khi giải bằng tay, ta gộp `A` và `b` thành **ma trận
mở rộng** `[A | b]` để khỏi phải chép đi chép lại tên ẩn:

```
[ 1  2 | 5 ]
[ 3  4 | 6 ]
```

Mọi thao tác từ đây trở đi chỉ là biến đổi trên bảng số này.

## Hai cách nhìn: hàng và cột

Cùng một hệ, có hai cách đọc, và cả hai đều cần:

**Cách nhìn theo hàng.** Mỗi phương trình là một đường thẳng trong mặt phẳng
(với 3 ẩn thì là một mặt phẳng trong không gian). Nghiệm là **giao điểm**. Hai
đường thẳng trong `R²` chỉ có ba khả năng: cắt nhau tại một điểm, song song
(không giao), hoặc trùng nhau (giao là cả đường thẳng). Ba khả năng này chính
là ba trường hợp nghiệm sẽ gặp ở dưới.

**Cách nhìn theo cột.** Viết lại `Ax = b` thành

```
x·[ 1 ] + y·[ 2 ] = [ 5 ]
  [ 3 ]     [ 4 ]   [ 6 ]
```

Bây giờ câu hỏi thành: *tổ hợp tuyến tính nào của các cột cho ra `b`?* Đúng là
câu hỏi span của Chương 1. Cách nhìn cột là cách nhìn quan trọng hơn về lâu dài
— nó dẫn thẳng tới column space ở Chương 3.

## Ba phép biến đổi hàng

Chỉ có ba thao tác được phép, và điểm chung của cả ba là **không làm đổi tập
nghiệm** (mỗi phép đều đảo ngược được):

| Phép | Ký hiệu | Vì sao không mất nghiệm |
|---|---|---|
| Đổi chỗ hai hàng | `R2 <-> R3` | thứ tự viết các phương trình không quan trọng |
| Nhân một hàng với số khác 0 | `R2 <- 3R2` | nhân hai vế một phương trình với số khác 0 |
| Cộng bội của hàng khác | `R3 <- R3 - 2R1` | cộng hai vế của hai phương trình đúng |

Chỗ hay sai duy nhất: **không được nhân một hàng với 0**. Phép đó biến một
phương trình thành `0 = 0`, làm mất thông tin và không đảo ngược được.

## Khử Gauss: đưa về dạng bậc thang

Ý tưởng: dùng phép thứ ba để tạo số 0 dưới đường chéo, từ trái sang phải.

```
[ 1  2  3 | 6 ]                      [ 1   2   3 |  6 ]
[ 2  5  2 | 4 ]  R2 <- R2 - 2R1  ->  [ 0   1  -4 | -8 ]
[ 6 -3  1 | 2 ]  R3 <- R3 - 6R1      [ 0 -15 -17 |-34 ]

                 R3 <- R3 + 15R2 ->  [ 1   2   3 |  6 ]
                                     [ 0   1  -4 | -8 ]
                                     [ 0   0 -77 |-154 ]
```

Số đầu tiên khác 0 của mỗi hàng gọi là **trụ** (pivot). Dạng thu được — mỗi trụ
nằm bên phải trụ của hàng trên, các hàng 0 nằm dưới cùng — gọi là **dạng bậc
thang** (row echelon form).

Nếu vị trí trụ đang là 0 thì **đổi chỗ** với một hàng bên dưới có số khác 0. Nếu
cả cột từ đó xuống đều bằng 0 thì cột đó **không có trụ** — ẩn tương ứng sẽ là
biến tự do.

Từ dạng bậc thang, giải ngược từ dưới lên (**back substitution**):
`-77z = -154` cho `z = 2`, thay lên hàng trên ra `y`, rồi ra `x`.

Nếu đi thêm một bước nữa — chia mỗi hàng cho trụ của nó để trụ bằng 1, rồi khử
cả các số **phía trên** trụ — thì được **dạng bậc thang rút gọn** (RREF), và
nghiệm hiện thẳng ở cột cuối, không cần thế ngược.

## Trụ, hạng và biến tự do

**Hạng** (rank) của `A` là **số trụ** — cũng là số hàng khác 0 sau khi khử. Đây
là con số cho biết hệ thực sự có bao nhiêu phương trình độc lập, khác với số
phương trình ghi trên giấy.

Ẩn ứng với cột có trụ gọi là **biến trụ**; ẩn ứng với cột không có trụ gọi là
**biến tự do**. Quan hệ luôn đúng:

```
số biến tự do = số ẩn − rank(A)
```

Biến tự do đúng như tên gọi: muốn gán giá trị nào cũng được, các biến trụ sẽ tự
điều chỉnh theo. Mỗi biến tự do là một "chiều tự do" của tập nghiệm.

## Ba trường hợp nghiệm

So `rank(A)` với `rank([A | b])` và với số ẩn `n`:

| Điều kiện | Kết quả | Dấu hiệu khi khử |
|---|---|---|
| `rank(A) < rank([A｜b])` | **vô nghiệm** | xuất hiện hàng `0 0 0 ｜ 5` |
| `rank(A) = rank([A｜b]) = n` | **nghiệm duy nhất** | mỗi ẩn đều có trụ |
| `rank(A) = rank([A｜b]) < n` | **vô số nghiệm** | có ít nhất một biến tự do |

Hàng `0 = 5` là mâu thuẫn hiển nhiên — không số nào thoả, nên hệ vô nghiệm. Còn
hàng `0 = 0` thì vô hại: nó chỉ nói phương trình đó lặp lại thông tin của các
phương trình khác.

> Số phương trình nhiều hơn số ẩn **không** đồng nghĩa với vô nghiệm, và ít hơn
> **không** đồng nghĩa với vô số nghiệm. Chỉ có `rank` quyết định.

## Nghiệm tổng quát = nghiệm riêng + nghiệm thuần nhất

Khi hệ có vô số nghiệm, viết tập nghiệm thành hai phần:

```
x = x_riêng + t₁·s₁ + t₂·s₂ + …
```

- **Nghiệm riêng** `x_riêng`: cho mọi biến tự do bằng 0, đọc các biến trụ từ RREF.
- **Nghiệm đặc biệt** `sᵢ`: cho biến tự do thứ `i` bằng 1, các biến tự do còn
  lại bằng 0, rồi giải `Ax = 0`.

Ví dụ với `x + 2y = 3`: nghiệm riêng là `(3, 0)`, nghiệm đặc biệt là `(-2, 1)`,
nên tập nghiệm là `(3, 0) + t·(-2, 1)` — đúng một đường thẳng trong mặt phẳng,
khớp với cách nhìn theo hàng ở trên.

Cấu trúc "một nghiệm riêng cộng toàn bộ nghiệm của hệ thuần nhất" sẽ quay lại ở
Chương 3 dưới tên **null space**.

## Những chỗ hay sai

- **Nhân một hàng với 0.** Mất nghiệm, không đảo ngược được. Cấm.
- **Cộng một hàng vào chính nó** trong phép thứ ba. `R2 <- R2 - 2R2` thực chất
  là nhân hàng với `-1`, dễ nhầm lẫn — luôn cộng bội của một hàng *khác*.
- **Quên vế phải.** Mọi phép biến đổi hàng phải áp dụng cho **cả** cột `b`. Đây
  là lý do dùng ma trận mở rộng `[A | b]` ngay từ đầu.
- **Nhầm `0 = 0` với `0 = 5`.** Cái đầu là hàng thừa (vô hại), cái sau là mâu
  thuẫn (vô nghiệm).
- **Kết luận theo số phương trình.** Chỉ `rank` mới quyết định, không phải số
  dòng viết trên giấy.
- **Quên kiểm tra lại.** Thay nghiệm ngược vào hệ ban đầu mất vài giây và bắt
  được gần như mọi lỗi tính toán.
