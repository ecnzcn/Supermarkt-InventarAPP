import { describe, expect, it } from 'vitest';
import { formatTransactionTimestamp } from '@/utils/formatRelativeDate';

const NOON_TODAY = new Date(2026, 2, 15, 12, 0, 0).getTime();

describe('formatTransactionTimestamp', () => {
  it('labels a timestamp from today as "Heute"', () => {
    const ts = new Date(2026, 2, 15, 15, 42).getTime();
    expect(formatTransactionTimestamp(ts, NOON_TODAY)).toBe('Heute 15:42');
  });

  it('labels a timestamp from yesterday as "Gestern"', () => {
    const ts = new Date(2026, 2, 14, 8, 21).getTime();
    expect(formatTransactionTimestamp(ts, NOON_TODAY)).toBe('Gestern 08:21');
  });

  it('uses a full date for anything older than yesterday', () => {
    const ts = new Date(2026, 2, 10, 18, 3).getTime();
    expect(formatTransactionTimestamp(ts, NOON_TODAY)).toBe('10.03.2026 18:03');
  });
});
