import { describe, it, expect } from 'vitest';
import { KINDS, makeQuestion, recompute, spanKind, solutionDetail } from '../src/logic/ch1-quiz.js';
import { checkAnswer } from '../src/logic/answer-check.js';
import { dot, norm, angleDeg, combine } from '../src/logic/vector.js';

/** Bộ sinh số giả ngẫu nhiên có hạt giống — để test lặp lại được. */
function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const many = (kind, n = 120, seed = 7) => {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => makeQuestion(kind, rnd));
};

describe('sinh đề', () => {
  it('đủ 4 dạng và mix chỉ ra 4 dạng đó', () => {
    expect(KINDS).toEqual(['combine', 'dot', 'length', 'angle']);
    const kinds = new Set(many('mix', 200).map(q => q.kind));
    expect([...kinds].sort()).toEqual([...KINDS].sort());
  });

  it('dạng lạ thì báo lỗi có mã', () => {
    expect(() => makeQuestion('khong-co')).toThrowError(/err.badQuizKind/);
  });

  it('mọi câu đều có đủ trường cần thiết', () => {
    for (const q of many('mix', 60)) {
      expect(q.textKey).toMatch(/^c1q\./);
      expect(q.hintKey).toMatch(/^c1q\./);
      expect(q.answer).toBeDefined();
      expect(q.tol).toBeGreaterThan(0);
      expect(q.meta).toBeTruthy();
    }
  });

  it('không sinh vector 0 (góc và độ dài sẽ vô nghĩa)', () => {
    for (const q of many('mix', 120)) {
      for (const v of [q.meta.v, q.meta.w].filter(Boolean)) {
        expect(v.some(x => x !== 0), JSON.stringify(v)).toBe(true);
      }
    }
  });
});

describe('đáp án khớp với meta', () => {
  it('combine: đáp án đúng bằng c·v + d·w tính lại từ meta', () => {
    for (const q of many('combine', 80)) {
      expect(q.answer).toEqual(combine([q.meta.c, q.meta.d], [q.meta.v, q.meta.w]));
      expect(q.answer).toEqual(recompute(q));
      expect(q.answer.length).toBe(q.meta.dim);
    }
  });

  it('dot: đáp án là một số, không phải vector', () => {
    for (const q of many('dot', 80)) {
      expect(typeof q.answer).toBe('number');
      expect(q.answer).toBe(dot(q.meta.v, q.meta.w));
    }
  });

  it('length: khớp ‖v‖ trong sai số của câu hỏi', () => {
    for (const q of many('length', 80)) {
      expect(Math.abs(q.answer - norm(q.meta.v))).toBeLessThanOrEqual(q.tol);
      expect(q.answer).toBeGreaterThan(0);
    }
  });

  it('angle: nằm trong [0, 180] và khớp công thức', () => {
    for (const q of many('angle', 80)) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(180);
      expect(Math.abs(q.answer - angleDeg(q.meta.v, q.meta.w))).toBeLessThanOrEqual(q.tol);
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

  it('người học viết kiểu khác vẫn đúng', () => {
    for (const q of many('combine', 40)) {
      expect(checkAnswer('(' + q.answer.join('; ') + ')', q.answer, q.tol)).toBe(true);
      expect(checkAnswer(q.answer.join(' '), q.answer, q.tol)).toBe(true);
    }
  });

  it('lệch một đơn vị thì bị chấm sai', () => {
    for (const q of many('mix', 60)) {
      const wrong = Array.isArray(q.answer)
        ? [q.answer[0] + 1, ...q.answer.slice(1)].join(', ')
        : String(q.answer + 1);
      expect(checkAnswer(wrong, q.answer, q.tol), q.kind).toBe(false);
    }
  });

  it('câu làm tròn chấp nhận đúng mức sai số đã hứa', () => {
    for (const q of many('length', 40).filter(x => x.meta.rounded)) {
      expect(checkAnswer(q.meta.exact.toFixed(2), q.answer, q.tol)).toBe(true);
    }
    for (const q of many('angle', 40)) {
      expect(checkAnswer(q.meta.exact.toFixed(1), q.answer, q.tol)).toBe(true);
    }
  });
});

describe('lời giải mẫu và span', () => {
  it('solutionDetail cho đủ phần cho mọi dạng', () => {
    for (const q of many('mix', 40)) {
      const d = solutionDetail(q);
      expect(d.parts.length).toBeGreaterThan(0);
      expect(String(d.result).length).toBeGreaterThan(0);
    }
  });

  it('spanKind phân loại đúng 3 trường hợp', () => {
    expect(spanKind([1, 0], [0, 1])).toBe('plane');
    expect(spanKind([1, 2], [3, 1])).toBe('plane');
    expect(spanKind([1, 2], [2, 4])).toBe('line');
    expect(spanKind([1, 2], [-2, -4])).toBe('line');
    expect(spanKind([1, 2], [0, 0])).toBe('line');
    expect(spanKind([0, 0], [0, 0])).toBe('point');
  });
});
