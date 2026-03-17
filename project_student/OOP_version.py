import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.debug('Dự án quản lý lớp học - Bắt đầu')

# Giới hạn cứng số sinh viên — đặt là hằng số toàn cục để dễ thay đổi sau này
# mà không cần sửa bên trong từng method
MAX = 5

# Dùng tuple thay vì list vì danh sách môn học không nên bị thay đổi trong runtime
# Đặt toàn cục để tất cả method đều dùng chung một nguồn duy nhất
SUBJECTS = ('Math', 'Physics', 'Chemistry', 'English', 'Literature')

# Gộp SUBJECTS với Average và Rank để tạo template cho dict điểm của sinh viên
# Tách riêng thay vì hardcode trong Student.__init__ để nếu thêm môn sau này
# chỉ cần sửa SUBJECTS, không cần đụng vào class
STUDENT_SCORE = SUBJECTS + ('Average', 'Rank')


class Student:
    # Student chỉ chịu trách nhiệm lưu trữ thông tin của chính nó
    # Không tự tạo ID, không biết mình đang ở trong danh sách nào
    # — đó là trách nhiệm của Manager (Single Responsibility)
    def __init__(self, name: str, ID: int) -> None:
        self.name = name
        self.ID = ID
        # Dùng fromkeys() để tạo dict từ template STUDENT_SCORE
        # Tất cả giá trị khởi tạo là None — phân biệt "chưa nhập" với điểm 0
        self.scores = {}.fromkeys(STUDENT_SCORE, None)


