# Quy nạp

*Theo MCS §5.1; Rosen §5.1.*

**Sau chương này bạn làm được:**
- Viết một chứng minh quy nạp đủ hai bước, đúng khuôn.
- Biết bước quy nạp phải chứng minh đẳng thức nào.
- Dùng công thức tổng đã chứng minh; loại công thức sai bằng thử giá trị.

## Nguyên lý quy nạp

Muốn chứng minh P(n) đúng với **mọi n ≥ 0** (hoặc ≥ 1):

1. **Cơ sở:** chứng minh P(0).
2. **Bước quy nạp:** với mọi k, **giả sử P(k)** (giả thiết quy nạp), chứng minh P(k + 1).

Như hàng domino: đổ quân đầu, và quân nào đổ cũng làm đổ quân sau ⇒ mọi quân đều đổ.

## Khuôn viết chứng minh

```
Chứng minh bằng quy nạp theo n. Đặt P(n): "…".
Cơ sở: P(1) đúng vì …
Bước quy nạp: giả sử P(k) đúng với một k ≥ 1.
   … (dùng P(k) ở đây) …
   nên P(k + 1) đúng.
Theo nguyên lý quy nạp, P(n) đúng với mọi n ≥ 1.
```

Luôn chỉ rõ **chỗ nào dùng giả thiết quy nạp** — đó là trái tim của chứng minh.

## Ví dụ: 1 + 2 + … + n = n(n + 1)/2

**Cơ sở:** n = 1: vế trái 1, vế phải 1·2/2 = 1. ✓

**Bước quy nạp:** giả sử 1 + … + k = k(k + 1)/2. Cộng (k + 1) vào hai vế:

```
1 + … + k + (k + 1) = k(k + 1)/2 + (k + 1)
                    = (k + 1)(k + 2)/2          ← đúng công thức tại k + 1 ✓
```

<div data-check="c4q:step" data-needs="c2q:truth"></div>

## Công thức tổng hay dùng

```
1 + 2 + … + n            = n(n + 1)/2
1 + 3 + … + (2n − 1)     = n²
1² + 2² + … + n²         = n(n + 1)(2n + 1)/6
1 + 2 + 4 + … + 2ⁿ⁻¹     = 2ⁿ − 1
```

Cả bốn đều chứng minh bằng quy nạp đúng khuôn trên.

<div data-check="c4q:sum"></div>

## Đoán công thức rồi chứng minh

Tính vài giá trị đầu, đoán quy luật, **rồi mới** chứng minh bằng quy nạp.

Thử giá trị **không chứng minh** được gì, nhưng **bác bỏ** được: công thức sai sẽ lệch ở một n nào đó. Vd n² + n − 1 khớp tổng 1 + 3 + … tại n = 1 nhưng lệch từ n = 2.

<div data-check="c4q:formula" data-needs="c4q:sum"></div>

## Những chỗ hay sai

- Bỏ bước cơ sở — bước quy nạp đúng mà cơ sở sai thì cả chứng minh sai.
- Giả sử luôn P(k + 1) (điều cần chứng minh) thay vì P(k).
- Không dùng giả thiết quy nạp — thường là dấu hiệu chứng minh lạc hướng.
- Cộng nhầm số hạng thứ k thay vì thứ k + 1.
- "Chứng minh" bằng thử n = 1, 2, 3.
