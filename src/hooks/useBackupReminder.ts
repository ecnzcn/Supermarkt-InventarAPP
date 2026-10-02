import { useSyncExternalStore } from 'react';
import { backupReminderStore, type BackupReminderState } from '@/services/dataSafetyService';

export function useBackupReminder(): BackupReminderState {
  return useSyncExternalStore(backupReminderStore.subscribe, backupReminderStore.getSnapshot);
}
