import { describe, it, expect } from 'vitest';
import {
  CODE_TABLES, encodeDigit, encodeDecimal, decodeGroup, codeTable,
  isSelfComplementing, addBcdDigits, addBcd,
  parityBit, withParity, checkParity, asciiBits,
} from '../src/logic/binary-codes.js';

/* §1.7–1.9 trong sách. */

describe('bảng mã', () => {
  it('BCD là biểu diễn nhị phân 4 bit của chữ số', () => {
    for (let d = 0; d <= 9; d++) expect(encodeDigit(d, 'bcd')).toBe(d.toString(2).padStart(4, '0'));
  });

  it('Excess-3 là BCD của (d + 3)', () => {
    expect(encodeDigit(0, 'excess3')).toBe('0011');
    expect(encodeDigit(9, 'excess3')).toBe('1100');
    for (let d = 0; d <= 9; d++) expect(encodeDigit(d, 'excess3')).toBe((d + 3).toString(2).padStart(4, '0'));
  });

  it('2421 khớp bảng trong sách', () => {
    expect(codeTable().map(r => r['2421'])).toEqual([
      '0000', '0001', '0010', '0011', '0100', '1011', '1100', '1101', '1110', '1111',
    ]);
  });

  it('mã 2421 đúng nghĩa trọng số 2-4-2-1', () => {
    const w = [2, 4, 2, 1];
    for (let d = 0; d <= 9; d++) {
      const bits = encodeDigit(d, '2421');
      const value = [...bits].reduce((s, b, i) => s + (+b) * w[i], 0);
      expect(value, 'd=' + d).toBe(d);
    }
  });

  it('2421 và Excess-3 tự bù, BCD thì không', () => {
    expect(isSelfComplementing('2421')).toBe(true);
    expect(isSelfComplementing('excess3')).toBe(true);
    expect(isSelfComplementing('bcd')).toBe(false);
  });

  it('mã của mỗi chữ số là duy nhất trong từng bảng', () => {
    for (const t of Object.keys(CODE_TABLES)) {
      const all = [...Array(10).keys()].map(d => encodeDigit(d, t));
      expect(new Set(all).size, t).toBe(10);
    }
  });

  it('encodeDecimal tách từng chữ số, decodeGroup đảo ngược lại', () => {
    const r = encodeDecimal('185', 'bcd');
    expect(r.map(g => g.bits)).toEqual(['0001', '1000', '0101']);
    expect(r.map(g => decodeGroup(g.bits, 'bcd')).join('')).toBe('185');
  });

  it('tổ hợp không dùng thì decodeGroup trả null', () => {
    expect(decodeGroup('1010', 'bcd')).toBeNull();   // 10 không hợp lệ ở BCD
    expect(decodeGroup('0000', 'excess3')).toBeNull();
  });

  it('đầu vào sai thì throw', () => {
    expect(() => encodeDigit(10, 'bcd')).toThrow();
    expect(() => encodeDigit(-1, 'bcd')).toThrow();
    expect(() => encodeDigit(5, 'zzz')).toThrow();
    expect(() => encodeDecimal('12a', 'bcd')).toThrow();
  });
});

