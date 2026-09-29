# Discrete Math — Local Study Module

Đây là module **Discrete Mathematics độc lập** trong repository này.

Mục đích của module là **chỉ để học và ôn luyện Discrete Math**. Module không cần chạy Study_Hub và không phụ thuộc vào các môn khác.

## 1. Người mới hoàn toàn: Git là gì?

Bạn chỉ cần hiểu 4 từ:

- **repository (repo)**: thư mục dự án được Git theo dõi.
- **clone**: tải một repo từ GitHub về máy.
- **pull**: lấy thay đổi mới nhất từ GitHub về máy.
- **push**: gửi thay đổi từ máy lên GitHub.

Bạn **không cần fork** nếu bạn chỉ muốn dùng module này trên máy của mình.

Nếu bạn chỉ muốn học, quy trình cơ bản là:

```text
GitHub
  ↓ clone
Máy của bạn
  ↓ npm install
Cài thư viện
  ↓ npm run dev
Chạy app
```

## 2. Yêu cầu

Cài hai phần mềm:

### Git

Kiểm tra:

```bash
git --version
```

Nếu máy chưa có Git, cài Git trước.

### Node.js

Module dùng Vite/JavaScript.

Kiểm tra:

```bash
node --version
npm --version
```

Nên dùng Node.js LTS hiện tại.

## 3. Lấy project về máy

Mở Terminal.

Chọn một thư mục bạn muốn đặt project, sau đó chạy:

```bash
git clone https://github.com/huybndc/Learning_Python.git
```

Đi vào project:

```bash
cd Learning_Python
```

Kiểm tra:

```bash
git status
```

Nếu Git báo branch `main` và working tree sạch thì bạn đã lấy project thành công.

## 4. Đi vào Discrete Math

Module nằm ở:

```text
Learning_Python/
└── discrete-local/
```

Chạy:

```bash
cd discrete-local
```

## 5. Cài thư viện lần đầu

Chỉ cần làm bước này lần đầu hoặc sau khi `package.json` thay đổi:

```bash
npm install
```

Sau khi hoàn thành, thư mục `node_modules/` sẽ được tạo.

**Không commit `node_modules/` lên GitHub.**

## 6. Chạy app

Trong thư mục `discrete-local/`:

```bash
npm run dev
```

Vite sẽ khởi động local server.

Mở trình duyệt tại:

```text
http://localhost:5191/
```

Nếu terminal hiển thị một URL khác do cấu hình máy, hãy dùng URL mà Vite hiển thị.

Để dừng server:

```text
Ctrl + C
```

## 7. Mỗi lần học

Sau khi đã cài project rồi, thông thường chỉ cần:

```bash
cd Learning_Python/discrete-local
npm run dev
```

Sau đó mở:

```text
http://localhost:5191/
```

## 8. Cập nhật code mới từ GitHub

Nếu module được cập nhật trên GitHub:

```bash
cd Learning_Python
git pull
```

Sau đó:

```bash
cd discrete-local
npm install
npm run dev
```

Có thể không cần chạy `npm install` nếu `package.json` không thay đổi, nhưng chạy lại cũng an toàn.

### Nếu Git báo bạn có thay đổi local

Ví dụ:

```text
Your local changes would be overwritten by merge
```

**Không dùng `git reset --hard` một cách mù quáng.**

Chạy:

```bash
git status
```

để xem file nào đang bị thay đổi trước.

## 9. Tôi muốn sửa code thì làm thế nào?

Không cần fork nếu bạn có quyền push vào repo.

Quy trình cơ bản:

```bash
cd Learning_Python

git pull

# sửa code...

git status

git add .

git commit -m "describe what you changed"

git push
```

Ví dụ:

```bash
git add discrete-local/src/logic/ch1-quiz.js
git commit -m "fix chapter 1 quiz"
git push
```

## 10. Nếu bạn không có quyền push

Có hai lựa chọn:

### Cách A — chỉ sửa local

Bạn có thể sửa code và chạy app bình thường. Không cần push.

### Cách B — Fork

Fork nghĩa là tạo một bản sao repository dưới tài khoản GitHub của bạn.

Quy trình:

```text
huybndc/Learning_Python
        ↓ Fork
your-account/Learning_Python
        ↓ clone
máy của bạn
        ↓ sửa code
commit + push
        ↓
your-account/Learning_Python
```

