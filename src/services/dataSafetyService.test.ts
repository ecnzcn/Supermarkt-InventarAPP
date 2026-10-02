import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DAY_MS,
  backupReminderStore,
  isBackupDue,
  requestPersistentStorage,
  saveBackup,
  type BackupReminderState,
} from './dataSafetyService';

const NOW = Date.UTC(2026, 9, 2, 12);
const base: BackupReminderState = { lastBackupAt: null, reminderDays: 14, snoozedUntil: null };

describe('isBackupDue', () => {
  it('reminds when no backup exists yet and there is something to back up', () => {
    expect(isBackupDue(base, 3, NOW)).toBe(true);
    expect(isBackupDue(base, 0, NOW)).toBe(false);
  });

  it('respects the interval, the off switch and snoozing', () => {
    expect(isBackupDue({ ...base, lastBackupAt: NOW - 13 * DAY_MS }, 3, NOW)).toBe(false);
    expect(isBackupDue({ ...base, lastBackupAt: NOW - 14 * DAY_MS }, 3, NOW)).toBe(true);
    expect(isBackupDue({ ...base, reminderDays: 0 }, 3, NOW)).toBe(false);
    expect(isBackupDue({ ...base, snoozedUntil: NOW + DAY_MS }, 3, NOW)).toBe(false);
    expect(isBackupDue({ ...base, snoozedUntil: NOW - 1 }, 3, NOW)).toBe(true);
  });
});

describe('backupReminderStore', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to a 14-day reminder and keeps a stable snapshot', () => {
    const a = backupReminderStore.getSnapshot();
    expect(a).toEqual(base);
    expect(backupReminderStore.getSnapshot()).toBe(a);
  });

  it('persists backups, interval and snooze and notifies listeners', () => {
    const listener = vi.fn();
    const unsubscribe = backupReminderStore.subscribe(listener);
    backupReminderStore.snooze(NOW);
    backupReminderStore.setReminderDays(30);
    backupReminderStore.markBackedUp(NOW);
    expect(backupReminderStore.getSnapshot()).toEqual({ lastBackupAt: NOW, reminderDays: 30, snoozedUntil: null });
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});

describe('saveBackup', () => {
  beforeEach(() => localStorage.clear());

  it('uses the share sheet when files can be shared and records the backup', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const result = await saveBackup({ nav: { canShare: () => true, share }, now: () => NOW });
    expect(result).toBe('shared');
    const [{ files }] = share.mock.calls[0];
    expect(files[0].name).toMatch(/^Vorrat-Backup-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(backupReminderStore.getSnapshot().lastBackupAt).toBe(NOW);
  });

  it('does not count a cancelled share as a backup', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'));
    const result = await saveBackup({ nav: { canShare: () => true, share }, now: () => NOW });
    expect(result).toBe('cancelled');
    expect(backupReminderStore.getSnapshot().lastBackupAt).toBeNull();
  });

  it('falls back to a download when sharing files is not supported', async () => {
    const download = vi.fn();
    const result = await saveBackup({ nav: { canShare: () => false, share: vi.fn() }, download, now: () => NOW });
    expect(result).toBe('downloaded');
    expect(download).toHaveBeenCalledTimes(1);
    expect(backupReminderStore.getSnapshot().lastBackupAt).toBe(NOW);
  });
});

describe('requestPersistentStorage', () => {
  it('requests persistence once and reports the outcome', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persisted: vi.fn().mockResolvedValue(false), persist } });
    await expect(requestPersistentStorage()).resolves.toBe('persisted');
    expect(persist).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('reports unsupported browsers', async () => {
    vi.stubGlobal('navigator', {});
    await expect(requestPersistentStorage()).resolves.toBe('unsupported');
    vi.unstubAllGlobals();
  });
});
