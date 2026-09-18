import { describe, it, expect } from 'vitest';
import {
  applyRowOp, formatRowOp, choosePivotRow, forward, backward, isEchelon, nonZeroRows,
} from '../src/logic/elimination.js';
import { matVec } from '../src/logic/matrix.js';

describe('ba phép biến đổi hàng sơ cấp', () => {
  const M = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];

  it('đổi chỗ hai hàng', () => {
    expect(applyRowOp(M, { type: 'swap', i: 0, j: 2 })).toEqual([[7, 8, 9], [4, 5, 6], [1, 2, 3]]);
  });

  it('nhân một hàng với số khác 0', () => {
    expect(applyRowOp(M, { type: 'scale', i: 0, k: 2 })).toEqual([[2, 4, 6], [4, 5, 6], [7, 8, 9]]);
    expect(applyRowOp(M, { type: 'scale', i: 1, k: -1 })).toEqual([[1, 2, 3], [-4, -5, -6], [7, 8, 9]]);
  });

  it('cộng bội của hàng khác', () => {
    expect(applyRowOp(M, { type: 'add', i: 1, j: 0, k: -4 })).toEqual([[1, 2, 3], [0, -3, -6], [7, 8, 9]]);
  });

  it('không sửa ma trận gốc', () => {
    applyRowOp(M, { type: 'add', i: 1, j: 0, k: -4 });
    expect(M).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  });

  it('chặn các phép không hợp lệ', () => {
    expect(() => applyRowOp(M, { type: 'scale', i: 0, k: 0 })).toThrowError(/err.scaleZero/);
    expect(() => applyRowOp(M, { type: 'add', i: 1, j: 1, k: 2 })).toThrowError(/err.sameRow/);
    expect(() => applyRowOp(M, { type: 'swap', i: 0, j: 9 })).toThrowError(/err.rowRange/);
    expect(() => applyRowOp(M, { type: 'nothing' })).toThrowError(/err.badRowOp/);
  });

  it('phép biến đổi hàng không làm đổi tập nghiệm', () => {
    const A = [[2, 1], [1, 3]], b = [5, 6], x = [1.8, 1.4];
    const aug = [[2, 1, 5], [1, 3, 6]];
    for (const op of [{ type: 'swap', i: 0, j: 1 }, { type: 'scale', i: 0, k: 3 }, { type: 'add', i: 1, j: 0, k: -2 }]) {
      const out = applyRowOp(aug, op);
      for (const r of out) {
        expect(r[0] * x[0] + r[1] * x[1]).toBeCloseTo(r[2], 9);
      }
    }
    expect(matVec(A, x).map(v => Number(v.toFixed(6)))).toEqual(b);
  });
});

describe('công thức của phép biến đổi', () => {
  it('viết theo lối quen thuộc trong sách', () => {
    expect(formatRowOp({ type: 'swap', i: 1, j: 2 })).toBe('R2 <-> R3');
    expect(formatRowOp({ type: 'add', i: 1, j: 0, k: -2 })).toBe('R2 <- R2 - 2R1');
    expect(formatRowOp({ type: 'add', i: 2, j: 1, k: 3 })).toBe('R3 <- R3 + 3R2');
    expect(formatRowOp({ type: 'add', i: 2, j: 1, k: -1 })).toBe('R3 <- R3 - R2');
    expect(formatRowOp({ type: 'scale', i: 0, k: 2 })).toBe('R1 <- 2R1');
  });

  it('chia cho số nguyên viết thành phép chia, không phải nhân số thập phân', () => {
    expect(formatRowOp({ type: 'scale', i: 2, k: 1 / -77 })).toBe('R3 <- R3/(-77)');
    expect(formatRowOp({ type: 'scale', i: 0, k: 1 / 3 })).toBe('R1 <- R1/3');
    expect(formatRowOp({ type: 'scale', i: 0, k: -1 })).toBe('R1 <- -R1');
  });
});

describe('chọn trụ', () => {
  it('ưu tiên hệ số ±1 để số sau đó còn nguyên', () => {
    expect(choosePivotRow([[4, 1], [1, 2], [2, 0]], 0, 0)).toBe(1);
    expect(choosePivotRow([[4, 1], [3, 2]], 0, 0)).toBe(0);
    expect(choosePivotRow([[0, 1], [0, 2]], 0, 0)).toBe(-1);
  });

  it('chỉ nhìn từ hàng đang xét trở xuống', () => {
    expect(choosePivotRow([[1, 1], [0, 2], [5, 3]], 0, 1)).toBe(2);
  });
});

