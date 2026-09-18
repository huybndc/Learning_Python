import { describe, it, expect } from 'vitest';
import {
  varNames, equationString, systemStrings, classifyFrom, solve, solveSystem,
  residual, generalSolutionString, findInconsistentRow,
} from '../src/logic/linear-system.js';
import { matVec } from '../src/logic/matrix.js';
import { forward } from '../src/logic/elimination.js';

describe('viết hệ ra chữ', () => {
  it('tên ẩn theo thói quen', () => {
    expect(varNames(2)).toEqual(['x', 'y']);
    expect(varNames(3)).toEqual(['x', 'y', 'z']);
    expect(varNames(4)).toEqual(['x1', 'x2', 'x3', 'x4']);
  });

  it('bỏ hạng tử hệ số 0, viết gọn hệ số 1', () => {
    expect(equationString([1, 2], 5)).toBe('x + 2y = 5');
    expect(equationString([0, 3], 6)).toBe('3y = 6');
    expect(equationString([2, -1], 0)).toBe('2x - y = 0');
    expect(equationString([-1, -2], -3)).toBe('-x - 2y = -3');
    expect(equationString([0, 0], 4)).toBe('0 = 4');
  });

  it('cả hệ', () => {
    expect(systemStrings([[1, 2], [3, 4]], [5, 6])).toEqual(['x + 2y = 5', '3x + 4y = 6']);
  });
});

describe('phân loại nghiệm', () => {
  const type = (A, b) => solve(A, b).type;

  it('nghiệm duy nhất', () => {
    expect(type([[1, 2], [3, 4]], [5, 6])).toBe('unique');
    expect(type([[1, 0], [0, 1]], [3, 4])).toBe('unique');
    expect(type([[1, 2, 3], [2, 5, 2], [6, -3, 1]], [6, 4, 2])).toBe('unique');
  });

  it('vô số nghiệm', () => {
    expect(type([[1, 2], [2, 4]], [3, 6])).toBe('infinite');
    expect(type([[1, 1, 1], [2, 2, 2], [3, 3, 3]], [1, 2, 3])).toBe('infinite');
    expect(type([[0, 0], [0, 0]], [0, 0])).toBe('infinite');
  });

  it('vô nghiệm', () => {
    expect(type([[1, 2], [2, 4]], [3, 7])).toBe('none');
    expect(type([[1, 1], [1, 1]], [1, 2])).toBe('none');
    expect(type([[0, 0], [0, 0]], [0, 1])).toBe('none');
  });

  it('hạng và số biến tự do khớp nhau', () => {
    const r = solve([[1, 1, 1], [2, 2, 2], [3, 3, 3]], [1, 2, 3]);
    expect(r.rankA).toBe(1);
    expect(r.freeCount).toBe(2);
    expect(r.freeCols).toEqual([1, 2]);
    expect(r.pivotCols).toEqual([0]);
  });

  it('classifyFrom đọc đúng từ ma trận đã khử', () => {
    const fw = forward([[1, 2, 3], [2, 4, 7]]);
    expect(classifyFrom(fw.matrix, 2).type).toBe('none');
    expect(classifyFrom(fw.matrix, 2).badRow).toBeGreaterThanOrEqual(0);
    expect(findInconsistentRow([[1, 2, 3], [0, 0, 1]], 2)).toBe(1);
    expect(findInconsistentRow([[1, 2, 3], [0, 0, 0]], 2)).toBe(-1);
  });
});

describe('nghiệm trả về phải thoả hệ', () => {
  it('nghiệm duy nhất thay ngược vào đúng', () => {
    const cases = [
      [[[1, 2], [3, 4]], [5, 6]],
      [[[2, -1], [1, 3]], [3, 10]],
      [[[1, 2, 3], [2, 5, 2], [6, -3, 1]], [6, 4, 2]],
      [[[0, 1], [1, 0]], [2, 3]],
    ];
    for (const [A, b] of cases) {
      const r = solve(A, b);
      expect(r.type).toBe('unique');
      expect(residual(A, r.solution, b)).toBeLessThan(1e-9);
    }
  });

  it('nghiệm riêng và nghiệm đặc biệt của trường hợp vô số nghiệm', () => {
    const A = [[1, 2, 3], [2, 4, 6]], b = [6, 12];
    const r = solve(A, b);
    expect(r.type).toBe('infinite');
    expect(residual(A, r.particular, b)).toBeLessThan(1e-9);
    // mỗi nghiệm đặc biệt thoả hệ thuần nhất Ax = 0
    for (const s of r.special) {
      expect(Math.max(...matVec(A, s).map(Math.abs))).toBeLessThan(1e-9);
    }
    // nghiệm riêng cộng bất kỳ tổ hợp nào của nghiệm đặc biệt vẫn là nghiệm
    const mixed = r.particular.map((x, i) => x + 2 * r.special[0][i] - 3 * r.special[1][i]);
    expect(residual(A, mixed, b)).toBeLessThan(1e-9);
  });

  it('vô nghiệm thì không trả nghiệm', () => {
    const r = solve([[1, 2], [2, 4]], [3, 7]);
    expect(r.solution).toBe(null);
    expect(r.particular).toBe(null);
    expect(r.special).toEqual([]);
  });

  it('solveSystem trả gọn cùng kết quả', () => {
    const s = solveSystem([[1, 2], [3, 4]], [5, 6]);
    expect(s.type).toBe('unique');
    expect(s.rank).toBe(2);
    expect(residual([[1, 2], [3, 4]], s.solution, [5, 6])).toBeLessThan(1e-9);
  });
});

describe('các bước lưu lại được', () => {
  it('bước cuối của khử xuôi khớp với ref', () => {
    const r = solve([[1, 2, 3], [2, 5, 2], [6, -3, 1]], [6, 4, 2]);
    expect(r.forwardSteps.at(-1).matrix).toEqual(r.ref);
    expect(r.backwardSteps.at(-1).matrix).toEqual(r.rref);
    expect(r.start).toEqual([[1, 2, 3, 6], [2, 5, 2, 4], [6, -3, 1, 2]]);
  });

  it('hệ vô nghiệm thì dừng sau khử xuôi', () => {
    const r = solve([[1, 2], [2, 4]], [3, 7]);
    expect(r.backwardSteps).toEqual([]);
    expect(r.rref).toEqual(r.ref);
  });
});

describe('nghiệm tổng quát viết ra chữ', () => {
  it('duy nhất thì chỉ một vector', () => {
    expect(generalSolutionString(solve([[1, 0], [0, 1]], [3, 4]))).toBe('(3, 4)');
  });

  it('vô số nghiệm thì có tham số', () => {
    const s = generalSolutionString(solve([[1, 2], [2, 4]], [3, 6]));
    expect(s).toBe('(3, 0) + t·(-2, 1)');
  });

  it('hai biến tự do thì hai tham số', () => {
    const s = generalSolutionString(solve([[1, 1, 1], [2, 2, 2]], [1, 2]));
    expect(s).toContain('t·');
    expect(s).toContain('s·');
  });

  it('vô nghiệm thì rỗng', () => {
    expect(generalSolutionString(solve([[1, 1], [1, 1]], [1, 2]))).toBe('');
  });
});
