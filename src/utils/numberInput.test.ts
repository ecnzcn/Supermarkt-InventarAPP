import { describe, expect, it } from 'vitest';
import { formatDecimalInput, parseDecimalInput, sanitizeDecimalInput } from './numberInput';

describe('sanitizeDecimalInput', () => {
  it('drops letters and other characters', () => {
    expect(sanitizeDecimalInput('vier')).toBe('');
    expect(sanitizeDecimalInput('4 Stück')).toBe('4');
    expect(sanitizeDecimalInput('-3')).toBe('3');
    expect(sanitizeDecimalInput('1e5')).toBe('15');
  });

  it('allows one decimal separator with up to two decimals', () => {
    expect(sanitizeDecimalInput('2,5')).toBe('2,5');
    expect(sanitizeDecimalInput('2.5')).toBe('2,5');
    expect(sanitizeDecimalInput('2,5,1')).toBe('2,51');
    expect(sanitizeDecimalInput('1,234')).toBe('1,23');
    expect(sanitizeDecimalInput(',5')).toBe('0,5');
  });

  it('removes leading zeros', () => {
    expect(sanitizeDecimalInput('03,5')).toBe('3,5');
    expect(sanitizeDecimalInput('007')).toBe('7');
    expect(sanitizeDecimalInput('00,5')).toBe('0,5');
    expect(sanitizeDecimalInput('0')).toBe('0');
  });
});

describe('parseDecimalInput / formatDecimalInput', () => {
  it('parses German decimals and falls back to 0', () => {
    expect(parseDecimalInput('2,5')).toBe(2.5);
    expect(parseDecimalInput('4,')).toBe(4);
    expect(parseDecimalInput('')).toBe(0);
  });

  it('formats with a decimal comma', () => {
    expect(formatDecimalInput(1.5)).toBe('1,5');
    expect(formatDecimalInput(3)).toBe('3');
  });
});
