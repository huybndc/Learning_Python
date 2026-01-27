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

from collections import defaultdict
import logging
#Set basicConfig
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(levelname)s - %(message)s')

#Starting title
logging.debug('Dự án quản lý lớp học - Start')

#Global variables
students = defaultdict(dict)
MAX = 5

#Func add student
def add_student():
    #Check: List is full
    if len(students) >= MAX:
        return logging.error('Danh sách đã đầy!')
    
    else:
        name = input('Nhập tên học sinh: ')
        #Check: Input error
        if len(name) > 20:
            return logging.warning('Tên quá dài, khả năng nhập sai.')
        #Check: Duplicated name
        else:
            for k in students:
                if name == k:
                    return logging.warning('Học sinh đã có sẵn, kiểm tra lại!')
                
            else:
                students[name] = {'ĐTB' : 0} 
    return logging.debug(f'Thêm thành công học sinh {name}!')

#Func add score (Toán, Lý, Anh)
def add_score():
    #Declare variables
    sum = 0
    count = 0

    name = input('Nhập tên học sinh: ')
    #Check: student in system
    if name not in students:
            return logging.warning('Không có học sinh này trong hệ thống!')
    
    else:
        #Check : ValueError and Score range
        while True:
            #Add score for each subject
            SUBJECTS = ('Toán', 'Lý', 'Hoá', 'Anh', 'Văn')
            subj = input('Điểm môn học (Toán, Lý, Hoá, Anh, Văn hoặc quit): ')

            #Exit sign
            if subj == 'quit':
                logging.debug('Thoát module thêm điểm.\n')
                break
                
            elif subj not in SUBJECTS:
                print('Lỗi: Vui lòng nhập lại.\n')

            else:

               #Cover error
                try:
                    score = float(input(f'Nhập điểm môn {subj}: '))
                except ValueError:
                    print('Lỗi: Điểm phải là số!\n')
                    continue

                if score < 0 or score > 10:
                    print('Lỗi: Điểm phải nằm trong khoảng (0-10). Nhập lại.\n')

                else:
                    #Assign score to student
                    if subj not in students[name]: 
                        students[name][subj] = score
                        sum += score
                        count += 1
    #Avarage score
    logging.debug(f'Số môn đã thêm điểm là: {count}')
    if count == 0:
        logging.error('Lỗi: Chia cho 0')
    else:
        students[name]['ĐTB'] = float(sum / count)
    logging.debug(f'Điểm trung bình là: {students[name]['ĐTB']}')

    return logging.debug(f'Thêm điểm thành công cho học sinh {name}.')

#Func all info
def all_info():
    #Empty list
    if len(students) == 0:
        return logging.warning('Lỗi: Danh sách trống!\n')
    
    else:
        print('Danh sách học sinh:\n')
        for i, (k, v) in enumerate(students.items(), 1):
            print(f'{i}. {k}: {v}') 

#Option menu
while True:
    print ('---------------------------------------------')
    print('1. Thêm tên\n2. Thêm điểm\n3. In thông tin\n4. Tìm kiếm học sinh\n5. Xoá tên\n6. Thay đổi điểm\n0. Thoát''')

    choice = input('Lựa chọn: ')
    logging.debug(f'Option của người dùng: {choice}')
    
    #Invalid choice
    if choice not in '123456':
        print('Lỗi: Phải trong khoảng 0-6, vui lòng chọn lại.')

    #Exit sign
    if  choice == '0':
        break

    #call (add student)
    if choice == '1':
        add_student()

    #call (add score)
    if choice == '2':
        add_score()

    #call (info)
    if choice == '3':
        all_info()

logging.debug('Chương trình kết thúc - Over')