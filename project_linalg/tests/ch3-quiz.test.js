import { describe, it, expect } from 'vitest';
import { KINDS, YESNO, SPAN_KINDS, makeQuestion, solutionDetail } from '../src/logic/ch3-quiz.js';
import { checkAnswer } from '../src/logic/answer-check.js';
import {
  isIndependent, spanKind, inSpan, rankOfVectors, dimensions, matrixFromColumns,
} from '../src/logic/subspace.js';

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const many = (kind, n = 100, seed = 5) => {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => makeQuestion(kind, rnd));
};

describe('sinh đề', () => {
  it('đủ 4 dạng', () => {
    expect(KINDS).toEqual(['independent', 'spankind', 'inspan', 'nulldim']);
    expect([...new Set(many('mix', 200).map(q => q.kind))].sort()).toEqual([...KINDS].sort());
  });

  it('dạng lạ thì báo lỗi', () => {
    expect(() => makeQuestion('khong-co')).toThrowError(/err.badQuizKind/);
  });

  it('mọi câu đều kèm bộ vector trong meta và không có vector 0 lạc', () => {
    for (const q of many('mix', 100)) {
      expect(Array.isArray(q.meta.vectors)).toBe(true);
      expect(q.meta.vectors.length).toBe(q.meta.count);
      for (const v of q.meta.vectors) expect(v.length).toBe(3);
      expect(q.textKey).toMatch(/^c3q\./);
      expect(q.hintKey).toMatch(/^c3q\./);
    }
  });
});

describe('đáp án tính lại từ meta đều khớp', () => {
  it('independent', () => {
    for (const q of many('independent', 100)) {
      expect(YESNO).toContain(q.answer);
      expect(q.answer).toBe(isIndependent(q.meta.vectors) ? 'yes' : 'no');
    }
  });

  it('quá 3 vector trong R³ thì đáp án luôn là phụ thuộc', () => {
    const quads = many('independent', 200).filter(q => q.meta.count > 3);
    expect(quads.length).toBeGreaterThan(0);
    for (const q of quads) expect(q.answer).toBe('no');
  });

  it('spankind', () => {
    for (const q of many('spankind', 100)) {
      expect(SPAN_KINDS).toContain(q.answer);
      expect(q.answer).toBe(spanKind(q.meta.vectors));
    }
  });

  it('inspan', () => {
    for (const q of many('inspan', 100)) {
      expect(q.answer).toBe(inSpan(q.meta.vectors, q.meta.b).inSpan ? 'yes' : 'no');
      expect(q.meta.b.length).toBe(3);
    }
  });

  it('nulldim khớp định lý hạng', () => {
    for (const q of many('nulldim', 100)) {
      const A = matrixFromColumns(q.meta.vectors);
      expect(q.answer).toBe(dimensions(A).nullDim);
      expect(q.answer + rankOfVectors(q.meta.vectors)).toBe(q.meta.count);
    }
  });
});

describe('chất lượng đề', () => {
  it('không bao giờ lặp lại y hệt một vector trong cùng một bộ', () => {
    // "span của (-1,-2,0), (-1,-2,0)" trông như gõ nhầm chứ không phải câu hỏi
    for (const q of many('mix', 250)) {
      const seen = new Set(q.meta.vectors.map(v => v.join(',')));
      expect(seen.size, JSON.stringify(q.meta.vectors)).toBe(q.meta.vectors.length);
    }
  });

  it('không có vector 0 trong bộ', () => {
    for (const q of many('mix', 250)) {
      for (const v of q.meta.vectors) expect(v.some(x => x !== 0), JSON.stringify(v)).toBe(true);
    }
  });
});

describe('đề phải hỏi được cả hai chiều, không chỉ một đáp án', () => {
  it('câu độc lập tuyến tính có cả "có" lẫn "không"', () => {
    const answers = new Set(many('independent', 150).map(q => q.answer));
    expect([...answers].sort()).toEqual(['no', 'yes']);
  });

  it('câu b-trong-span có cả "có" lẫn "không"', () => {
    // ba vector độc lập trong R³ phủ kín không gian ⇒ đáp án luôn "có";
    // đề phải tránh trường hợp đó để câu hỏi còn ý nghĩa
    const qs = many('inspan', 150);
    const answers = qs.map(q => q.answer);
    expect(new Set(answers).size).toBe(2);
    const no = answers.filter(a => a === 'no').length;
    expect(no).toBeGreaterThan(qs.length * 0.2);
    for (const q of qs) expect(q.meta.count).toBeLessThanOrEqual(2);
  });

  it('câu hình dạng span ra được nhiều hơn một loại', () => {
    expect(new Set(many('spankind', 150).map(q => q.answer)).size).toBeGreaterThanOrEqual(3);
  });
});

describe('chấm bài', () => {
  it('đáp án của chính đề luôn được chấm đúng', () => {
    for (const q of many('mix', 200)) {
      expect(checkAnswer(String(q.answer), q.answer, q.tol), q.kind).toBe(true);
    }
  });

  it('chọn sai thì bị chấm sai', () => {
    for (const q of many('mix', 120)) {
      const wrong = Array.isArray(q.choices)
        ? q.choices.find(c => c !== q.answer)
        : String(q.answer + 1);
      expect(checkAnswer(wrong, q.answer, q.tol), q.kind).toBe(false);
    }
  });
});

describe('lời giải mẫu', () => {
  it('khớp với module subspace cho mọi dạng', () => {
    for (const q of many('mix', 120)) {
      const d = solutionDetail(q);
      expect(d.rank).toBe(rankOfVectors(q.meta.vectors));
      expect(d.count).toBe(q.meta.vectors.length);
      expect(d.rank + d.nullDim).toBe(d.count);
      expect(d.spanKind).toBe(spanKind(q.meta.vectors));
      if (q.kind === 'inspan' && q.answer === 'yes') {
        expect(Array.isArray(d.coefs)).toBe(true);
        expect(d.coefs.length).toBe(q.meta.count);
      }
    }
  });
});