class Manager:
    # Manager là class duy nhất được phép tạo và xoá Student object
    # Giữ toàn bộ trạng thái của hệ thống: danh sách sinh viên, số lượng, ID tiếp theo
    def __init__(self) -> None:
        self.students = []       # list các Student object — không dùng dict vì ID đã nằm trong object
        self.student_count = 0   # phản ánh số sinh viên thực tế hiện tại, tăng/giảm theo thêm/xoá
        self.next_ID = 1         # tách riêng khỏi student_count để tránh trùng ID sau khi xoá
                                 # next_ID chỉ tăng, không bao giờ giảm


    def add_student(self) -> None:
        # Dùng student_count thay vì len(self.students) để nhất quán với delete_student
        if self.student_count >= MAX:
            logging.error('Danh sách sinh viên đã đầy!')
            return

        name = input('Nhập tên sinh viên: ')

        # Chặn tên quá dài trước khi tạo object — tránh lưu dữ liệu rác vào hệ thống
        if len(name) > 20:
            logging.warning('Tên quá dài, có thể nhập sai.')
            return

        # Duyệt toàn bộ list để kiểm tra trùng tên — O(n) chấp nhận được vì MAX nhỏ
        for student in self.students:
            if name == student.name:
                logging.warning('Sinh viên đã tồn tại. Vui lòng kiểm tra lại.')
                return

        # Cấp ID cho sinh viên mới từ next_ID thay vì tự tính trong Student
        # để Manager kiểm soát hoàn toàn việc cấp phát ID
        ID = self.next_ID
        new_student = Student(name, ID)
        self.students.append(new_student)
        self.student_count += 1
        self.next_ID += 1

        logging.debug(f'Sinh viên {name}, ID: {ID} đã được thêm thành công!')


    def avg_and_ranking(self, student: Student) -> None:
        # Nhận trực tiếp Student object thay vì tên — tránh phải tìm lại trong list
        # Chỉ lấy điểm của môn đã nhập (khác None) để tính trung bình chính xác
        current_scores = [
            student.scores[subject]
            for subject in SUBJECTS
            if subject in student.scores and student.scores[subject] is not None
        ]
        total_subjects = len(current_scores)

        if total_subjects == 0:
            student.scores['Average'] = 0
            student.scores['Rank'] = 'Chưa có điểm'
            return

        avg = sum(current_scores) / total_subjects
        student.scores['Average'] = round(avg, 2)

        # Phải check is not None TRƯỚC khi so sánh < 4
        # vì Python không so sánh được None với int — sẽ raise TypeError
        weak_subjects = [
            subject
            for subject in SUBJECTS
            if subject in student.scores
            and student.scores[subject] is not None
            and student.scores[subject] < 4
        ]

        # Cần ít nhất 3 môn để xếp loại có ý nghĩa
        if total_subjects >= 3:
            if avg >= 8:
                # Có môn yếu thì bị hạ xuống Khá dù điểm trung bình đạt Giỏi
                rank = 'Giỏi' if len(weak_subjects) == 0 else 'Khá (Có môn yếu)'
            elif avg >= 6.5:
                rank = 'Khá'
            else:
                rank = 'Trung bình'
        else:
            rank = 'Chưa xếp loại (Cần ít nhất 3 môn)'

        student.scores['Rank'] = rank

        print("-" * 20)
        print(f"Sinh viên: {student.name}")
        print(f"Số môn học: {total_subjects}")
        if len(weak_subjects) > 0:
            print(f"Môn yếu ({len(weak_subjects)}): {weak_subjects}")
        print(f"Điểm trung bình: {student.scores['Average']}")
        print(f"Xếp loại: {rank}")


    def add_score(self) -> None:
        global SUBJECTS

        name = input('Nhập tên sinh viên: ')

        # Tìm Student object trong list thay vì dùng dict lookup
        # vì self.students là list — phải duyệt O(n)
        target = None
        for student in self.students:
            if student.name == name:
                target = student
                break

        if target is None:
            logging.warning('Không tìm thấy sinh viên!')
            return

        while True:
            # capitalize() để chấp nhận cả 'math', 'MATH', 'Math' từ người dùng
            # thay vì bắt buộc nhập đúng định dạng
            subject = input(f'Nhập môn học ({", ".join(SUBJECTS)} hoặc quit): ').strip().capitalize()

            if subject.lower().strip() == 'quit':
                break
            elif subject not in SUBJECTS:
                print('Lỗi: Môn học không hợp lệ.\n')
                continue

            try:
                score = float(input(f'Nhập điểm cho môn {subject}: '))
                if 0 <= score <= 10:
                    # Ghi đè nếu môn đã có điểm — cho phép cập nhật điểm
                    target.scores[subject] = score
                    print(f"Điểm môn {subject} đã được cập nhật.")
                else:
                    print('Lỗi: Điểm phải nằm trong khoảng 0 đến 10.')
            except ValueError:
                print('Lỗi: Vui lòng nhập một số hợp lệ.')

        # Tính lại sau mỗi lần nhập điểm để Average và Rank luôn phản ánh dữ liệu mới nhất
        self.avg_and_ranking(target)


    def all_info(self) -> None:
        logging.debug(f'Số sinh viên hiện tại: {self.student_count}')

        if self.student_count == 0:
            logging.warning('Lỗi: Danh sách sinh viên trống!\n')
            return

        while True:
            print('1. In tên sinh viên\n2. In thông tin đầy đủ\n0. Thoát')
            choice = input('Lựa chọn: ')

            if choice not in '12':
                print('Lỗi: Vui lòng chọn từ 0-2.')

            if choice == '0':
                break

            if choice == '1':
                print('-' * 20)
                for index, student in enumerate(self.students, 1):
                    print(f'{index}. Sinh viên {student.name} - ID: {student.ID}')
                return

            if choice == '2':
                # Dùng f-string với căn lề để bảng dễ đọc hơn
                print(f"{'STT':<5} {'Tên':<15} {'Điểm TB':<10} {'Xếp loại'}")
                print('-' * 45)

                for index, student in enumerate(self.students, 1):
                    avg = student.scores['Average']
                    rank = student.scores['Rank']
                    print(f"{index:<5} {student.name:<15} {avg:<10} {rank}")
            return


    def check_student(self) -> None:
        if self.student_count == 0:
            logging.warning('Lỗi: Danh sách sinh viên trống!')
            return

        name = input('Nhập tên sinh viên: ')

        # for...else: else chỉ chạy khi vòng lặp kết thúc tự nhiên (không gặp break)
        # — tức là không tìm thấy sinh viên nào khớp tên
        for student in self.students:
            if name == student.name:
                target = student
                break
        else:
            logging.warning('Lỗi: Không tìm thấy sinh viên!')
            return

        print('-' * 20)
        print(f'Sinh viên: {target.name}')
        print(f'Điểm trung bình: {target.scores["Average"]}')
        print(f'Xếp loại: {target.scores["Rank"]}')

        # Bỏ qua Average và Rank khi in điểm từng môn
        # vì 2 key này không phải môn học, chỉ là kết quả tính toán
        for subject, score in target.scores.items():
            if subject not in ('Average', 'Rank'):
                print(f'{subject}: {score}')


    def delete_student(self) -> None:
        logging.debug(f'Số sinh viên hiện tại: {self.student_count}')

        if self.student_count == 0:
            logging.warning('Lỗi: Danh sách sinh viên trống!')
            return

        print('-' * 20)
        for index, student in enumerate(self.students, 1):
            print(f'{index}. Sinh viên {student.name} - ID: {student.ID}')

        name = input('Nhập tên sinh viên cần xoá: ')

        for student in self.students:
            if name == student.name:
                target = student
                break
        else:
            logging.warning('Lỗi: Không tìm thấy sinh viên!')
            return

        # list.remove() xoá phần tử đầu tiên khớp với object được truyền vào
        self.students.remove(target)
        self.student_count -= 1
        # Không giảm next_ID — để đảm bảo ID không bao giờ bị tái sử dụng
        logging.debug(f'Sinh viên {name} đã được xóa thành công.')