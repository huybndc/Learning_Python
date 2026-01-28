from collections import defaultdict
import logging

# Tôi đang không biết là dùng cái exception và các mức level logging đúng chưa
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s - %(levelname)s - %(message)s')

# Tiêu đề - tôi mới học đến chapter dict, chưa học chia file nên tạm thời để code trong 1 file duy nhất
logging.debug('Dự án quản lý lớp học - Start')

# Mỗi học sinh là một dict điểm, tự tạo dict khi học sinh chưa tồn tại
# Chỉ giới hạn ở 5 học sinh, để dễ kiểm tra
students = defaultdict(dict)
MAX = 5

# Thêm học sinh, đồng thời tạo dict rỗng cho hs
def add_student():
    if len(students) >= MAX:
         logging.error('Danh sách đã đầy!')
         return
    
    else:
        name = input('Nhập tên học sinh: ')
        # Ngăn chặn người dùng nhập tên quá dài, hoặc bị trùng
        if len(name) > 20:
            logging.warning('Tên quá dài, khả năng nhập sai.')
            return
        else:
            for k in students:
                if name == k:
                    logging.warning('Học sinh đã có sẵn, kiểm tra lại!')
                    return
                
            else:
                # Tạo dict cho name tạo sẵn key 'điểm trung bình' để phục vụ nhiều chức năng có thể mở rộng
                students[name] = {'ĐTB' : 0} 
    return logging.debug(f'Thêm thành công học sinh {name}!')

# Hiện tại chỉ giới hạn ở (Toán, Lý, Hoá, Anh, Văn)
def add_score():
    # Thay vì để trong vòng lặp thì thiết lập ngay từ đầu luôn
    SUBJECTS = ('Toán', 'Lý', 'Hoá', 'Anh', 'Văn')

    name = input('Nhập tên học sinh: ')

    if name not in students:
            logging.warning('Không có học sinh này trong hệ thống!')
            return
    
    else:
        # Vào vòng lặp để thêm điểm, và tính tb
        while True:
            # Hạn chế: viết HOA, viết thường chưa được linh hoạt
            subj = input(f'Nhập môn ({", ".join(SUBJECTS)} hoặc quit): ')

            # Tạo lối thoát, cho mọi phần có 'quit'
            if subj.lower() == 'quit':
                break
                
            elif subj not in SUBJECTS:
                print('Lỗi: Môn học không hợp lệ.\n')
                continue

            # Đoạn này dùng Gemini để tính score vào count chuẩn hơn
            # Bản cũ bị đặt lại bộ đếm (local variables)
            try:
                score = float(input(f'Nhập điểm môn {subj}: '))
                # Không biết có cách so sánh này, trước cứ phải tách ra dùng and
                if 0 <= score <= 10:
                # Ghi đè hoặc thêm mới điểm môn đó vào dictionary của HS
                    students[name][subj] = score
                    print(f"Đã cập nhật điểm môn {subj}.")
                else:
                    print('Lỗi: Điểm phải từ 0-10.')
            except ValueError:
                print('Lỗi: Vui lòng nhập số thực.')

    # Lọc ra những môn học hiện có điểm
    all_current_scores = [students[name][s] for s in SUBJECTS if s in students[name]]
    total_count = len(all_current_scores)

    if total_count == 0:
        students[name]['ĐTB'] = 0
        students[name]['Band'] = 'Chưa có điểm'
        return
    
    # Tính ĐTB chuẩn - nên tách ra 2 hàm nhỏ là hàm tính tb và xếp loại
    # Toàn quên mất là có hàm sum()
    avg = sum(all_current_scores) / total_count
    students[name]['ĐTB'] = round(avg, 2) # Làm tròn 2 chữ số

    # Xếp loại (Band)
    # Tạo danh sách môn liệt (<4d)
    weak_subj = [s for s in SUBJECTS if s in students[name] and students[name][s] < 4 ]
    if total_count >= 3:
        # Hạn chế do học sinh bị điểm liệt
        if avg >= 8 and len(weak_subj) > 0:
            #lỗi typo "bang"
            band = 'Khá'
        elif avg >= 8:
            band = 'Giỏi'
        elif avg >= 6.5: # Rút gọn logic: nếu không >=8 thì check >=6.5
            band = 'Khá'
        else:
            band = 'Trung bình'
    else:
        band = 'Chưa xếp hạng (Cần tối thiểu 3 môn)'
        
    students[name]['Band'] = band

    print("-" * 20)
    print(f"Học sinh: {name}")
    print(f"Số môn hiện có: {total_count}")
    if len (weak_subj) > 0:
        print(f'Học sinh có ({len(weak_subj)}) môn bị liệt : {weak_subj}')
    print(f"ĐTB: {students[name]['ĐTB']}")
    print(f"Xếp loại: {band}")