Sau đó có thể tạo Pull Request nếu muốn gửi thay đổi trở lại repository gốc.

**Nếu mục tiêu chỉ là học local, không cần fork.**

## 11. Pull và Push khác nhau thế nào?

Nhớ đơn giản:

```text
GitHub → máy tính = pull
máy tính → GitHub = push
```

Ví dụ:

```bash
git pull
```

= lấy code mới từ GitHub.

```bash
git push
```

= gửi commit của bạn lên GitHub.

## 12. Commit là gì?

Commit là một mốc lưu thay đổi trong Git.

Ví dụ:

```bash
git add .
git commit -m "update discrete math chapter 3"
```

Sau đó:

```bash
git push
```

Commit **chưa có nghĩa là đã đưa code lên GitHub**. Nó chỉ lưu thay đổi vào lịch sử Git local. Muốn đưa lên GitHub thì cần `git push`.

## 13. Khi gặp lỗi

### Lỗi: `command not found: git`

Git chưa được cài hoặc chưa có trong PATH.

### Lỗi: `command not found: node`

Node.js chưa được cài hoặc chưa có trong PATH.

### Lỗi: `npm install` thất bại

Kiểm tra:

```bash
node --version
npm --version
```

Sau đó thử lại:

```bash
npm install
```

### Lỗi port 5191 đang được sử dụng

Có thể một instance Vite khác đang chạy.

Tìm terminal đang chạy app và nhấn:

```text
Ctrl + C
```

Sau đó chạy lại:

```bash
npm run dev
```

### Trang không mở

Kiểm tra terminal. Vite phải đang chạy.

Thử trực tiếp:

```text
http://localhost:5191/
```

## 14. Build production

Nếu muốn kiểm tra bản production:

```bash
cd Learning_Python/discrete-local
npm run build
```

Sau đó:

```bash
npm run preview
```

## 15. Kiến trúc module

```text
discrete-local/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── content/       # theory và question data
│   ├── i18n/          # English / Vietnamese
│   ├── logic/         # thuật toán và quiz logic
│   ├── pages/         # các chapter pages
│   ├── ui/            # giao diện và tools
│   └── main.js
└── shared/
    ├── i18n/
    ├── logic/
    ├── style/
    ├── ui/
    └── vite plugins
```

## 16. Phạm vi của module

Module này được thiết kế để:

- học lý thuyết;
- ôn tập;
- làm quiz;
- luyện các concept;
- sử dụng các công cụ Discrete Math;
- theo dõi tiến độ học local.

Module **không phải** một phần runtime của Study_Hub.

Không cần:

- chạy Study_Hub;
- chạy server backend của Study_Hub;
- Supabase;
- các module Linear Algebra;
- các module Logic Circuit;
- các module môn học khác.

## 17. Dữ liệu học tập

Trạng thái học local của app được lưu theo cơ chế local của trình duyệt.

Điều này có nghĩa:

- dữ liệu không tự động đồng bộ sang Study_Hub;
- dữ liệu không tự động đồng bộ giữa các máy;
- xóa dữ liệu website/local storage có thể làm mất tiến độ local.

Nếu cần chuyển tiến độ giữa các máy, hãy dùng chức năng export/import của app nếu phiên bản hiện tại cung cấp chức năng đó.

## 18. Quy tắc làm việc với AI

Nếu bạn đưa repository này cho AI coding assistant, hãy nói rõ:

> Đây là một module Discrete Mathematics standalone nằm trong `discrete-local/`.
> Không kết nối module này với Study_Hub hoặc các môn khác.
> Không tự ý thêm Supabase/cloud sync.
> Trước khi sửa code, đọc `discrete-local/README.md`, `package.json` và cấu trúc `src/`.
> Giữ app chạy được bằng `npm run dev` tại port 5191.
> Khi thay đổi kiến trúc, phải giải thích dependency và ảnh hưởng trước khi thực hiện.

## 19. Quy trình ngắn nhất

Nếu máy đã cài Git + Node.js:

```bash
git clone https://github.com/huybndc/Learning_Python.git
cd Learning_Python/discrete-local
npm install
npm run dev
```

Mở:

```text
http://localhost:5191/
```

Lần sau:

```bash
cd Learning_Python
git pull
cd discrete-local
npm run dev
```
