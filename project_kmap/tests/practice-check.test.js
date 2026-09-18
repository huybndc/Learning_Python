import { describe, it, expect } from 'vitest';
import { cellsToImplicant, checkGroup } from '../src/logic/practice-check.js';
import { primeImplicants, implicantMinterms } from '../src/logic/quine-mccluskey.js';

/* Chuyển từ khối T7 của runTests() trong bản HTML gốc. */

describe('cellsToImplicant', () => {
  it('một ô → implicant đủ n literal', () => {
    expect(cellsToImplicant([5], 4)).toEqual({ v: 5, d: 0 });
  });

  it('4 góc K-map 4 biến → B\'D\' ({v:0, d:0b1010})', () => {
    expect(cellsToImplicant([0, 2, 8, 10], 4)).toEqual({ v: 0, d: 0b1010 });
  });

  it('implicant sinh ra luôn chứa mọi ô đã chọn', () => {
    const cells = [1, 3, 9, 11];
    const imp = cellsToImplicant(cells, 4);
    const covered = new Set(implicantMinterms(imp, 4));
    expect(cells.every(m => covered.has(m))).toBe(true);
  });
});

describe('checkGroup (T7)', () => {
  // Hàm mẫu: Σm(0,2,8,10) — đúng 4 góc của K-map 4 biến.
  const values = new Array(16).fill(0);
  [0, 2, 8, 10].forEach(m => { values[m] = 1; });
  const pis = primeImplicants([0, 2, 8, 10], [], 4);

  it('nhóm 4 góc hợp lệ, không có ghi chú', () => {
    const g = checkGroup([0, 2, 8, 10], values, 4, pis);
    expect(g.ok, g.errors.join('; ')).toBe(true);
    expect(g.notes).toEqual([]);
    expect(g.size).toBe(4);
  });

  it('nhóm 2 ô hợp lệ nhưng chưa lớn nhất → đúng 1 ghi chú', () => {
    const g = checkGroup([0, 2], values, 4, pis);
    expect(g.ok).toBe(true);
    expect(g.notes.length).toBe(1);
    expect(g.notes[0]).toContain('chưa phải nhóm lớn nhất');
  });

  it('nhóm 3 ô bị loại (không phải luỹ thừa của 2)', () => {
    const g = checkGroup([0, 2, 8], values, 4, pis);
    expect(g.ok).toBe(false);
    expect(g.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('nhóm chứa ô giá trị 0 bị loại', () => {
    const g = checkGroup([0, 1], values, 4, pis);
    expect(g.ok).toBe(false);
    expect(g.errors.some(e => e.includes('chứa ô giá trị 0'))).toBe(true);
  });

  it('nhóm 2 ô không kề nhau bị loại', () => {
    const g = checkGroup([0, 5], values, 4, pis);
    expect(g.ok).toBe(false);
    expect(g.errors.some(e => e.includes('hình chữ nhật'))).toBe(true);
  });

  it('nhóm rỗng bị loại ngay', () => {
    const g = checkGroup([], values, 4, pis);
    expect(g.ok).toBe(false);
    expect(g.errors).toEqual(['nhóm rỗng']);
  });

  it('ô trùng lặp được gộp lại trước khi kiểm tra', () => {
    const g = checkGroup([0, 2, 0, 2], values, 4, pis);
    expect(g.size).toBe(2);
    expect(g.ok).toBe(true);
  });

  it("nhóm toàn don't care được báo là không cần thiết", () => {
    const v = new Array(16).fill(0);
    [1, 3].forEach(m => { v[m] = 1; });
    [0, 2].forEach(m => { v[m] = 2; });
    const p = primeImplicants([1, 3], [0, 2], 4);
    const g = checkGroup([0, 2], v, 4, p);
    expect(g.ok).toBe(true);
    expect(g.notes.some(x => x.includes('không cần thiết'))).toBe(true);
  });
});
