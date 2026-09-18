import { describe, it, expect } from 'vitest';
import { KINDS, TYPES, makeQuestion, systemOfType, solutionDetail } from '../src/logic/ch2-quiz.js';
import { solveSystem, residual } from '../src/logic/linear-system.js';
import { checkAnswer } from '../src/logic/answer-check.js';
import { matVec } from '../src/logic/matrix.js';

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const many = (kind, n = 80, seed = 11) => {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => makeQuestion(kind, rnd));
};

describe('sinh đề', () => {
  it('đủ 4 dạng', () => {
    expect(KINDS).toEqual(['solve2', 'solve3', 'classify', 'rank']);
    expect([...new Set(many('mix', 200).map(q => q.kind))].sort()).toEqual([...KINDS].sort());
  });

  it('dạng lạ thì báo lỗi', () => {
    expect(() => makeQuestion('khong-co')).toThrowError(/err.badQuizKind/);
    expect(() => systemOfType('khong-co', 2, Math.random)).toThrowError(/err.badQuizKind/);
  });

  it('mọi câu đều kèm hệ phương trình trong meta', () => {
    for (const q of many('mix', 80)) {
      expect(Array.isArray(q.meta.A)).toBe(true);
      expect(q.meta.A.length).toBe(q.meta.n);
      expect(q.meta.b.length).toBe(q.meta.n);
      expect(q.textKey).toMatch(/^c2q\./);
      expect(q.hintKey).toMatch(/^c2q\./);
    }
  });
});

describe('systemOfType sinh đúng loại yêu cầu', () => {
  for (const type of TYPES) {
    it('loại ' + type, () => {
      const rnd = seeded(3);
      for (let i = 0; i < 60; i++) {
        const n = i % 2 === 0 ? 2 : 3;
        const { A, b } = systemOfType(type, n, rnd);
        expect(solveSystem(A, b).type, JSON.stringify({ A, b })).toBe(type);
      }
    });
  }
});

describe('đáp án đúng', () => {
  it('solve2/solve3: nghiệm thay ngược vào hệ là đúng', () => {
    for (const q of [...many('solve2', 60), ...many('solve3', 60)]) {
      expect(q.answer.length).toBe(q.meta.n);
      expect(residual(q.meta.A, q.answer, q.meta.b)).toBeLessThan(1e-9);
      expect(matVec(q.meta.A, q.answer)).toEqual(q.meta.b);
      expect(solveSystem(q.meta.A, q.meta.b).type).toBe('unique');
    }
  });

  it('classify: đáp án khớp với bộ giải, không chỉ khớp ý định sinh đề', () => {
    for (const q of many('classify', 120)) {
      expect(TYPES).toContain(q.answer);
      expect(q.answer).toBe(solveSystem(q.meta.A, q.meta.b).type);
      expect(q.choices).toEqual(TYPES);
    }
  });

  it('rank: bằng hạng của A và không vượt số ẩn', () => {
    for (const q of many('rank', 120)) {
      expect(q.answer).toBe(solveSystem(q.meta.A, q.meta.b).rank);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(q.meta.n);
    }
  });

  it('hệ số giữ nhỏ để khử bằng tay còn dễ chịu', () => {
    for (const q of [...many('solve2', 60), ...many('solve3', 60)]) {
      for (const row of q.meta.A) for (const x of row) expect(Math.abs(x)).toBeLessThanOrEqual(4);
      for (const x of q.answer) expect(Math.abs(x)).toBeLessThanOrEqual(3);
    }
  });
});

describe('chấm bài', () => {
  it('đáp án của chính đề luôn được chấm đúng', () => {
    for (const q of many('mix', 160)) {
      const typed = Array.isArray(q.answer) ? q.answer.join(', ') : String(q.answer);
      expect(checkAnswer(typed, q.answer, q.tol), q.kind + ' ' + typed).toBe(true);
    }
  });

  it('sai một chút là bị chấm sai', () => {
    for (const q of many('solve2', 40)) {
      expect(checkAnswer([q.answer[0] + 1, q.answer[1]].join(', '), q.answer, q.tol)).toBe(false);
    }
    for (const q of many('classify', 40)) {
      const other = TYPES.find(t => t !== q.answer);
      expect(checkAnswer(other, q.answer, q.tol)).toBe(false);
    }
  });

  it('viết nghiệm kiểu khác vẫn đúng', () => {
    for (const q of many('solve3', 30)) {
      expect(checkAnswer('(' + q.answer.join('; ') + ')', q.answer, q.tol)).toBe(true);
    }
  });
});

describe('lời giải mẫu', () => {
  it('khớp với bộ giải cho mọi dạng', () => {
    for (const q of many('mix', 60)) {
      const d = solutionDetail(q);
      const r = solveSystem(q.meta.A, q.meta.b);
      expect(d.type).toBe(r.type);
      expect(d.rank).toBe(r.rank);
      expect(d.nVars).toBe(q.meta.n);
      if (d.type === 'unique') expect(residual(q.meta.A, d.solution, q.meta.b)).toBeLessThan(1e-9);
      if (d.type === 'infinite') expect(d.special.length).toBe(q.meta.n - d.rank);
      if (d.type === 'none') expect(d.rankAug).toBeGreaterThan(d.rank);
      if (d.type !== 'none') expect(d.rankAug).toBe(d.rank);
    }
  });
});
