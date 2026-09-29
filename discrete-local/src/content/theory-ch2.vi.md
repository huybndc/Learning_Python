# Lượng từ & chứng minh

*Theo MCS chương 1–3 (§3.6); Rosen §1.4–1.8.*

**Sau chương này bạn làm được:**
- Đọc và xét đúng/sai mệnh đề có ∀, ∃, kể cả lượng từ lồng nhau.
- Phủ định mệnh đề có lượng từ.
- Chọn phương pháp chứng minh phù hợp và nhận ra lỗi thường gặp.

## Vị từ và lượng từ

**Vị từ** P(x) là câu có biến; gán giá trị cho x mới thành mệnh đề. Vd P(x): "x > 3".

- **∀x P(x)**: P đúng với **mọi** x trong miền.
- **∃x P(x)**: P đúng với **ít nhất một** x.

**Miền** quan trọng: ∃x (x² = 2) đúng trên số thực, sai trên số nguyên.

Chứng minh ∀ sai: một **phản ví dụ** là đủ. Chứng minh ∃ đúng: chỉ ra một **phần tử**.

<div data-check="c2q:truth"></div>

## Lượng từ lồng nhau: thứ tự là nghĩa

- **∀x ∃y (x + y = 0)**: với mỗi x có một y (y = −x, tuỳ x) — đúng trên số nguyên.
- **∃y ∀x (x + y = 0)**: có **một** y dùng chung cho mọi x — sai.

Đọc từ trái sang phải; biến ở sau được phép phụ thuộc biến ở trước.

<details><summary>Mẹo kiểm tra trên miền nhỏ</summary>

Viết bảng: mỗi hàng một giá trị của biến ngoài. ∀ ngoài cần mọi hàng ✓; ∃ ngoài cần một hàng ✓. Trong mỗi hàng, ∃ trong cần tìm được một phần tử, ∀ trong cần không có phản ví dụ.

</details>

## Phủ định lượng từ

```
¬∀x P(x)  ≡  ∃x ¬P(x)
¬∃x P(x)  ≡  ∀x ¬P(x)
¬(A → B)  ≡  A ∧ ¬B
```

Đi từ **ngoài vào**: đổi từng lượng từ, cuối cùng phủ định phần thân.

Vd ¬∀x (P(x) → Q(x)) ≡ ∃x (P(x) ∧ ¬Q(x)): "không phải mọi P đều Q" nghĩa là "có một P mà không Q".

<div data-check="c2q:negate" data-needs="c2q:truth c1q:equiv"></div>

## Các phương pháp chứng minh

Để chứng minh **p → q**:

- **Trực tiếp:** giả sử p, suy ra q.
- **Phản đảo:** giả sử ¬q, suy ra ¬p.
- **Phản chứng:** giả sử p và ¬q, dẫn tới mâu thuẫn.
- **Chia trường hợp:** tách p thành các trường hợp phủ kín, chứng minh từng cái.

Chứng minh **p ↔ q**: chứng minh cả p → q và q → p.

<details><summary>Ví dụ: √2 vô tỉ (phản chứng)</summary>

Giả sử √2 = a/b tối giản. Thì a² = 2b² nên a chẵn, a = 2c; suy ra b² = 2c² nên b cũng chẵn — trái với "tối giản".

</details>

## Nguyên lý sắp thứ tự tốt

**Mọi tập số tự nhiên khác rỗng đều có phần tử nhỏ nhất.**

Dùng để chứng minh "mọi n có tính chất P": giả sử tập các phản ví dụ khác rỗng, lấy phản ví dụ **nhỏ nhất** m, rồi tìm ra một phản ví dụ còn nhỏ hơn m — mâu thuẫn.

Đây chính là quy nạp viết theo kiểu phản chứng (chương D4).

## Những chỗ hay sai

- Đảo thứ tự ∀∃ mà nghĩ vẫn như cũ.
- Phủ định ∀x (P → Q) thành ∃x (P → ¬Q) — phải là ∃x (P ∧ ¬Q).
- "Chứng minh" ∀ bằng vài ví dụ đúng. Ví dụ chỉ **bác bỏ** được ∀.
- Chứng minh q → p (đảo) thay vì p → q.
- Phản chứng mà không chỉ ra mâu thuẫn cụ thể.
