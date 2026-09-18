import { describe, it, expect } from 'vitest';
import { toBits } from '../src/logic/gray.js';

describe('khung project', () => {
  it('chạy được Vitest và import từ src/logic', () => {
    expect(toBits(5, 4)).toBe('0101');
  });
});
