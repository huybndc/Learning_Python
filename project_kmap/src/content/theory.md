# Lý thuyết Gray code & Karnaugh map

Trang này là chỗ chứa ghi chú học tập. Nội dung nằm ở `src/content/theory.md` —
sửa thẳng file đó (Markdown thường, copy được từ vault Obsidian `CAU_1st`),
trang sẽ tự render lại.

## 1. Gray code là gì?

Gray code (mã Gray, hay *reflected binary code*) là cách đánh số sao cho **hai
mã liên tiếp chỉ khác nhau đúng 1 bit**.

| Decimal | Binary | Gray |
|---|---|---|
| 0 | 000 | 000 |
| 1 | 001 | 001 |
| 2 | 010 | 011 |
| 3 | 011 | 010 |
| 4 | 100 | 110 |
| 5 | 101 | 111 |
| 6 | 110 | 101 |
| 7 | 111 | 100 |

Lưu ý mã cuối (100) và mã đầu (000) cũng chỉ khác 1 bit ⇒ đây là một **chu trình
khép kín**, không phải một dãy thẳng.

### Công thức chuyển đổi

- **Binary → Gray:** `g[i] = b[i-1] XOR b[i]`, với `b[-1]` coi như 0.
  Bit trái là trọng số cao nhất, nên MSB được giữ nguyên.
- **Gray → Binary:** `b[i] = b[i-1] XOR g[i]`, dùng **bit binary vừa tính được**
  ở bước trước chứ không phải bit gray. Đây là chỗ hay nhầm nhất.

### Xây dựng bằng "reflect and prefix"

Gray n bit = (Gray n−1 bit, thêm tiền tố **0**) nối với (Gray n−1 bit **lật
ngược**, thêm tiền tố **1**).

Chỗ nối ở giữa là hai bản sao của cùng một chuỗi n−1 bit, nên chúng chỉ khác
nhau đúng ở bit tiền tố ⇒ quy tắc "1 bit" vẫn được giữ.

## 2. Vì sao K-map dùng thứ tự Gray?

Trong K-map, hai ô **kề nhau** phải khác nhau đúng **1 biến** — khi đó ghép
chúng lại thì biến đó bị triệt tiêu:

```
A'BC + ABC = BC(A' + A) = BC
```

Nếu dán nhãn theo thứ tự nhị phân thường (00, 01, **10**, 11) thì bước 01 → 10
đổi tới 2 bit ⇒ hai ô kề nhau *không* gộp được.

Thứ tự Gray (00, 01, **11**, 10) đảm bảo mọi bước chỉ đổi 1 bit, và vì Gray là
chu trình khép kín nên **cột cuối cũng kề cột đầu** ⇒ sinh ra các nhóm
**wrap-around** (ví dụ 4 góc của K-map 4 biến gộp được thành `B'D'`).

Nói cách khác: K-map chính là hình vẽ của **siêu khối n chiều** trải phẳng, và
Gray code là cách trải giữ nguyên quan hệ kề.

## 3. Quy tắc khoanh nhóm trên K-map

1. Nhóm phải có kích thước là **luỹ thừa của 2**: 1, 2, 4, 8, 16...
2. Nhóm phải là **hình chữ nhật trên mặt xuyến (torus)** — tức là được phép
   quấn qua biên trái/phải và trên/dưới.
3. Nhóm chỉ được chứa ô **1** hoặc **X** (don't care), không được chứa ô **0**.
4. Nhóm càng **lớn** thì term càng **ít literal** ⇒ luôn khoanh nhóm lớn nhất
   có thể.
5. Mọi ô **1** phải được ít nhất một nhóm phủ. Ô **X** thì *được phép* dùng để
   mở rộng nhóm nhưng **không bắt buộc** phải phủ.

Đọc term từ một nhóm: biến nào **giữ nguyên** giá trị ở mọi ô trong nhóm thì
được giữ lại (giá trị 1 → viết thường, giá trị 0 → viết phủ định); biến nào
**đổi** giá trị thì bị triệt tiêu.

## 4. Prime implicant và essential prime implicant

- **Implicant**: một nhóm hợp lệ (tích các literal, phủ toàn ô 1/X).
- **Prime implicant (PI)**: implicant **không thể mở rộng** thêm được nữa.
- **Essential prime implicant (EPI)**: PI phủ một ô 1 mà **không PI nào khác**
  phủ được ô đó ⇒ bắt buộc phải có mặt trong đáp án.

Quy trình rút gọn (Quine–McCluskey, cũng chính là thuật toán tab K-map dùng):

1. Liệt kê **tất cả** prime implicant bằng cách ghép các nhóm khác nhau đúng
   1 bit, lặp tới khi không ghép được nữa.
2. Chọn hết các **essential** PI.
3. Phủ phần ô 1 còn lại bằng số PI ít nhất; hoà thì chọn bên ít literal hơn.

## 5. SOP và POS

- **SOP** (Sum of Products, Σm): phủ các ô **1**, kết quả dạng `A'B + CD + ...`
- **POS** (Product of Sums, ΠM): phủ các ô **0** để rút gọn `F'`, rồi lấy bù
  bằng **De Morgan** ⇒ mỗi term tích thành một tổng, mỗi literal bị đảo dấu.

Ví dụ: nếu `F' = B'D'` thì `F = (B + D)`.

Hai dạng luôn tương đương về mặt hàm, nhưng số term/literal có thể khác nhau —
chọn dạng nào rẻ hơn tuỳ bài toán.

## 6. Những chỗ hay sai

- Quên rằng K-map **quấn biên** ⇒ bỏ sót nhóm 4 góc.
- Khoanh nhóm 3 ô hoặc 6 ô (không phải luỹ thừa của 2).
- Dùng `b[i-1]` của **gray** thay vì của **binary** khi đổi Gray → Binary.
- Bắt buộc phủ hết ô don't care (không cần — chúng chỉ là tuỳ chọn).
- Dừng lại ở đáp án đúng nhưng **chưa tối giản**: luôn kiểm tra xem có nhóm nào
  mở rộng thêm được không.
