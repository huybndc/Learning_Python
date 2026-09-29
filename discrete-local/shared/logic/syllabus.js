/* ---------------------------------------------------------------
   LỊCH HỌC KỲ (CAU, học kỳ 2 năm 2026). Tuần 1 bắt đầu thứ Ba 01/09/2026 (Huy xác nhận), mỗi tuần 7 ngày
   tính từ ngày đó. Chủ đề từng tuần chép TÊN theo syllabus, chỉ dùng làm trọng số độ dài chương (chapterWeeks):
   giảng viên dạy khác thứ tự syllabus nên app KHÔNG suy "đang học chương nào" từ đây — xem studiedChapters (D43).
   --------------------------------------------------------------- */

export const SEMESTER_START = '2026-09-01';
export const WEEKS = 16;
export const EXAM_WEEKS = { 8: 'mid', 16: 'final' };

/** Tuần học (1…16) của một ngày; trước học kỳ = 0, sau = 17. */
export function weekOf(date, start = SEMESTER_START) {
  const days = Math.floor((new Date(date) - new Date(start + 'T00:00:00')) / 86400000);
  if (days < 0) return 0;
  return Math.min(WEEKS + 1, Math.floor(days / 7) + 1);
}

/** Chủ đề theo tuần: [tên, ...chương của app học tuần đó]; `chapters` = các chương app đã có. */
export const SUBJECTS = [
  {
    id: 'logic', name: 'Logic Circuit', book: 'Digital Design (Mano, 6th ed.)',
    chapters: ['ch1', 'ch2', 'ch3', 'ch4'],
    weeks: {
      2: ['Ch1 Hệ đếm & mã · Ch2 Đại số Boolean', 'ch1'], 3: ['Ch2 Đại số Boolean & cổng', 'ch2'],
      4: ['Ch3 Rút gọn cấp cổng', 'ch3'], 5: ['Ch3 Rút gọn cấp cổng', 'ch3'],
      6: ['Ch4 Mạch tổ hợp', 'ch4'], 7: ['Ch4 Mạch tổ hợp', 'ch4'], 9: ['Ch5 Mạch tuần tự đồng bộ'],
      10: ['Ch5 Mạch tuần tự đồng bộ'], 11: ['Ch5 Mạch tuần tự đồng bộ'], 12: ['Ch6 Thanh ghi & bộ đếm'],
      13: ['Ch6 Thanh ghi & bộ đếm'], 14: ['Ch7 Bộ nhớ & logic lập trình được'], 15: ['Ch7 Bộ nhớ & logic lập trình được'],
    },
  },
  {
    id: 'linalg', name: 'Linear Algebra', book: 'Introduction to Linear Algebra (Strang, 4th ed.)',
    chapters: ['ch1', 'ch2', 'ch3'],
    weeks: {
      2: ['1.1–1.3 Vector', 'ch1'], 3: ['2.1–2.3 Khử Gauss', 'ch2'], 4: ['2.4–2.7 Phép toán ma trận, nghịch đảo, A = LU'],
      5: ['3.1–3.2 Không gian con, N(A)', 'ch3'], 6: ['3.3–3.4 Hạng, nghiệm đầy đủ', 'ch3'],
      7: ['3.5–3.6 Cơ sở, bốn không gian con', 'ch3'], 9: ['4.1–4.2 Trực giao, hình chiếu'],
      10: ['4.3–4.4 Bình phương tối thiểu, Gram–Schmidt'], 11: ['5.1–5.3 Định thức'],
      12: ['6.1–6.2 Trị riêng, chéo hoá'], 13: ['6.3–6.4 Phương trình vi phân, ma trận đối xứng'], 14: ['6.5–6.6 Ma trận xác định dương, đồng dạng'], 15: ['6.7 SVD'],
    },
  },
  {
    id: 'discrete', name: 'Discrete Math', book: 'Mathematics for Computer Science (MIT 6.042J)',
    chapters: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8'],
    weeks: {
      2: ['Mệnh đề & chứng minh', 'ch1'], 3: ['Lượng từ, chứng minh · tập hợp & hàm', 'ch2', 'ch3'], 4: ['Quy nạp', 'ch4'],
      5: ['Bất biến & quy nạp mạnh', 'ch5'], 6: ['Số học', 'ch6'], 7: ['Số học & mật mã (RSA)', 'ch7'], 9: ['Đồ thị', 'ch8'],
      10: ['Bài toán ghép cặp'], 11: ['Cây khung nhỏ nhất'], 12: ['Mạng truyền thông'],
      13: ['Quan hệ, thứ tự bộ phận, lập lịch'], 14: ['Tổng & tiệm cận'],
    },
  },
];

/** Ngày bắt đầu một tuần học (cùng thứ với SEMESTER_START). */
export function weekStart(week, start = SEMESTER_START) {
  const d = new Date(start + 'T00:00:00');
  d.setDate(d.getDate() + (week - 1) * 7);
  return d;
}

/** Số ngày từ `date` tới đầu tuần thi giữa kỳ (âm = đã qua). */
export function daysToMidterm(date, start = SEMESTER_START) {
  const mid = Number(Object.keys(EXAM_WEEKS).find(w => EXAM_WEEKS[w] === 'mid'));
  const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
  return Math.round((weekStart(mid, start) - d0) / 86400000);
}

/** Số tuần học của mỗi chương (theo syllabus) — trọng số chia thời gian trong bài full. */
export function chapterWeeks(subjectId) {
  const out = {};
  for (const [, ...chs] of Object.values(SUBJECTS.find(x => x.id === subjectId)?.weeks ?? {})) for (const ch of chs) out[ch] = (out[ch] ?? 0) + 1;
  return out;
}
