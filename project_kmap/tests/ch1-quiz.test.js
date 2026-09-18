import { describe, it, expect } from 'vitest';
import { KINDS, makeQuestion, compareAnswer } from '../src/logic/ch1-quiz.js';
import { mulberry32 } from './helpers/eval-cover.js';
import { convertBase } from '../src/logic/number-systems.js';
import { radixComplement, subtractByComplement } from '../src/logic/complements.js';
import { decode } from '../src/logic/signed-binary.js';

describe('makeQuestion', () => {
  it('sinh được cả 4 dạng, câu nào cũng có đề, đáp án và gợi ý', () => {
    const rnd = mulberry32(7);
    for (const k of KINDS) {
      for (let i = 0; i < 40; i++) {
        const q = makeQuestion(k, rnd);
        expect(q.kind, k).toBe(k);
        expect(q.text.length).toBeGreaterThan(10);
        expect(String(q.answer).length).toBeGreaterThan(0);
        expect(q.hint.length).toBeGreaterThan(10);
      }
    }
  });

  it('"mix" sinh ra đủ cả 4 dạng', () => {
    const rnd = mulberry32(11);
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(makeQuestion('mix', rnd).kind);
    expect([...seen].sort()).toEqual([...KINDS].sort());
  });

  it('dạng bài không hợp lệ thì throw', () => {
    expect(() => makeQuestion('xyz')).toThrow();
  });
});

/* Đáp án sinh ra phải tự kiểm chứng được bằng chính module logic tương ứng.
   Dùng q.meta (có cấu trúc) thay vì bóc tách chuỗi đề bằng regex. */
describe('đáp án sinh ra là đúng', () => {
  it('mọi câu đều kèm meta', () => {
    const rnd = mulberry32(20);
    for (const k of KINDS) {
      for (let i = 0; i < 20; i++) {
        expect(makeQuestion(k, rnd).meta, k).toBeTypeOf('object');
      }
    }
  });

  it('convert: đổi ngược đáp án ra lại đúng số trong đề', () => {
    const rnd = mulberry32(21);
    for (let i = 0; i < 80; i++) {
      const { meta, answer } = makeQuestion('convert', rnd);
      expect(convertBase(answer, meta.to, meta.from), JSON.stringify(meta)).toBe(meta.src);
    }
  });

  it('complement: complement của đáp án ra lại đề', () => {
    const rnd = mulberry32(22);
    for (let i = 0; i < 80; i++) {
      const { meta, answer } = makeQuestion('complement', rnd);
      expect(answer.length).toBe(meta.width);
      expect(radixComplement(answer, meta.r).digits, JSON.stringify(meta)).toBe(meta.src);
    }
  });

  it('subtract: đáp án khớp với subtractByComplement', () => {
    const rnd = mulberry32(23);
    for (let i = 0; i < 80; i++) {
      const { meta, answer } = makeQuestion('subtract', rnd);
      const res = subtractByComplement(meta.m, meta.n, meta.r);
      expect(answer, JSON.stringify(meta)).toBe((res.negative ? '-' : '') + res.digits);
    }
  });

  it('signed: decode đáp án ra đúng giá trị trong đề', () => {
    const rnd = mulberry32(24);
    for (let i = 0; i < 80; i++) {
      const { meta, answer } = makeQuestion('signed', rnd);
      expect(answer.length, JSON.stringify(meta)).toBe(meta.w);
      expect(decode(answer, meta.format), JSON.stringify(meta)).toBe(meta.value);
    }
  });
});

describe('compareAnswer', () => {
  it('bỏ qua khoảng trắng và hoa thường', () => {
    expect(compareAnswer(' 1a ', '1A')).toBe(true);
    expect(compareAnswer('10 11', '1011')).toBe(true);
  });

  it('bỏ qua số 0 đệm ở đầu', () => {
    expect(compareAnswer('1011', '0001011')).toBe(true);
    expect(compareAnswer('0001011', '1011')).toBe(true);
  });

  it('giữ nguyên số 0 khi đáp án đúng là 0', () => {
    expect(compareAnswer('0', '0000')).toBe(true);
    expect(compareAnswer('000', '0')).toBe(true);
  });

  it('chấp nhận cả dấu trừ thường và dấu trừ Unicode', () => {
    expect(compareAnswer('-1011', '-1011')).toBe(true);
    expect(compareAnswer('−1011', '-1011')).toBe(true);
  });

  it('phân biệt được dấu', () => {
    expect(compareAnswer('1011', '-1011')).toBe(false);
  });

  it('đáp án sai thì trả về false', () => {
    expect(compareAnswer('1010', '1011')).toBe(false);
    expect(compareAnswer('', '1011')).toBe(false);
  });
});
