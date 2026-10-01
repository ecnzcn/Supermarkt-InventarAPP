const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function formatAmount(value: number): string {
  // Avoid "0" for small but real rates.
  if (value > 0 && value < 0.1) return '< 0,1';
  return numberFormat.format(value);
}

/** "weniger als 1 Tag", "ca. 5 Tage", "ca. 3 Wochen", "ca. 4 Monate" */
export function formatDuration(days: number): string {
  if (days < 1) return 'weniger als 1 Tag';
  if (days < 14) {
    const d = Math.round(days);
    return `ca. ${d} ${d === 1 ? 'Tag' : 'Tage'}`;
  }
  if (days < 60) return `ca. ${Math.round(days / 7)} Wochen`;
  return `ca. ${Math.round(days / 30)} Monate`;
}

export function formatDate(timestamp: number): string {
  return dateFormat.format(new Date(timestamp));
}
