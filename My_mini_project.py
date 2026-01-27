"""[START]
   │
   ▼
[1. Khởi tạo & Cài đặt]
   │ - Tạo list rỗng
   │ - MAX = 20 (hoặc tùy chỉnh)
   │ - Các biến trạng thái (level, log, warning)
   │
   ▼
[2. Menu chính (UX/UI)]
   │ - Hiển thị menu
   │ - Nhận lựa chọn người dùng (1-6, 0)
   │ - Xử lý input sai → Warning/Error
   │
   ▼
[3. Các chức năng chính (Core Logic)]
   ├── 3.1 Thêm phần tử (Add)
   │   ├── Kiểm tra MAX (vượt → Error)
   │   ├── Kiểm tra trùng tên (trùng → Warning)
   │   └── Append → Success + log
   │
   ├── 3.2 Xóa phần tử (Remove)
   │   ├── Hiển thị list có số thứ tự
   │   ├── Nhập STT → kiểm tra hợp lệ
   │   └── Xóa + shift list → Success + log
   │
   ├── 3.3 Tìm kiếm (Search)
   │   ├── Nhập từ khóa
   │   ├── Duyệt list → tìm theo tên
   │   └── In kết quả (có/không) + info
   │
   ├── 3.4 Sửa thông tin (Edit)
   │   ├── Hiển thị list có STT
   │   ├── Nhập STT + thông tin mới
   │   └── Cập nhật → Success + log
   │
   ├── 3.5 In danh sách (List / Info)
   │   ├── In đầy đủ (STT + chi tiết)
   │   └── In ngắn gọn (chỉ tên)
   │
   └── 3.6 Error & Logging
          ├── Error: vượt MAX, trùng, input rỗng, STT sai
          ├── Warning: gần đầy list, tên dài quá
          └── Log: level (INFO, WARNING, ERROR), formatted output
   │
   ▼
[4. Kết thúc (Exit)]
   │ - Nhập 0 → thoát
   │ - In lời chào tạm biệt"""
#Tôi sẽ chạy theo logic theo sơ đồ bên trên, bài này bước 1 là tự làm 100%, à trừ vẽ =)))
#Cố gắng tự làm tất cả công đoạn nhiều nhất có thể, chủ yếu hỏi AI về syntax là chính

from collections import defaultdict
import logging

#Tôi đang không biết là dùng cái exception và các mức level logging đúng chưa
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(levelname)s - %(message)s')

#Tiêu đề - tôi mới học đến chapter dict, chưa học chia file nên tạm thời để code trong 1 file duy nhất
logging.debug('Dự án quản lý lớp học - Start')

#Mỗi học sinh là một dict điểm, tự tạo dict khi học sinh chưa tồn tại
#Chỉ giới hạn ở 5 học sinh, để dễ kiểm tra
students = defaultdict(dict)
MAX = 5

#Thêm học sinh, đồng thời tạo dict rỗng cho hs
def add_student():
    #Hiện tại MAX chỉ được dùng duy nhất ở đây, nếu mai sau nâng cấp cách dùng thì tốt
    if len(students) >= MAX:
        return logging.error('Danh sách đã đầy!')
    
    else:
        name = input('Nhập tên học sinh: ')
        #Ngăn chặn người dùng nhập tên quá dài, hoặc bị trùng
        if len(name) > 20:
            return logging.warning('Tên quá dài, khả năng nhập sai.')
        else:
            for k in students:
                if name == k:
                    return logging.warning('Học sinh đã có sẵn, kiểm tra lại!')
                
            else:
                #Tạo dict cho name tạo sẵn key 'điểm trung bình' để phục vụ nhiều chức năng có thể mở rộng
                students[name] = {'ĐTB' : 0} 
    return logging.debug(f'Thêm thành công học sinh {name}!')

#Hiện tại chỉ giới hạn ở (Toán, Lý, Hoá, Anh, Văn)
def add_score():
    #Hiện tại sum chỉ phục vụ 1 mục đích duy nhất là để tính điểm trung bình
    #count hiện tại cũng vậy, nhưng tôi chắc sẽ làm thêm biến nữa để xếp hạng hs
    #Theo giỏi - khá - tb, và nếu mở rộng thì xếp hạng theo nhiều lớp trong cùng khối
    sum = 0
    count = 0

    name = input('Nhập tên học sinh: ')
    #Cover các lỗi có thể xảy ra trong phần này
    if name not in students:
            return logging.warning('Không có học sinh này trong hệ thống!')
    
    else:
        #Vào vòng lặp để thêm điểm, và tính tb
        while True:
            #Hạn chế viết HOA, viết thường chưa được linh hoạt
            SUBJECTS = ('Toán', 'Lý', 'Hoá', 'Anh', 'Văn')
            subj = input('Điểm môn học (Toán, Lý, Hoá, Anh, Văn hoặc quit): ')

            #Tạo lối thoát, cho mọi phần có 'quit'
            if subj == 'quit':
                logging.debug('Thoát module thêm điểm.\n')
                break
                
            elif subj not in SUBJECTS:
                print('Lỗi: Vui lòng nhập lại.\n')

            else:

               #Hình như đoạn này nên dùng try-except
                try:
                    score = float(input(f'Nhập điểm môn {subj}: '))
                except ValueError:
                    print('Lỗi: Điểm phải là số!\n')
                    continue

                if score < 0 or score > 10:
                    print('Lỗi: Điểm phải nằm trong khoảng (0-10). Nhập lại.\n')

                else:
                    #Tránh ghi đề điểm
                    if subj not in students[name]: 
                        students[name][subj] = score
                        sum += score
                        count += 1

    #Tính điểm trung bình và cover lỗi
    #Nên mở rộng chức năng với điểm trung bình
    logging.debug(f'Số môn đã thêm điểm là: {count}')
    if count == 0:
        logging.error('Lỗi: Chia cho 0')
    else:
        students[name]['ĐTB'] = float(sum / count)
    logging.debug(f'Điểm trung bình là: {students[name]['ĐTB']}')

    return logging.debug(f'Thêm điểm thành công cho học sinh {name}.')

#Đang làm đến phần này. Nhưng mà khi in ra thì chưa đẹp lắm
def all_info():
    
    if len(students) == 0:
        return logging.warning('Lỗi: Danh sách trống!\n')
    
    else:
        print('Danh sách học sinh:\n')
        for i, (k, v) in enumerate(students.items(), 1):
            print(f'{i}. {k}: {v}') 

#Bắt đầu vào main
#Làm UX/UI xíu cho đẹp
while True:
    print ('---------------------------------------------')
    print('1. Thêm tên\n2. Thêm điểm\n3. In thông tin\n4. Tìm kiếm học sinh\n5. Xoá tên\n6. Thay đổi điểm\n0. Thoát''')

    choice = input('Lựa chọn: ')
    logging.debug(f'Option của người dùng: {choice}')
    
    #Tôi hình như nghe nói làm dev thì ko đc tin input của người dùng à =))
    if choice not in '123456':
        print('Lỗi: Phải trong khoảng 0-6, vui lòng chọn lại.')

    #Exit sign
    if  choice == '0':
        break

    if choice == '1':
        add_student()

    if choice == '2':
        add_score()

    if choice == '3':
        all_info()

#Cuối cùng cũng xong phần thô rồi
logging.debug('Chương trình kết thúc - Over')
