/**
 * Data safety helpers: persistent storage, backup reminder state and saving a backup
 * via the iOS share sheet (→ "In Dateien sichern" / iCloud Drive).
 *
 * The reminder state is a per-device preference, so it lives in localStorage (same as
 * the theme) and not in IndexedDB – no schema change, and it is never part of a backup.
 */
import { backupService, getBackupFilename } from '@/services/backupService';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_REMINDER_DAYS = 14;
export const REMINDER_OPTIONS = [0, 7, 14, 30] as const;
export const SNOOZE_DAYS = 3;

const KEYS = {
  lastBackupAt: 'vorrat-last-backup-at',
  reminderDays: 'vorrat-backup-reminder-days',
  snoozedUntil: 'vorrat-backup-snoozed-until',
} as const;

export interface BackupReminderState {
  lastBackupAt: number | null;
  /** 0 = reminder switched off. */
  reminderDays: number;
  snoozedUntil: number | null;
}

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable – the reminder simply falls back to its defaults.
  }
}

// --- tiny external store so every component sees changes immediately -------------
const listeners = new Set<() => void>();
let cached: { key: string; state: BackupReminderState } | null = null;

function emit() {
  listeners.forEach((l) => l());
}

export const backupReminderStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Re-reads storage but returns the same object while nothing changed (required by useSyncExternalStore). */
  getSnapshot(): BackupReminderState {
    const lastBackupAt = readNumber(KEYS.lastBackupAt);
    const days = readNumber(KEYS.reminderDays);
    const snoozedUntil = readNumber(KEYS.snoozedUntil);
    const key = `${lastBackupAt}|${days}|${snoozedUntil}`;
    if (cached?.key !== key) {
      cached = {
        key,
        state: { lastBackupAt, reminderDays: days === null ? DEFAULT_REMINDER_DAYS : days, snoozedUntil },
      };
    }
    return cached.state;
  },
  markBackedUp(now = Date.now()) {
    writeNumber(KEYS.lastBackupAt, now);
    writeNumber(KEYS.snoozedUntil, null);
    emit();
  },
  setReminderDays(days: number) {
    writeNumber(KEYS.reminderDays, days);
    emit();
  },
  snooze(now = Date.now()) {
    writeNumber(KEYS.snoozedUntil, now + SNOOZE_DAYS * DAY_MS);
    emit();
  },
};

/** Pure decision whether the dashboard should remind about a backup. */
export function isBackupDue(state: BackupReminderState, itemCount: number, now: number): boolean {
  if (state.reminderDays <= 0 || itemCount === 0) return false;
  if (state.snoozedUntil !== null && now < state.snoozedUntil) return false;
  if (state.lastBackupAt === null) return true;
  return now - state.lastBackupAt >= state.reminderDays * DAY_MS;
}

export function daysSince(timestamp: number, now: number): number {
  return Math.floor((now - timestamp) / DAY_MS);
}

// --- persistent storage ----------------------------------------------------------
export type PersistenceStatus = 'persisted' | 'not-persisted' | 'unsupported';

/**
 * Asks the browser to keep IndexedDB data even under storage pressure. Safe to call
 * on every start: it is a no-op once granted and never shows a prompt on iOS.
 */
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  try {
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'not-persisted';
  }
}

export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persisted) return 'unsupported';
  try {
    return (await storage.persisted()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'not-persisted';
  }
}

// --- saving a backup -------------------------------------------------------------
export type SaveBackupResult = 'shared' | 'downloaded' | 'cancelled';

interface SaveDeps {
  nav?: Pick<Navigator, 'canShare' | 'share'>;
  download?: (blob: Blob, filename: string) => void;
  now?: () => number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Creates the backup ZIP and hands it to the share sheet when the device supports
 * sharing files (iPhone: "In Dateien sichern" → iCloud Drive), otherwise downloads it.
 * Only a completed share/download counts as a backup for the reminder.
 */
export async function saveBackup(deps: SaveDeps = {}): Promise<SaveBackupResult> {
  const nav = deps.nav ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  const download = deps.download ?? downloadBlob;
  const now = deps.now ?? Date.now;

  const blob = await backupService.exportBackup();
  const filename = getBackupFilename();
  const file = new File([blob], filename, { type: 'application/zip' });

  if (nav?.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Vorrat-Backup' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      throw error;
    }
    backupReminderStore.markBackedUp(now());
    return 'shared';
  }

  download(blob, filename);
  backupReminderStore.markBackedUp(now());
  return 'downloaded';
}
