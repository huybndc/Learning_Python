# Đồ thị

*Theo MCS §12.1–12.9, đếm đường đi §10.3; Rosen §10.1–10.5, 11.1. Hình trong đề: đỉnh a, b, c… xếp trên vòng tròn.*

**Sau chương này bạn làm được:**
- Dùng định lý bắt tay; kiểm một dãy bậc có vẽ được không.
- Đếm đường đi bằng ma trận kề; tìm khoảng cách bằng BFS; đếm thành phần liên thông.
- Nhận ra đồ thị hai phía, chu trình Euler, cây; chứng minh hai đồ thị không đẳng cấu.

## Đồ thị đơn và bậc

**Đồ thị đơn** G = (V, E): V là tập đỉnh, E là tập cạnh, mỗi cạnh là một cặp **hai đỉnh khác nhau** (không khuyên, không cạnh lặp). Hai đỉnh chung một cạnh là **kề nhau**.

**Bậc** deg(v) = số cạnh chạm v.

**Định lý bắt tay:** Σ deg(v) = 2·|E| — mỗi cạnh góp 1 vào bậc của **cả hai** đầu.

Hệ quả: số đỉnh bậc lẻ luôn **chẵn**.

```
dãy bậc 3, 3, 2, 2, 2  ⇒  tổng 12  ⇒  |E| = 6
```

<div data-check="c8q:degree"></div>

## Dãy bậc nào vẽ được

Hỏi: có đồ thị đơn nào có dãy bậc cho trước? Hai bước:

1. Tổng phải **chẵn** (bắt tay). Lẻ ⇒ không.
2. **Havel–Hakimi:** bỏ số lớn nhất d, trừ 1 vào **d số lớn nhất** còn lại, xếp lại; lặp. Về toàn 0 ⇒ vẽ được; ra số âm ⇒ không.

```
(3, 3, 3, 1): tổng 10, chẵn
bỏ 3, trừ 1 vào 3 số sau → (2, 2, 0)
bỏ 2, trừ 1 vào 2 số sau → (1, −1)   ⇒ không vẽ được
```

Tổng chẵn là điều kiện **cần**, chưa **đủ**.

<div data-check="c8q:valid" data-needs="c8q:degree"></div>

## Các đồ thị hay gặp

| Tên | Hình dạng | Số cạnh |
|---|---|---|
| Kₙ (đầy đủ) | mọi cặp đỉnh kề nhau | n(n − 1)/2 |
| Lₙ (đường) | n đỉnh xếp thẳng hàng | n − 1 |
| Cₙ (vòng) | n đỉnh xếp vòng, n ≥ 3 | n |
| Kₘ,ₙ (hai phía đầy đủ) | m đỉnh bên này nối hết n đỉnh bên kia | m·n |

Đếm cạnh Kₙ bằng bắt tay: n đỉnh, mỗi đỉnh bậc n − 1 ⇒ |E| = n(n − 1)/2.

<div data-check="c8q:special" data-needs="c8q:degree"></div>

## Đường đi và ma trận kề

**Đường đi (walk)** độ dài k: dãy v₀, v₁, …, vₖ, hai đỉnh liền nhau kề nhau — **được** lặp đỉnh, lặp cạnh. Không lặp đỉnh thì gọi là **path**.

**Ma trận kề** A: Aᵤᵥ = 1 nếu u kề v, ngược lại 0 (đồ thị vô hướng ⇒ A đối xứng).

**Định lý (MCS 10.3):** phần tử (u, v) của **Aᵏ** = số đường đi độ dài k từ u tới v.

Vì sao: đường độ dài 2 từ u tới v = chọn đỉnh giữa w với u kề w, w kề v; cộng A(u, w)·A(w, v) theo mọi w — đúng là phép nhân ma trận.

<div data-check="c8q:walks"></div>

## Khoảng cách và BFS

**Khoảng cách** dist(u, v) = số cạnh của đường **ngắn nhất** từ u tới v.

**BFS** (tìm theo chiều rộng) tính mọi khoảng cách từ s:

- Tầng 0 = {s}.
- Tầng i + 1 = các đỉnh **chưa thăm** kề một đỉnh ở tầng i.

