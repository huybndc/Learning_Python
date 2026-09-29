# Mệnh đề & logic

*Theo Mathematics for Computer Science (MCS) chương 1, 3; Rosen §1.1–1.3.*

**Sau chương này bạn làm được:**
- Lập bảng chân trị của một công thức.
- Nhận ra hằng đúng, hằng sai; kiểm tra hai công thức có tương đương không.
- Viết đảo, phản đảo, nghịch đảo của một phép kéo theo.

## Mệnh đề

**Mệnh đề** là một câu hoặc đúng (T) hoặc sai (F), không thể cả hai.

- "2 + 3 = 5" — mệnh đề đúng.
- "Mọi số nguyên tố đều lẻ" — mệnh đề sai (2 là số nguyên tố chẵn).
- "x + 1 = 2" — **chưa** là mệnh đề: đúng hay sai tuỳ x. Đó là *vị từ* (chương sau).

Ta đặt tên mệnh đề bằng chữ thường p, q, r rồi ghép chúng bằng các phép nối.

## Các phép nối ¬ ∧ ∨ ⊕

| p | q | ¬p | p ∧ q | p ∨ q | p ⊕ q |
|---|---|---|---|---|---|
| F | F | T | F | F | F |
| F | T | T | F | T | T |
| T | F | F | F | T | T |
| T | T | F | T | T | F |

**p ∨ q** là "hoặc" *bao hàm*: cả hai đúng vẫn đúng. **p ⊕ q** là "hoặc" *loại trừ*: đúng khi đúng một trong hai.

<div data-check="c1q:value"></div>

## Phép kéo theo p → q

**p → q chỉ sai khi p đúng mà q sai.** Tiền đề sai thì cả câu đúng:
"Nếu 1 = 2 thì tôi là giáo hoàng" là mệnh đề **đúng**.

| p | q | p → q |
|---|---|---|
| F | F | T |
| F | T | T |
| T | F | **F** |
| T | T | T |

<details><summary>Các cách đọc p → q</summary>

"nếu p thì q", "p kéo theo q", "q nếu p", "p chỉ khi q", "p là điều kiện đủ của q", "q là điều kiện cần của p".

</details>

**p ↔ q** ("khi và chỉ khi") đúng khi p và q cùng giá trị.

## Lập bảng chân trị

Mỗi biến có 2 giá trị ⇒ n biến có **2ⁿ dòng**. Cách làm không sót:

1. Liệt kê dòng theo thứ tự đếm nhị phân: FFF, FFT, FTF, …
2. Mỗi **công thức con** một cột phụ, tính từ trong ngoặc ra ngoài.
3. Cột cuối là công thức cần tìm.

Ưu tiên: ¬ trước ∧, ∧ trước ∨, rồi → , cuối cùng ↔. Không chắc thì thêm ngoặc.

<div data-check="c1q:table" data-needs="c1q:value"></div>

## Hằng đúng, hằng sai, khả thỏa

Nhìn vào cột cuối của bảng chân trị:

- **Toàn T** ⇒ *hằng đúng* (tautology, còn gọi là *valid*): vd p ∨ ¬p.
- **Toàn F** ⇒ *hằng sai* (contradiction): vd p ∧ ¬p.
- **Có cả T lẫn F** ⇒ *khả thỏa* nhưng không hằng đúng.

Một công thức **khả thỏa** khi có ít nhất một dòng T. Hằng đúng thì khả thỏa; điều ngược lại không đúng.

<div data-check="c1q:classify" data-needs="c1q:table"></div>

## Tương đương logic

A ≡ B khi hai cột chân trị **giống hệt nhau trên mọi dòng** (tức A ↔ B là hằng đúng). Chỉ cần **một** dòng khác là không tương đương.

Những tương đương hay dùng:

```
p → q        ≡  ¬p ∨ q
¬(p ∧ q)     ≡  ¬p ∨ ¬q        (DeMorgan)
¬(p ∨ q)     ≡  ¬p ∧ ¬q        (DeMorgan)
p ∧ (q ∨ r)  ≡  (p ∧ q) ∨ (p ∧ r)
¬(p → q)     ≡  p ∧ ¬q
```

<div data-check="c1q:equiv" data-needs="c1q:table"></div>

## Đảo, phản đảo, nghịch đảo

Từ p → q:

| Tên | Công thức | Tương đương p → q? |
|---|---|---|
| phản đảo (contrapositive) | ¬q → ¬p | **có** |
| đảo (converse) | q → p | không |
| nghịch đảo (inverse) | ¬p → ¬q | không |

Chứng minh phản đảo dựa đúng vào dòng đầu: chứng minh ¬q → ¬p cũng là chứng minh p → q.

<div data-check="c1q:contra" data-needs="c1q:equiv"></div>

## Những chỗ hay sai

- Nghĩ p → q **sai** khi p sai. Không: tiền đề sai thì câu kéo theo luôn đúng.
- Lẫn **đảo** với **phản đảo**: chỉ phản đảo tương đương với câu gốc.
- DeMorgan quên đổi phép: ¬(p ∧ q) là ¬p **∨** ¬q, không phải ¬p ∧ ¬q.
- Thiếu dòng: n biến phải đủ 2ⁿ dòng.
- Hiểu ∨ là "hoặc loại trừ". Trong toán, "hoặc" là bao hàm; loại trừ viết ⊕.
