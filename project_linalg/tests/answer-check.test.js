import { describe, it, expect } from 'vitest';
import { parseNumber, parseNumbers, checkNumber, checkVector, checkChoice, checkAnswer } from '../src/logic/answer-check.js';

describe('parseNumber', () => {
  it('số thường và số âm', () => {
    expect(parseNumber('3')).toBe(3);
    expect(parseNumber(' -1.5 ')).toBe(-1.5);
    expect(parseNumber('+2')).toBe(2);
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('phân số và dấu trừ Unicode', () => {
    expect(parseNumber('3/4')).toBe(0.75);
    expect(parseNumber('-2/3')).toBeCloseTo(-2 / 3, 12);
    expect(parseNumber('−5')).toBe(-5);
    expect(parseNumber('1/0')).toBe(null);
  });

  it('không phải số thì trả null', () => {
    expect(parseNumber('abc')).toBe(null);
    expect(parseNumber('')).toBe(null);
    expect(parseNumber('3x')).toBe(null);
    expect(parseNumber('1e3')).toBe(null);
  });
});

describe('parseNumbers — cách viết nào cũng nhận', () => {
  it('các kiểu ngăn cách đều ra cùng kết quả', () => {
    for (const s of ['3, -2', '(3, -2)', '[3; -2]', '3 -2', '  3 , -2  ', '3,-2']) {
      expect(parseNumbers(s), s).toEqual([3, -2]);
    }
  });

  it('vector ba chiều', () => {
    expect(parseNumbers('1, 2, 3')).toEqual([1, 2, 3]);
    expect(parseNumbers('(1 2 3)')).toEqual([1, 2, 3]);
  });

  it('một số cũng là danh sách một phần tử', () => {
    expect(parseNumbers('11')).toEqual([11]);
    expect(parseNumbers('-0.5')).toEqual([-0.5]);
  });

  it('có mẩu không phải số thì trả null', () => {
    expect(parseNumbers('3, x')).toBe(null);
    expect(parseNumbers('')).toBe(null);
    expect(parseNumbers('   ')).toBe(null);
  });
});

describe('chấm số', () => {
  it('đúng trong sai số thì nhận', () => {
    expect(checkNumber('11', 11)).toBe(true);
    expect(checkNumber('2.24', 2.236, 0.011)).toBe(true);
    expect(checkNumber('2.2', 2.236, 0.011)).toBe(false);
    expect(checkNumber('63.4', 63.43, 0.11)).toBe(true);
  });

  it('trả lời bằng vector cho câu hỏi số thì sai', () => {
    expect(checkNumber('1, 2', 11)).toBe(false);
  });
});

describe('chấm vector', () => {
  it('đúng từng toạ độ', () => {
    expect(checkVector('(4, 20)', [4, 20])).toBe(true);
    expect(checkVector('4 20', [4, 20])).toBe(true);
    expect(checkVector('4, 21', [4, 20])).toBe(false);
  });

  it('sai số chiều thì sai', () => {
    expect(checkVector('4, 20, 0', [4, 20])).toBe(false);
    expect(checkVector('4', [4, 20])).toBe(false);
  });

  it('chấp nhận phân số trong toạ độ', () => {
    expect(checkVector('3/2, -1/2', [1.5, -0.5])).toBe(true);
  });
});

describe('chấm lựa chọn và chấm tự động theo dạng đáp án', () => {
  it('bỏ qua hoa thường và khoảng trắng', () => {
    expect(checkChoice(' Unique ', 'unique')).toBe(true);
    expect(checkChoice('vo  nghiem', 'vo nghiem')).toBe(true);
    expect(checkChoice('none', 'unique')).toBe(false);
  });

  it('checkAnswer tự chọn cách chấm', () => {
    expect(checkAnswer('4, 20', [4, 20])).toBe(true);
    expect(checkAnswer('11', 11)).toBe(true);
    expect(checkAnswer('unique', 'unique')).toBe(true);
    expect(checkAnswer('4, 20', 11)).toBe(false);
  });
});
