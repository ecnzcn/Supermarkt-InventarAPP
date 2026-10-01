/**
 * Keeps only what a quantity field may contain: digits and at most one decimal
 * separator (comma or dot) with up to two decimals. Letters and other characters
 * are dropped, so pasted or dictated text can never end up in a quantity.
 */
export function sanitizeDecimalInput(raw: string): string {
  let result = '';
  let hasSeparator = false;
  let decimals = 0;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      if (hasSeparator) {
        if (decimals >= 2) continue;
        decimals += 1;
      }
      result += ch;
    } else if ((ch === ',' || ch === '.') && !hasSeparator) {
      hasSeparator = true;
      result += result === '' ? '0,' : ',';
    }
  }
  // "03" -> "3", "00,5" -> "0,5" (typing after the default "0" must not keep the zero)
  return result.replace(/^0+(?=\d)/, '');
}

/** Parses a sanitized value ("2,5", "3", "", "4,") into a non-negative number. */
export function parseDecimalInput(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Formats a stored number for the input field with a German decimal comma. */
export function formatDecimalInput(value: number): string {
  return String(value).replace('.', ',');
}
