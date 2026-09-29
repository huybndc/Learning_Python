# Chia hết & gcd

*Theo MCS §9.1–9.4; Rosen §4.1, 4.3.*

**Sau chương này bạn làm được:**
- Tìm gcd bằng thuật toán Euclid, trình bày từng dòng.
- Viết gcd thành tổ hợp s·a + t·b bằng Pulverizer.
- Tìm lcm; dùng phân tích thừa số nguyên tố.

## Chia hết

**a | b** (đọc "a chia hết b") khi b = k·a với k nguyên. Vd 3 | 12, 5 ∤ 12.

Tính chất hay dùng:

- a | b và a | c ⇒ a | (s·b + t·c) với mọi s, t nguyên.
- a | b và b | c ⇒ a | c.

<details><summary>Vì sao tính chất đầu quan trọng</summary>

Nó nói: ước chung của a và b cũng chia hết **mọi** tổ hợp s·a + t·b — đây là chìa khoá của Euclid và Pulverizer.

</details>

## Chia có dư

Với b > 0, mọi số nguyên a viết được **duy nhất** thành

```
a = q·b + r,    0 ≤ r < b
```

q là thương, r = **a rem b** là số dư. Chú ý số âm: −7 = (−2)·5 + 3 nên −7 rem 5 = 3, không phải −2.

## Thuật toán Euclid

Ý chính: **gcd(a, b) = gcd(b, a rem b)** — ước chung của a, b cũng là ước chung của b và a − q·b.

```
gcd(259, 70):
259 = 3·70 + 49
 70 = 1·49 + 21
 49 = 2·21 + 7
 21 = 3·7  + 0     ⇒ gcd = 7
```

Số dư khác 0 cuối cùng là gcd. Số bước rất ít (khoảng 2·log₂ của số lớn).

<div data-check="c6q:gcd"></div>

## Pulverizer: gcd = s·a + t·b

gcd(a, b) luôn viết được thành **s·a + t·b** (s, t nguyên — *hệ số Bézout*). Pulverizer chạy Euclid, nhưng ghi **mỗi số dư dưới dạng s·a + t·b**:

```
a = 259, b = 70
 49 = 259 − 3·70           =  1·259 − 3·70
 21 =  70 − 1·49           = −1·259 + 4·70
  7 =  49 − 2·21           =  3·259 − 11·70
```

Kiểm lại: 3·259 − 11·70 = 777 − 770 = 7. ✓

<div data-check="c6q:bezout" data-needs="c6q:gcd"></div>

## gcd là tổ hợp dương nhỏ nhất

**Định lý (MCS 9.2.2):** gcd(a, b) là số **dương nhỏ nhất** viết được dạng s·a + t·b.

Hệ quả hay dùng:

- s·a + t·b = 1 có nghiệm ⇔ gcd(a, b) = 1 (a, b *nguyên tố cùng nhau*).
- Mọi ước chung của a, b đều chia hết gcd(a, b).

Chương sau dùng đúng điều này để tìm **nghịch đảo modulo**.

## Số nguyên tố & lcm

**Định lý cơ bản của số học:** mọi số > 1 phân tích **duy nhất** thành tích số nguyên tố, vd 360 = 2³·3²·5.

Từ phân tích: gcd lấy số mũ **nhỏ** hơn, lcm lấy số mũ **lớn** hơn. Và luôn có

```
gcd(a, b) · lcm(a, b) = a · b
```

<div data-check="c6q:lcm" data-needs="c6q:gcd"></div>

## Những chỗ hay sai

- Dừng Euclid sai chỗ: gcd là số dư khác 0 **cuối cùng**, không phải số dư 0.
- Pulverizer lệch dấu: kiểm lại s·a + t·b bằng phép nhân thật.
- Tưởng cặp (s, t) là duy nhất — có vô số cặp.
- Số dư âm: r luôn nằm trong 0 … b − 1.
- lcm = a·b chỉ khi gcd = 1.
