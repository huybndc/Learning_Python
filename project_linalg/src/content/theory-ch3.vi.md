# Chương 3 — Không gian vector

Chương 1 hỏi *span của vài vector trông như thế nào*. Chương 2 cho công cụ trả
lời bằng số. Chương này đặt tên cho những gì đã thấy: **không gian con**,
**column space**, **null space**, **cơ sở**, **số chiều** — và phát hiện ra
rằng tất cả đều đọc được từ đúng một thứ đã quen: vị trí các trụ sau khi khử.

## Không gian con là gì

Một tập con `S` của `R³` gọi là **không gian con** nếu nó đóng kín với hai phép
toán của Chương 1:

1. `u, v ∈ S` thì `u + v ∈ S`
2. `v ∈ S` và `c` là số bất kỳ thì `c·v ∈ S`

Cho `c = 0` ở điều kiện 2 thấy ngay: **mọi không gian con đều phải chứa vector
0**. Đây là cách kiểm tra nhanh nhất — thấy một tập không chứa gốc toạ độ thì
khỏi cần xét gì thêm.

Trong `R³` chỉ có đúng bốn loại không gian con:

| Số chiều | Hình dạng | Ví dụ |
|---|---|---|
| 0 | một điểm — chính gốc toạ độ | `{(0,0,0)}` |
| 1 | một đường thẳng **qua gốc** | span của `(1,2,1)` |
| 2 | một mặt phẳng **qua gốc** | span của `(1,0,0)` và `(0,1,0)` |
| 3 | cả `R³` | span của ba vector độc lập |

Chữ "qua gốc" là chỗ hay bị bỏ quên. Mặt phẳng `z = 1` không phải không gian
con: nó không chứa gốc, và cộng hai điểm trên đó thì ra điểm có `z = 2`, rơi ra
ngoài.

Điều dễ chịu: **span của một bộ vector bất kỳ luôn là một không gian con**. Cộng
hai tổ hợp tuyến tính vẫn ra tổ hợp tuyến tính, nhân với số cũng vậy. Nên muốn
dựng một không gian con thì chỉ cần lấy span của vài vector.

## Column space: Ax = b giải được khi nào

Nhớ lại cách nhìn theo cột ở Chương 2: `Ax` chính là **tổ hợp tuyến tính các cột
của A**, với `x` là bộ hệ số. Vậy khi `x` chạy khắp nơi, `Ax` quét đúng span của
các cột. Tập đó gọi là **column space** `C(A)`.

> `Ax = b` có nghiệm ⇔ `b` nằm trong `C(A)`.

Câu này biến một câu hỏi đại số ("hệ có nghiệm không") thành một câu hỏi hình
học ("điểm `b` có nằm trên mặt phẳng đó không"), và ngược lại. Ba trường hợp
nghiệm của Chương 2 đọc lại theo ngôn ngữ mới:

- `b` ngoài `C(A)` → vô nghiệm
- `b` trong `C(A)`, các cột độc lập → nghiệm duy nhất
- `b` trong `C(A)`, các cột phụ thuộc → vô số nghiệm

**Cơ sở của `C(A)` là các cột trụ của `A`** — lấy nguyên các cột đó của ma trận
*gốc*, không phải cột của ma trận sau khi khử. Khử Gauss chỉ dùng để *chỉ ra*
cột nào là trụ; bản thân phép khử có làm đổi column space.

## Null space: nghiệm của Ax = 0

**Null space** `N(A)` là tập mọi `x` thoả `Ax = 0`. Đây luôn là một không gian
con (nếu `Ax = 0` và `Ay = 0` thì `A(x+y) = 0`), và luôn chứa `x = 0`.

Cơ sở của `N(A)` chính là các **nghiệm đặc biệt** đã dựng ở Chương 2: mỗi biến
tự do cho một nghiệm, bằng cách đặt biến đó bằng 1 và các biến tự do khác bằng 0.

```
dim N(A) = số biến tự do = số cột − rank(A)
```

Null space trả lời câu hỏi "nghiệm có duy nhất không": nghiệm của `Ax = b` là
duy nhất **đúng khi** `N(A)` chỉ có mỗi vector 0. Còn nếu `N(A)` là một đường
thẳng thì mọi nghiệm đều có dạng "một nghiệm riêng + điểm bất kỳ trên đường
thẳng đó" — đúng cấu trúc `x_riêng + t·s` của Chương 2, giờ đã có tên.

