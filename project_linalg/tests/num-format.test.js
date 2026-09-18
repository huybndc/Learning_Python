import { describe, it, expect } from 'vitest';
import { clean, near, toFraction, fmt, fmtCoef, fmtParen, fmtVec, signPart } from '../src/logic/num-format.js';

describe('clean', () => {
  it('gom về số nguyên khi đủ gần', () => {
    expect(clean(0.1 + 0.2 - 0.3)).toBe(0);
    expect(clean(2.0000000001)).toBe(2);
    expect(clean(-0)).toBe(0);
    expect(Object.is(clean(-0), 0)).toBe(true);
  });

  it('cắt bụi dấu phẩy động nhưng giữ giá trị thật', () => {
    expect(clean(0.6000000000000001)).toBe(0.6);
    expect(clean(0.30000000000000004)).toBe(0.3);
    expect(clean(1 / 3)).toBeCloseTo(0.3333333333, 9);
    expect(clean(2.5)).toBe(2.5);
  });
});

describe('near', () => {
  it('so sánh có sai số', () => {
    expect(near(1, 1 + 1e-12)).toBe(true);
    expect(near(1, 1.01)).toBe(false);
    expect(near(1, 1.01, 0.1)).toBe(true);
  });
});

describe('toFraction', () => {
  it('tìm được phân số đơn giản', () => {
    expect(toFraction(0.75)).toEqual({ num: 3, den: 4 });
    expect(toFraction(2 / 3)).toEqual({ num: 2, den: 3 });
    expect(toFraction(-1 / 6)).toEqual({ num: -1, den: 6 });
    expect(toFraction(3)).toEqual({ num: 3, den: 1 });
    expect(toFraction(0)).toEqual({ num: 0, den: 1 });
  });

  it('trả null khi không có phân số mẫu nhỏ', () => {
    expect(toFraction(Math.PI)).toBe(null);
    expect(toFraction(Math.sqrt(2))).toBe(null);
    expect(toFraction(1 / 1000)).toBe(null);
  });
});

describe('fmt', () => {
  it('số nguyên giữ nguyên', () => {
    expect(fmt(3)).toBe('3');
    expect(fmt(-7)).toBe('-7');
    expect(fmt(0)).toBe('0');
  });

  it('thập phân ngắn giữ nguyên, số lặp vô hạn mới viết thành phân số', () => {
    expect(fmt(3.2)).toBe('3.2');
    expect(fmt(-0.5)).toBe('-0.5');
    expect(fmt(1.25)).toBe('1.25');
    expect(fmt(2 / 3)).toBe('2/3');
    expect(fmt(-1 / 6)).toBe('-1/6');
    expect(fmt(5 / 7)).toBe('5/7');
  });

  it('số lẻ thì làm tròn', () => {
    expect(fmt(Math.PI)).toBe('3.142');
    expect(fmt(Math.PI, 1)).toBe('3.1');
  });

  it('hệ số 1 và -1 viết gọn', () => {
    expect(fmtCoef(1)).toBe('');
    expect(fmtCoef(-1)).toBe('-');
    expect(fmtCoef(2)).toBe('2');
    expect(fmtCoef(0)).toBe('0');
  });

  it('số âm trong tích/luỹ thừa có ngoặc', () => {
    expect(fmtParen(3)).toBe('3');
    expect(fmtParen(-5)).toBe('(-5)');
    expect(fmtParen(-0.5)).toBe('(-0.5)');
    expect(fmtParen(-2 / 3)).toBe('(-2/3)');
    expect(fmtParen(0)).toBe('0');
  });

  it('vector và dấu', () => {
    expect(fmtVec([1, 2 / 3, -1])).toBe('(1, 2/3, -1)');
    expect(signPart(-3)).toEqual({ sign: '-', abs: 3 });
    expect(signPart(3)).toEqual({ sign: '+', abs: 3 });
  });
});