def all_info():

    logging.debug(f'Số học sinh hiện tại là: {len(students)}')

    if len(students) == 0:
        logging.warning('Lỗi: Danh sách trống!\n') 
        return
    
    else:
        while True:

            print('1.Chỉ in tên\n2.In đầy đủ thông tin\n0.Quit')
            choice = input('Lựa chọn: ')

            if choice not in '12':
                print('Lỗi: Phải trong khoảng 0-2, vui lòng chọn lại.')

            if choice == '0':
                break
            if choice == '1':
                print('-' * 20)
                for i, k in enumerate(students, 1):
                    print(f'{i}. Học sinh {k}')
                return
            
            if choice == '2':
                #Cách này lấy từ Gemini, trông gọn phết
                print(f"{'STT':<5} {'Họ Tên':<15} {'ĐTB':<10} {'Xếp loại'}")
                print('-' * 45)
    
                for i, (name, data) in enumerate(students.items(), 1):
                    # Lấy ĐTB và Band, nếu chưa có thì để "N/A"
                    dtb = data.get('ĐTB', 'N/A')
                    band = data.get('Band', 'N/A')
        
                    # In theo cột cho thẳng hàng
                    print(f"{i:<5} {name:<15} {dtb:<10} {band}")
            return

#Hàm này hiện tại chưa có nhiều tác dụng lắm, nhưng nếu tăng MAX thì chắc ok
def check_student():
    if len(students) == 0:
        logging.warning('Lỗi: Danh sách trống!')
        return
    
    name = input('Nhập tên học sinh: ')
    if name not in students:
        logging.warning ('Lỗi: Không có tên học sinh này!')
        return
    else:
        data = students[name]
        print('-' * 20)
        print(f'Học sinh: {name}')
        print(f'ĐTB: {data.get("ĐTB", "N/A")}')
        print(f'Xếp loại: {data.get("Band", "N/A")}')

        # In các môn học
        for k, v in data.items():
            if k not in ('ĐTB', 'Band'):
                print(f'{k}: {v}')

def del_student():
    logging.debug(f'Số học sinh hiện tại là: {len(students)}')

    if len(students) == 0:
        logging.warning('Lỗi: Danh sách trống!')
        return
    
    print('-' * 20)
    for i, k in enumerate(students, 1):
        print(f'{i}. Học sinh {k}')
    
    name = input('Nhập tên học sinh cần xoá: ')
    if name not in students:
        logging.warning ('Lỗi: Không có tên học sinh này!')
        return
    
    else:
        del students[name]
        logging.debug(f'Xoá thông tin về học sinh {name} thành công.')
        return
    
    
    
# Bắt đầu vào main
while True:
    print ('-' * 36)
    print('1. Thêm tên\n2. Thêm (Thay đổi) điểm\n3. In thông tin\n4. Kiểm tra học sinh\n5. Xoá tên\n0. Thoát''')

    choice = input('Lựa chọn: ')
    logging.debug(f'Option của người dùng: {choice}')
    
    if choice not in '12345':
        print('Lỗi: Phải trong khoảng 0-5, vui lòng chọn lại.')

    #Exit sign
    if  choice == '0':
        break

    if choice == '1':
        add_student()

    if choice == '2':
        add_score()

    if choice == '3':
        all_info()
    
    if choice == '4':
        check_student()
    
    if choice == '5':
        del_student()

logging.debug('Chương trình kết thúc - Over')