Lưu ý hai không gian này sống ở hai nơi khác nhau: với `A` cỡ `m×n` thì
`C(A) ⊆ Rᵐ` (số hàng), còn `N(A) ⊆ Rⁿ` (số cột).

## Độc lập tuyến tính

Bộ vector `v₁, …, vₖ` **độc lập tuyến tính** nếu

```
c₁v₁ + … + cₖvₖ = 0   chỉ xảy ra khi   c₁ = … = cₖ = 0
```

Nói cách khác: không vector nào viết được từ các vector còn lại — không ai
thừa. Nếu có một bộ hệ số khác 0 cho ra vector 0 thì bộ đó **phụ thuộc**.

Cách kiểm tra máy móc: xếp các vector thành **cột** của ma trận `A` rồi khử.

```
độc lập ⇔ rank(A) = số vector ⇔ mọi cột đều là cột trụ ⇔ N(A) = {0}
```

Vài sự thật đọc thẳng ra từ đó:

- Bộ có chứa vector 0 thì **luôn** phụ thuộc (lấy hệ số 1 cho riêng nó).
- Trong `R³`, **4 vector trở lên thì luôn phụ thuộc** — hạng không thể vượt quá
  3 là số hàng.
- Hai vector độc lập ⇔ không cùng phương.

## Cơ sở và số chiều

**Cơ sở** của một không gian con là một bộ vector vừa **độc lập**, vừa **span**
được toàn bộ không gian đó. Hai điều kiện kéo nhau về hai phía: thêm vector thì
dễ span nhưng dễ mất độc lập, bớt vector thì ngược lại. Cơ sở là chỗ cân bằng —
vừa đủ, không thừa không thiếu.

Một không gian con có **vô số cơ sở khác nhau**, nhưng mọi cơ sở của nó đều có
**cùng số vector**. Con số chung đó gọi là **số chiều** (dimension).

Trong `R³`, `(1,0,0), (0,1,0), (0,0,1)` là cơ sở quen thuộc nhất, nhưng
`(1,1,0), (0,1,1), (1,0,1)` cũng là một cơ sở hợp lệ — vẫn đúng ba vector.

Muốn rút một cơ sở từ một bộ vector bất kỳ: khử Gauss rồi **giữ lại các cột
trụ**. Các cột còn lại là những vector viết được từ các cột trụ, nên bỏ đi mà
span không đổi.

## Định lý hạng

Gom mọi thứ lại thành một đẳng thức duy nhất, đúng cho mọi ma trận `A` cỡ `m×n`:

```
rank(A) + dim N(A) = n        (n = số cột)
```

Đọc bằng lời: mỗi cột hoặc là cột trụ (góp một chiều cho column space), hoặc là
cột tự do (góp một chiều cho null space). Không cột nào làm cả hai, cũng không
cột nào đứng ngoài.

Một điều đáng ngạc nhiên nữa: **số chiều của row space luôn bằng số chiều của
column space**, dù hai không gian đó nằm ở hai nơi khác nhau và trông chẳng
giống nhau. Cả hai đều bằng `rank(A)` — đó là lý do hạng là con số quan trọng
nhất của một ma trận.

## Những chỗ hay sai

- **Quên "qua gốc toạ độ".** Đường thẳng hay mặt phẳng không đi qua gốc thì
  không phải không gian con, dù trông cũng "phẳng".
- **Lấy cột trụ của ma trận đã khử làm cơ sở cho `C(A)`.** Phải lấy các cột
  tương ứng của ma trận **gốc**; phép khử giữ nguyên *vị trí* cột trụ nhưng
  không giữ nguyên column space.
- **Nhầm `C(A)` với `N(A)`.** Với `A` cỡ `m×n`: `C(A)` nằm trong `Rᵐ`,
  `N(A)` nằm trong `Rⁿ`. Chúng thường còn không cùng số chiều của không gian bao.
- **Nghĩ nhiều vector hơn thì span rộng hơn.** Thêm một vector phụ thuộc thì
  span **không đổi** một chút nào.
- **Nhầm số vector với số chiều.** Bốn vector trong `R³` vẫn có thể chỉ span một
  đường thẳng — số chiều là `rank`, không phải số vector đếm được.
- **Quên vector 0.** Bộ nào chứa nó thì phụ thuộc, và `{0}` tự nó vẫn là một
  không gian con hợp lệ (số chiều 0).
