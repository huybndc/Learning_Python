# Đồng dư & RSA

*Theo MCS §9.6–9.11; Rosen §4.4, 4.6. Các bước RSA theo mẫu của giảng viên.*

**Sau chương này bạn làm được:**
- Tính a mod n, cộng/nhân theo mod n.
- Tìm nghịch đảo modulo; tính lũy thừa mod bằng bình phương liên tiếp.
- Tính φ(n); tạo khoá, mã hoá, giải mã RSA với số nhỏ.

## Đồng dư

**a ≡ b (mod n)** khi n | (a − b), tức a và b **cùng số dư** khi chia cho n.

Vd 17 ≡ 2 (mod 5), −3 ≡ 7 (mod 10).

Đồng dư **giữ được phép cộng và nhân**: nếu a ≡ b và c ≡ d (mod n) thì a + c ≡ b + d và a·c ≡ b·d. Vì vậy có thể rút gọn mod n **giữa chừng** phép tính, số không bao giờ lớn.

**a mod n** là số dư trong 0 … n − 1 (kể cả khi a âm).

<div data-check="c7q:mod"></div>

## Nghịch đảo modulo

x là **nghịch đảo** của a theo mod n khi a·x ≡ 1 (mod n).

**Tồn tại ⇔ gcd(a, n) = 1.** Cách tìm: Pulverizer cho s·n + t·a = 1; lấy mod n hai vế ⇒ t·a ≡ 1, vậy **x = t mod n**.

```
nghịch đảo của 7 mod 26:
26 = 3·7 + 5     5 = 1·26 − 3·7
 7 = 1·5 + 2     2 = −1·26 + 4·7
 5 = 2·2 + 1     1 = 3·26 − 11·7   ⇒ x = −11 mod 26 = 15
```

Kiểm: 7·15 = 105 = 4·26 + 1. ✓ Có nghịch đảo thì **chia** được theo mod n.

<div data-check="c7q:inverse" data-needs="c7q:mod c6q:bezout"></div>

## Lũy thừa mod: bình phương liên tiếp

Tính 3¹³ mod 7 mà không tính 3¹³:

```
13 = 8 + 4 + 1 = (1101)₂
3¹ ≡ 3,  3² ≡ 2,  3⁴ ≡ 4,  3⁸ ≡ 2      (mỗi ô = bình phương ô trước, mod 7)
3¹³ = 3⁸·3⁴·3¹ ≡ 2·4·3 = 24 ≡ 3
```

Chỉ cần khoảng 2·log₂k phép nhân — cách RSA mã hoá số hàng trăm chữ số.

<div data-check="c7q:power" data-needs="c7q:mod"></div>

## Hàm φ, định lý Euler và Fermat

**φ(n)** = số các số trong 1 … n nguyên tố cùng nhau với n.

- p nguyên tố: φ(p) = p − 1; φ(pᵉ) = pᵉ⁻¹(p − 1).
- gcd(a, b) = 1 ⇒ φ(a·b) = φ(a)·φ(b). Vd φ(36) = φ(4)·φ(9) = 2·6 = 12.

**Định lý Euler:** gcd(a, n) = 1 ⇒ a^φ(n) ≡ 1 (mod n). Trường hợp n = p nguyên tố là **Fermat nhỏ**: aᵖ⁻¹ ≡ 1 (mod p).

<div data-check="c7q:phi" data-needs="c6q:gcd"></div>

## RSA

**Tạo khoá:** chọn hai số nguyên tố p, q; n = p·q; φ = (p − 1)(q − 1); chọn e với gcd(e, φ) = 1; **d = e⁻¹ mod φ**.
Khoá công khai (n, e), khoá bí mật d.

**Mã hoá:** c = mᵉ mod n. **Giải mã:** m = cᵈ mod n.

**Vì sao đúng:** e·d = 1 + kφ nên (mᵉ)ᵈ = m·(mᵠ)ᵏ ≡ m (Euler). Bảo mật vì biết n mà **không** phân tích được thành p·q thì không tính được φ, nên không tính được d.

<div data-check="c7q:rsa" data-needs="c7q:inverse c7q:power c7q:phi"></div>

## Những chỗ hay sai

- Số dư âm: −7 mod 5 = 3, không phải −2.
- Tìm nghịch đảo khi gcd ≠ 1 — không tồn tại.
- Lấy t từ Pulverizer mà quên đưa về 0 … n − 1.
- RSA: tính d theo mod **n** thay vì mod **φ**.
- Tính mᵉ đầy đủ rồi mới mod — số quá lớn; mod sau **mỗi** phép nhân.
