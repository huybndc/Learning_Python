import { describe, it, expect } from 'vitest';
import { KINDS, makeQuestion, checkAnswer } from '../src/logic/ch2-quiz.js';
import { sopTerms, sopToNand } from '../src/logic/nand-conversion.js';
import { exprTruthTable } from '../src/logic/expr-parser.js';
import { mulberry32 } from './helpers/eval-cover.js';

describe('sopTerms / sopToNand (Fig 2.7c)', () => {
  it('tách đúng các term của biểu thức SOP', () => {
    expect(sopTerms('wx + yz', 4)).toEqual(['wx', 'yz']);
    expect(sopTerms("x + y'z", 3)).toEqual(['x', "y'z"]);
    expect(sopTerms('xy', 2)).toEqual(['xy']);
  });

  it('biểu thức có ngoặc lồng thì throw', () => {
    expect(() => sopTerms('x(y + z)', 3)).toThrow();
  });

  it('dạng NAND tương đương với biểu thức gốc', () => {
    for (const [e, n] of [['wx + yz', 4], ["x + y'z", 3], ["x'y + xy'", 2],
      ['xy + yz + zx', 3], ['xy + z', 3], ["x'y'z + xyz", 3]]) {
      const r = sopToNand(e, n);
      expect(exprTruthTable(r.result, n), e + ' → ' + r.result).toEqual(exprTruthTable(e, n));
    }
  });

  it('wx + yz ra đúng dạng trong sách', () => {
    expect(sopToNand('wx + yz', 4).result).toBe("((wx)'(yz)')'");
  });

  it('đếm đúng số cổng mỗi tầng', () => {
    expect(sopToNand('xy + yz + zx', 3).gateCount).toEqual({ level1: 3, level2: 1 });
  });

  it('có đủ 3 bước giải thích', () => {
    const r = sopToNand('wx + yz', 4);
    expect(r.steps.length).toBe(4);
    expect(r.steps.every(s => s.note.length > 10)).toBe(true);
  });
});

describe('makeQuestion (Ch.2)', () => {
  it('sinh được cả 3 dạng, câu nào cũng đủ trường', () => {
    const rnd = mulberry32(31);
    for (const k of KINDS) {
      for (let i = 0; i < 40; i++) {
        const q = makeQuestion(k, rnd);
        expect(q.kind).toBe(k);
        expect(q.text.length).toBeGreaterThan(10);
        expect(String(q.answer).length).toBeGreaterThan(0);
        expect(q.hint.length).toBeGreaterThan(10);
        expect(q.meta).toBeTypeOf('object');
      }
    }
  });

  it('"mix" sinh ra đủ cả 3 dạng', () => {
    const rnd = mulberry32(32);
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(makeQuestion('mix', rnd).kind);
    expect([...seen].sort()).toEqual([...KINDS].sort());
  });

  it('dạng bài không hợp lệ thì throw', () => {
    expect(() => makeQuestion('zzz')).toThrow();
  });

  it('đáp án của câu nand/complement luôn tương đương với đề', () => {
    const rnd = mulberry32(33);
    for (let i = 0; i < 60; i++) {
      for (const k of ['nand', 'complement']) {
        const q = makeQuestion(k, rnd);
        const want = exprTruthTable(q.meta.expr, q.meta.n);
        const got = exprTruthTable(q.answer, q.meta.n);
        if (k === 'nand') expect(got, q.text).toEqual(want);
        else expect(got, q.text).toEqual(want.map(v => v ^ 1));
      }
    }
  });

  it('câu identify có bits khớp số hiệu Fᵢ', () => {
    const rnd = mulberry32(34);
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion('identify', rnd);
      expect(q.meta.bits).toBe(q.meta.fi.toString(2).padStart(4, '0'));
    }
  });
});

describe('checkAnswer', () => {
  const rnd = mulberry32(41);

  it('câu identify chấp nhận tên cổng, Fi, hoặc số', () => {
    const q = makeQuestion('identify', rnd);
    expect(checkAnswer(q, q.meta.gate).ok).toBe(true);
    expect(checkAnswer(q, q.meta.gate.toLowerCase()).ok).toBe(true);
    expect(checkAnswer(q, 'F' + q.meta.fi).ok).toBe(true);
    expect(checkAnswer(q, String(q.meta.fi)).ok).toBe(true);
    expect(checkAnswer(q, 'sai').ok).toBe(false);
  });

  it('câu biểu thức chấm theo bảng chân trị, viết khác vẫn đúng', () => {
    const q = { kind: 'nand', answer: "((wx)'(yz)')'", meta: { n: 4 } };
    expect(checkAnswer(q, "((wx)'(yz)')'").ok).toBe(true);
    expect(checkAnswer(q, 'wx + yz').ok).toBe(true);        // tương đương
    expect(checkAnswer(q, 'yz + wx').ok).toBe(true);        // đổi thứ tự
    expect(checkAnswer(q, 'wx').ok).toBe(false);
  });

  it('biểu thức sai cú pháp báo reason = parse', () => {
    const q = { kind: 'nand', answer: 'wx + yz', meta: { n: 4 } };
    const r = checkAnswer(q, 'wx +');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('parse');
    expect(r.message.length).toBeGreaterThan(0);
  });

  it('bỏ trống báo reason = empty', () => {
    const q = { kind: 'nand', answer: 'xy', meta: { n: 2 } };
    expect(checkAnswer(q, '  ')).toEqual({ ok: false, reason: 'empty' });
  });
});
