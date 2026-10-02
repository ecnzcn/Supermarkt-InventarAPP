import { useState } from 'react';
import { useBackupReminder } from '@/hooks/useBackupReminder';
import { backupReminderStore, daysSince, isBackupDue, saveBackup } from '@/services/dataSafetyService';
import { useUndoToast } from '@/features/undo/UndoToastContext';

interface BackupReminderCardProps {
  itemCount: number;
  now?: number;
}

/** Dashboard hint when the last backup is older than the chosen interval. */
export function BackupReminderCard({ itemCount, now = Date.now() }: BackupReminderCardProps) {
  const state = useBackupReminder();
  const { showInfo, showError } = useUndoToast();
  const [saving, setSaving] = useState(false);

  if (!isBackupDue(state, itemCount, now)) return null;

  const text =
    state.lastBackupAt === null
      ? 'Du hast noch keine Sicherung erstellt.'
      : `Letzte Sicherung vor ${daysSince(state.lastBackupAt, now)} Tagen.`;

  async function handleBackup() {
    setSaving(true);
    try {
      const result = await saveBackup();
      if (result !== 'cancelled') showInfo('Sicherung erstellt.');
    } catch (error) {
      showError(`Sicherung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reminder-card" role="status">
      <div className="reminder-card__text">
        <p className="reminder-card__title">Zeit für eine Sicherung</p>
        <p className="reminder-card__subtitle">{text} Deine Daten liegen nur auf diesem iPhone.</p>
      </div>
      <div className="reminder-card__actions">
        <button type="button" className="button button--secondary reminder-card__button" onClick={() => backupReminderStore.snooze(now)} disabled={saving}>
          Später
        </button>
        <button type="button" className="button button--primary reminder-card__button" onClick={handleBackup} disabled={saving}>
          {saving ? 'Erstellt…' : 'Jetzt sichern'}
        </button>
      </div>
    </div>
  );
}
