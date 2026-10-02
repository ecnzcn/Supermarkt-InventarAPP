import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { backupService, getBackupFilename } from '@/services/backupService';
import type { ImportAnalysis, ImportConflictStrategy, ImportResult } from '@/services/backupTypes';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import { REMINDER_OPTIONS, backupReminderStore, saveBackup } from '@/services/dataSafetyService';
import { useBackupReminder } from '@/hooks/useBackupReminder';
import { usePersistenceStatus } from '@/hooks/usePersistenceStatus';
import { formatDate } from '@/utils/formatConsumption';

const PERSISTENCE_LABELS = {
  persisted: 'Dauerhaft – das System löscht die Daten nicht automatisch.',
  'not-persisted': 'Nicht garantiert – regelmäßige Sicherungen sind besonders wichtig.',
  unsupported: 'Unbekannt – dieser Browser meldet den Speicherstatus nicht.',
} as const;

const COUNT_LABELS: Record<string, string> = {
  items: 'Artikel',
  categories: 'Kategorien',
  locations: 'Orte',
  transactions: 'Verlaufseinträge',
  tags: 'Tags',
  itemTags: 'Tag-Zuordnungen',
};

export function BackupSettingsPage() {
  const { showError, showInfo } = useUndoToast();
  const reminder = useBackupReminder();
  const persistence = usePersistenceStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [strategy, setStrategy] = useState<ImportConflictStrategy>('skip');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const outcome = await saveBackup();
      if (outcome !== 'cancelled') showInfo('Sicherung erstellt.');
    } catch (error) {
      showError(`Export fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const analyzed = await backupService.analyzeImportFile(file);
      setAnalysis(analyzed);
    } catch (error) {
      showError(`Datei konnte nicht gelesen werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleConfirmImport() {
    if (!analysis?.backup) return;
    setImporting(true);
    try {
      const importResult = await backupService.applyImport(analysis.backup, strategy);
      setResult(importResult);
      setAnalysis(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      showError(`Import fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setImporting(false);
    }
  }

  function cancelImport() {
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const totalConflicts = analysis ? Object.values(analysis.conflicts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div>
      <Link to="/settings">‹ Einstellungen</Link>
      <h1 className="page-title">Sicherung &amp; Wiederherstellung</h1>

      <div className="section-title">Export</div>
      <div className="card">
        <p>
          Erstellt eine ZIP-Datei mit allen Inventardaten ({getBackupFilename()}). Auf dem iPhone öffnet sich das
          Teilen-Menü – mit „In Dateien sichern“ landet sie z. B. in iCloud Drive.
        </p>
        <button type="button" className="button button--primary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Wird erstellt…' : 'Backup exportieren'}
        </button>
        <p className="backup-meta">
          Letzte Sicherung: {reminder.lastBackupAt === null ? 'noch keine' : formatDate(reminder.lastBackupAt)}
        </p>
      </div>

      <div className="section-title">Datensicherheit</div>
      <div className="card">
        <div className="form-field">
          <label htmlFor="backup-reminder">Erinnerung an Sicherung</label>
          <select
            id="backup-reminder"
            value={reminder.reminderDays}
            onChange={(e) => backupReminderStore.setReminderDays(Number(e.target.value))}
          >
            {REMINDER_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days === 0 ? 'Aus' : `Alle ${days} Tage`}
              </option>
            ))}
          </select>
        </div>
        <p className="backup-meta">
          Speicher: {persistence ? PERSISTENCE_LABELS[persistence] : '…'}
        </p>
      </div>

      <div className="section-title">Import</div>
      <div className="card">
        <p>Wähle eine zuvor exportierte Vorrat-Backup-Datei aus.</p>
        <input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileSelected} />

        {analysis && !analysis.valid && (
          <div className="card" style={{ marginTop: 12, borderColor: 'var(--color-danger)' }}>
            <strong>Datei ungültig:</strong>
            <ul>
              {analysis.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
            <button type="button" className="button button--secondary" onClick={cancelImport}>
              Schließen
            </button>
          </div>
        )}

        {analysis && analysis.valid && (
          <div className="card" style={{ marginTop: 12 }}>
            <strong>Vorschau</strong>
            <ul>
              {Object.entries(analysis.counts).map(([key, count]) => (
                <li key={key}>
                  {COUNT_LABELS[key] ?? key}: {count}
                  {analysis.conflicts[key as keyof typeof analysis.conflicts] > 0 &&
                    ` (${analysis.conflicts[key as keyof typeof analysis.conflicts]} bereits vorhanden)`}
                </li>
              ))}
            </ul>

            {totalConflicts > 0 && (
              <div className="form-field">
                <label htmlFor="conflict-strategy">Vorhandene Einträge mit gleicher ID</label>
                <select
                  id="conflict-strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as ImportConflictStrategy)}
                >
                  <option value="skip">Behalten (Import überspringt sie)</option>
                  <option value="overwrite">Mit Backup überschreiben</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="button button--primary" onClick={handleConfirmImport} disabled={importing}>
                {importing ? 'Importiere…' : 'Import bestätigen'}
              </button>
              <button type="button" className="button button--secondary" onClick={cancelImport}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="card" style={{ marginTop: 12 }}>
            <strong>Import abgeschlossen</strong>
            <ul>
              {Object.entries(result.imported).map(([key, count]) => (
                <li key={key}>
                  {COUNT_LABELS[key] ?? key}: {count} importiert
                  {result.skipped[key as keyof typeof result.skipped] > 0 &&
                    `, ${result.skipped[key as keyof typeof result.skipped]} übersprungen`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