/* --- §1.7: cộng BCD có hiệu chỉnh +6 --- */
describe('cộng BCD', () => {
  it('tổng ≤ 9 thì không cần hiệu chỉnh', () => {
    const r = addBcdDigits(4, 5);
    expect(r.needsFix).toBe(false);
    expect(r.digit).toBe(9);
    expect(r.carry).toBe(0);
  });

  it('tổng > 9 thì cộng thêm 6 và sinh nhớ', () => {
    const r = addBcdDigits(8, 9);
    expect(r.needsFix).toBe(true);
    expect(r.digit).toBe(7);
    expect(r.carry).toBe(1);
    expect(r.fixed).toBe('0111');
  });

  it('có đủ 3 bước giải thích', () => {
    expect(addBcdDigits(8, 9).steps.length).toBe(3);
  });

  it('184 + 576 = 760 (ví dụ trong sách)', () => {
    expect(addBcd('184', '576').digits).toBe('760');
  });

  it('có nhớ ra ngoài thì thêm chữ số 1 ở đầu', () => {
    const r = addBcd('99', '99');
    expect(r.digits).toBe('198');
    expect(r.carryOut).toBe(1);
  });

  it('khớp phép cộng thập phân với mọi cặp số 2 chữ số', () => {
    for (let a = 0; a < 100; a += 7) {
      for (let b = 0; b < 100; b += 3) {
        const A = String(a).padStart(2, '0'), B = String(b).padStart(2, '0');
        expect(Number(addBcd(A, B).digits), `${a}+${b}`).toBe(a + b);
      }
    }
  });

  it('mỗi cột đều đánh dấu đúng có cần hiệu chỉnh hay không', () => {
    // 184 + 576: trăm 1+5+1 = 7 ≤ 9 (không cần), chục 8+7+1 = 16 (cần), đơn vị 4+6 = 10 (cần)
    const r = addBcd('184', '576');
    expect(r.cols.map(c => c.needsFix)).toEqual([false, true, true]);
    expect(r.cols.map(c => c.digit)).toEqual([7, 6, 0]);
    expect(addBcd('11', '11').cols.map(c => c.needsFix)).toEqual([false, false]);
  });

  it('chữ số không hợp lệ thì throw', () => {
    expect(() => addBcd('1a', '2')).toThrow();
    expect(() => addBcdDigits(10, 1)).toThrow();
  });
});

/* --- §1.9: parity --- */
describe('parity', () => {
  it('even parity làm tổng số bit 1 thành chẵn', () => {
    expect(parityBit('1000001', 'even')).toBe('0');
    expect(parityBit('1010100', 'even')).toBe('1');
    expect(withParity('1000001', 'even')).toBe('10000010');
  });

  it('odd parity làm tổng số bit 1 thành lẻ', () => {
    expect(parityBit('1000001', 'odd')).toBe('1');
    expect(withParity('1000001', 'odd')).toBe('10000011');
  });

  it('chuỗi đã gắn parity luôn qua được checkParity', () => {
    for (const kind of ['even', 'odd']) {
      for (let v = 0; v < 128; v++) {
        const bits = v.toString(2).padStart(7, '0');
        expect(checkParity(withParity(bits, kind), kind), `${kind} ${bits}`).toBe(true);
      }
    }
  });

  it('phát hiện được lỗi 1 bit', () => {
    const sent = withParity('1000001', 'even');
    for (let i = 0; i < sent.length; i++) {
      const corrupted = sent.slice(0, i) + (sent[i] === '0' ? '1' : '0') + sent.slice(i + 1);
      expect(checkParity(corrupted, 'even'), 'lật bit ' + i).toBe(false);
    }
  });

  it('KHÔNG phát hiện được lỗi 2 bit (giới hạn của parity)', () => {
    const sent = withParity('1000001', 'even');
    const corrupted = (sent[0] === '0' ? '1' : '0') + (sent[1] === '0' ? '1' : '0') + sent.slice(2);
    expect(checkParity(corrupted, 'even')).toBe(true);
  });

  it('bit sai thì throw', () => {
    expect(() => parityBit('102')).toThrow();
    expect(() => checkParity('abc')).toThrow();
  });
});

describe('ASCII', () => {
  it('mã 7 bit đúng cho vài ký tự quen thuộc', () => {
    expect(asciiBits('A')).toBe('1000001');
    expect(asciiBits('a')).toBe('1100001');
    expect(asciiBits('0')).toBe('0110000');
    expect(asciiBits(' ')).toBe('0100000');
  });

  it('ký tự ngoài ASCII thì throw', () => {
    expect(() => asciiBits('ế')).toThrow();
  });
});
