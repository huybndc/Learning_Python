# Tập hợp & hàm

*Theo MCS chương 4; Rosen §2.1–2.3.*

**Sau chương này bạn làm được:**
- Tính hợp, giao, hiệu, hiệu đối xứng, phần bù.
- Đếm |P(A)|, |A × B|, |A ∪ B|.
- Nhận ra hàm, đơn ánh, toàn ánh, song ánh.

## Tập hợp

Tập hợp là một nhóm phần tử **không thứ tự, không lặp**: {1, 2, 3} = {3, 1, 2} = {1, 1, 2, 3}.

- x ∈ A: x thuộc A. ∅: tập rỗng.
- **A ⊆ B**: mọi phần tử của A đều thuộc B.
- **A = B** ⇔ A ⊆ B và B ⊆ A — cách chuẩn để chứng minh hai tập bằng nhau.

## Các phép toán

| Ký hiệu | Nghĩa |
|---|---|
| A ∪ B | thuộc A **hoặc** B |
| A ∩ B | thuộc **cả** A và B |
| A − B | thuộc A, **không** thuộc B |
| A ⊕ B | thuộc **đúng một** trong hai |
| Aᶜ | thuộc U, không thuộc A |

Chúng khớp với phép nối logic: ∪ ↔ ∨, ∩ ↔ ∧, ᶜ ↔ ¬, ⊕ ↔ ⊕. Luật DeMorgan cũng đúng: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ.

<div data-check="c3q:setop" data-needs="c1q:value"></div>

## Đếm phần tử

- **Tập luỹ thừa** P(A) = tập mọi tập con của A: |P(A)| = **2^|A|** (mỗi phần tử: chọn hoặc không).
- **Tích Descartes** A × B = {(a, b)}: |A × B| = |A| · |B|.
- **Bao hàm – loại trừ:** |A ∪ B| = |A| + |B| − |A ∩ B| (phần chung bị đếm hai lần).

<div data-check="c3q:count"></div>

## Hàm

f: A → B là **hàm** khi mỗi phần tử của A có **đúng một** ảnh trong B. Thiếu ảnh hoặc hai ảnh ⇒ không phải hàm.

- **Đơn ánh (injective):** không hai phần tử nào chung ảnh.
- **Toàn ánh (surjective):** mọi phần tử của B đều là ảnh của ai đó.
- **Song ánh (bijection):** vừa đơn ánh vừa toàn ánh.

Tập hữu hạn: có song ánh A → B ⇔ |A| = |B|. Đây là nền của phép đếm.

<div data-check="c3q:func"></div>

## Những chỗ hay sai

- Viết {1, 1, 2} rồi đếm 3 phần tử — tập không lặp.
- Lẫn A − B với B − A.
- |A ∪ B| = |A| + |B| khi hai tập giao nhau — quên trừ phần chung.
- Nghĩ "đơn ánh" là mọi phần tử của B đều được trỏ tới — đó là toàn ánh.
- Quên kiểm "có phải hàm không" trước khi hỏi đơn/toàn ánh.
