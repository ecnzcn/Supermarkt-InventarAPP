import { describe, expect, it } from 'vitest';
import { getStockStatus } from '@/types/models';

describe('getStockStatus', () => {
  it('is "ok" above minimum quantity', () => {
    expect(getStockStatus({ quantity: 5, minimumQuantity: 2 })).toBe('ok');
  });

  it('is "low" at or below minimum quantity but above zero', () => {
    expect(getStockStatus({ quantity: 2, minimumQuantity: 2 })).toBe('low');
    expect(getStockStatus({ quantity: 1, minimumQuantity: 2 })).toBe('low');
  });

  it('is "out" when quantity is zero, regardless of minimum', () => {
    expect(getStockStatus({ quantity: 0, minimumQuantity: 2 })).toBe('out');
    expect(getStockStatus({ quantity: 0, minimumQuantity: 0 })).toBe('out');
  });
});
