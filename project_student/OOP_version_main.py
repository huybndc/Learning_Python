from OOP_version import Manager

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

manager = Manager()

while True:
    print('-' * 36)
    print('1. Thêm sinh viên\n2. Thêm/Cập nhật điểm\n3. In thông tin\n4. Kiểm tra sinh viên\n5. Xóa sinh viên\n0. Thoát')

    choice = input('Lựa chọn: ')

    if choice not in ['1', '2', '3', '4', '5', '0']:
        print('Lỗi: Vui lòng chọn từ 0-5.')

    if choice == '0':
        break
    if choice == '1':
        manager.add_student()
    if choice == '2':
        manager.add_score()
    if choice == '3':
        manager.all_info()
    if choice == '4':
        manager.check_student()
    if choice == '5':
        manager.delete_student()

logging.debug('Chương trình kết thúc - Hoàn tất')