import { describe, expect, it } from 'vitest';
import { formatAmount, formatDuration } from './formatConsumption';

describe('formatConsumption', () => {
  it('formats amounts in German with one decimal', () => {
    expect(formatAmount(2.5)).toBe('2,5');
    expect(formatAmount(3)).toBe('3');
    expect(formatAmount(0.04)).toBe('< 0,1');
  });

  it('formats durations in days, weeks or months', () => {
    expect(formatDuration(0.4)).toBe('weniger als 1 Tag');
    expect(formatDuration(1)).toBe('ca. 1 Tag');
    expect(formatDuration(5.4)).toBe('ca. 5 Tage');
    expect(formatDuration(21)).toBe('ca. 3 Wochen');
    expect(formatDuration(120)).toBe('ca. 4 Monate');
  });
});