Đỉnh ở tầng i cách s đúng i cạnh. Lần ngược "ai phát hiện ra mình" là được một đường ngắn nhất.

<div data-check="c8q:dist"></div>

## Liên thông

G **liên thông** khi mọi cặp đỉnh có đường đi nối nhau.

**Thành phần liên thông** = một nhóm đỉnh tới được nhau, không tới được ai bên ngoài. Tìm: BFS từ một đỉnh chưa thăm, được một thành phần; lặp lại.

Đỉnh cô lập (bậc 0) tự nó là **một** thành phần.

<div data-check="c8q:comp" data-needs="c8q:dist"></div>

## Đồ thị hai phía

G **hai phía** khi chia được V = X ∪ Y sao cho **mọi cạnh** nối một đỉnh X với một đỉnh Y.

**Định lý (MCS 12.8):** G hai phía ⇔ G **không có chu trình độ dài lẻ**.

Kiểm bằng tô màu BFS: tầng chẵn vào X, tầng lẻ vào Y. Có cạnh nối hai đỉnh cùng màu ⇒ tìm được chu trình lẻ ⇒ không hai phía.

Vd Cₙ hai phía ⇔ n chẵn; cây luôn hai phía.

<div data-check="c8q:bipartite" data-needs="c8q:dist"></div>

## Chu trình Euler

**Chu trình Euler** đi qua **mỗi cạnh đúng một lần** rồi về chỗ cũ; **đường đi Euler** cũng vậy nhưng không cần về.

**Định lý (Euler):** với G liên thông (bỏ qua đỉnh cô lập):

- Có chu trình Euler ⇔ **mọi** bậc chẵn.
- Có đường đi Euler (không khép) ⇔ **đúng 2** đỉnh bậc lẻ — đường đi nối hai đỉnh đó.

Vì sao chẵn: mỗi lần đi **qua** một đỉnh dùng một cạnh vào, một cạnh ra.

<div data-check="c8q:euler" data-needs="c8q:degree c8q:comp"></div>

## Cây và rừng

**Cây** = đồ thị liên thông, không có chu trình. **Rừng** = không chu trình (mỗi thành phần là một cây). **Lá** = đỉnh bậc 1.

Tính chất (MCS 12.9):

- Cây n đỉnh có đúng **n − 1** cạnh.
- Giữa hai đỉnh của cây có **đúng một** path.
- Cây từ 2 đỉnh có ít nhất 2 lá.
- Rừng n đỉnh, c cây có **n − c** cạnh.

Mọi đồ thị liên thông có **cây khung** (n − 1 cạnh) — bỏ dần cạnh nằm trên chu trình.

<div data-check="c8q:tree" data-needs="c8q:comp"></div>

## Đẳng cấu

G và H **đẳng cấu** khi có song ánh f: V(G) → V(H) sao cho uv là cạnh của G ⇔ f(u)f(v) là cạnh của H. Nói gọn: **vẽ khác, cùng một đồ thị**.

Chứng minh **không** đẳng cấu: tìm một **bất biến** khác nhau — số đỉnh, số cạnh, dãy bậc, số tam giác, số thành phần, có chu trình lẻ hay không.

Chú ý: cùng dãy bậc **chưa chắc** đẳng cấu. C₆ và hai tam giác rời đều có mọi bậc bằng 2.

Chứng minh **có** đẳng cấu: chỉ ra f và kiểm mọi cạnh.

<div data-check="c8q:iso" data-needs="c8q:degree c8q:special"></div>

## Những chỗ hay sai

- Quên chia 2 khi dùng định lý bắt tay.
- Thấy tổng bậc chẵn là kết luận vẽ được — còn phải Havel–Hakimi.
- Đếm đường đi (walk) mà cấm lặp đỉnh — Aᵏ đếm cả đường lặp.
- Quên đỉnh cô lập khi đếm thành phần.
- Euler: nhầm "mọi bậc chẵn" (qua mỗi **cạnh**) với chu trình Hamilton (qua mỗi **đỉnh**).
- Kết luận đẳng cấu chỉ vì cùng dãy bậc.