describe('khử xuôi', () => {
  it('đưa được về dạng bậc thang', () => {
    const { matrix, pivots, steps } = forward([[1, 2, 3, 6], [2, 5, 2, 4], [6, -3, 1, 2]]);
    expect(isEchelon(matrix, 3)).toBe(true);
    expect(pivots).toEqual([{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }]);
    expect(steps.length).toBe(3);
    expect(steps.map(s => s.formula)).toEqual(['R2 <- R2 - 2R1', 'R3 <- R3 - 6R1', 'R3 <- R3 + 15R2']);
  });

  it('mỗi bước kèm lý do và ma trận sau bước đó', () => {
    const { steps } = forward([[0, 2, 4], [3, 1, 5]]);
    expect(steps[0].reasonKey).toBe('c2.whySwap');
    expect(steps[0].matrix[0][0]).toBe(3);
    for (const s of steps) {
      expect(s.reasonKey).toMatch(/^c2\./);
      expect(Array.isArray(s.matrix)).toBe(true);
    }
  });

  it('đổi chỗ khi vị trí trụ đang là 0', () => {
    const { matrix, steps } = forward([[0, 1, 2], [1, 1, 3]]);
    expect(steps[0].op.type).toBe('swap');
    expect(matrix[0][0]).not.toBe(0);
  });

  it('cột toàn 0 thì bỏ qua và ghi lại là biến tự do', () => {
    const { steps, pivots } = forward([[0, 1, 2], [0, 3, 6]]);
    expect(pivots).toEqual([{ row: 0, col: 1 }]);
    expect(steps[0].reasonKey).toBe('c2.whyFreeCol');
    expect(steps[0].freeCol).toBe(0);
  });

  it('số dưới trụ đúng bằng 0, không phải 1e-16', () => {
    const { matrix } = forward([[3, 7, 1], [5, 2, 4], [2, 9, 8]]);
    expect(matrix[1][0]).toBe(0);
    expect(matrix[2][0]).toBe(0);
    expect(matrix[2][1]).toBe(0);
  });

  it('ma trận đã bậc thang sẵn thì không sinh bước nào', () => {
    const { steps } = forward([[1, 2, 3], [0, 4, 5]]);
    expect(steps).toEqual([]);
  });
});

describe('khử ngược', () => {
  it('đưa về bậc thang rút gọn: trụ bằng 1, phía trên trụ bằng 0', () => {
    const fw = forward([[1, 2, 3, 6], [2, 5, 2, 4], [6, -3, 1, 2]]);
    const { matrix } = backward(fw.matrix, fw.pivots);
    expect(matrix).toEqual([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 2]]);
  });

  it('giữ nguyên nghiệm của hệ', () => {
    const fw = forward([[2, 1, 5], [1, 3, 10]]);
    const { matrix } = backward(fw.matrix, fw.pivots);
    const x = [matrix[0][2], matrix[1][2]];
    expect(2 * x[0] + x[1]).toBeCloseTo(5, 9);
    expect(x[0] + 3 * x[1]).toBeCloseTo(10, 9);
  });

  it('trụ đã bằng 1 thì không sinh bước chia thừa', () => {
    const fw = forward([[1, 2, 3], [0, 1, 4]]);
    const { steps } = backward(fw.matrix, fw.pivots);
    expect(steps.every(s => s.op.type !== 'scale')).toBe(true);
  });
});

describe('nhận dạng', () => {
  it('isEchelon', () => {
    expect(isEchelon([[1, 2, 3], [0, 4, 5]], 2)).toBe(true);
    expect(isEchelon([[0, 4, 5], [1, 2, 3]], 2)).toBe(false);
    expect(isEchelon([[1, 2, 3], [0, 0, 0]], 2)).toBe(true);
    expect(isEchelon([[0, 0, 0], [1, 2, 3]], 2)).toBe(false);
  });

  it('đếm hàng khác 0', () => {
    expect(nonZeroRows([[1, 2], [0, 0]])).toBe(1);
    expect(nonZeroRows([[0, 0, 5]], 2)).toBe(0);
    expect(nonZeroRows([[0, 0, 5]], 3)).toBe(1);
  });
});
