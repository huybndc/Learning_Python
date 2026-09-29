# Bất biến & quy nạp mạnh

*Theo MCS §5.2–5.3 và chương 6 (máy trạng thái); Rosen §5.2.*

**Sau chương này bạn làm được:**
- Tìm một bất biến để chứng minh một trạng thái **không thể** đạt tới.
- Dùng quy nạp mạnh cho các bài "mọi số từ một ngưỡng trở đi".

## Máy trạng thái và bất biến

Một quá trình gồm các **trạng thái** và các **bước chuyển**. **Bất biến** là tính chất:

1. đúng ở trạng thái đầu, và
2. nếu đúng trước một bước thì vẫn đúng sau bước đó.

Khi đó nó đúng ở **mọi** trạng thái đạt tới được (chính là quy nạp theo số bước). Trạng thái nào vi phạm bất biến thì **không bao giờ** tới được.

## Bài bình nước Die Hard

Hai bình a lít và b lít. Được: đổ đầy, đổ hết, rót bình này sang bình kia tới khi đầy/cạn.

**Bất biến:** lượng nước trong mỗi bình luôn là **bội của gcd(a, b)**. (Đúng lúc đầu: 0; mỗi bước chỉ cộng/trừ a hoặc b hoặc chuyển nước giữa hai bình.)

Và ngược lại: mọi bội của gcd không quá bình lớn đều đong được. Vd bình 3 và 5 lít: gcd = 1 nên đong được 4 lít.

<div data-check="c5q:jugs" data-needs="c6q:gcd"></div>

## Quy nạp mạnh

Giống quy nạp thường, nhưng ở bước quy nạp được giả sử **P(0), P(1), …, P(k) đều đúng** (không chỉ P(k)) để chứng minh P(k + 1).

Dùng khi P(k + 1) cần tới một trường hợp **nhỏ hơn nhiều**, không phải ngay trước nó — vd phân tích một số thành tích số nguyên tố.

## Bài tem thư

Chỉ có tem 3 xu và 5 xu: trả được mọi số tiền **từ 8 xu trở đi**.

- Cơ sở: 8 = 3 + 5, 9 = 3 + 3 + 3, 10 = 5 + 5 — ba số liên tiếp.
- Bước: n ≥ 11 thì n − 3 ≥ 8 trả được (giả thiết mạnh), thêm một tem 3 xu.

Tổng quát, tem a và b nguyên tố cùng nhau: số lớn nhất **không** trả được là **a·b − a − b**.

<div data-check="c5q:stamps" data-needs="c4q:step"></div>

## Những chỗ hay sai

- Chọn "bất biến" không đúng ở trạng thái đầu, hoặc bị phá bởi một bước nào đó.
- Tưởng đong được mọi số ≤ bình lớn — chỉ các bội của gcd.
- Quy nạp mạnh mà chỉ có một trường hợp cơ sở, trong khi bước lùi về k − 2 hoặc k − 3 cần nhiều cơ sở.
- Nghĩ không tìm ra cách thì là "không thể" — muốn chứng minh không thể phải có bất biến.
