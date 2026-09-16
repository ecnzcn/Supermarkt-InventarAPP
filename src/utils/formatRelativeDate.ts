function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats a transaction timestamp the way the transaction history expects:
 * "Heute 15:42", "Gestern 08:21", or "12.03.2026 18:03" for anything older.
 */
export function formatTransactionTimestamp(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const today = startOfDay(new Date(now));
  const day = startOfDay(date);
  const dayDiff = Math.round((today - day) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) return `Heute ${formatTime(date)}`;
  if (dayDiff === 1) return `Gestern ${formatTime(date)}`;

  const dateLabel = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${dateLabel} ${formatTime(date)}`;
}
