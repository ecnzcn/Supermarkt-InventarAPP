import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { seedDemoItems } from '@/db/demoData';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import { usePwaUpdateState } from '@/features/pwa-update/PwaUpdateContext';
import { APP_BUILD, APP_VERSION } from '@/constants/appVersion';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

export function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const { showInfo, showError } = useUndoToast();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { checkNow } = usePwaUpdateState();
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  async function handleCheckForUpdate() {
    setCheckingUpdate(true);
    try {
      const result = await checkNow();
      if (result === 'up-to-date') showInfo('Vorrat ist auf dem neuesten Stand.');
      else if (result === 'update-found') showInfo('Neue Version gefunden – sie wird geladen.');
      else showInfo('Update-Prüfung ist hier nicht verfügbar (nur in der installierten App).');
    } catch (error) {
      showError(`Update-Prüfung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function handleLoadDemoData() {
    setLoadingDemo(true);
    try {
      const result = await seedDemoItems();
      if (result.created === 0) {
        showInfo('Demo-Artikel sind bereits vorhanden.');
      } else {
        showInfo(`${result.created} Demo-Artikel hinzugefügt${result.skippedExisting > 0 ? ` (${result.skippedExisting} übersprungen)` : ''}.`);
      }
    } catch (error) {
      showError(`Demo-Daten konnten nicht geladen werden: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Einstellungen</h1>

      <div className="section-title">Darstellung</div>
      <div className="card">
        <div className="form-field">
          <label htmlFor="theme-select">Erscheinungsbild</label>
          <select id="theme-select" value={theme} onChange={(e) => setTheme(e.target.value as ThemePreference)}>
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-title">Verwaltung</div>
      <div className="settings-list">
        <Link to="/settings/categories" className="settings-row">
          <span>Kategorien</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link to="/settings/locations" className="settings-row">
          <span>Orte</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link to="/settings/backup" className="settings-row">
          <span>Sicherung &amp; Wiederherstellung</span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <div className="section-title">Demo</div>
      <div className="card">
        <p>Füllt das Inventar mit realistischen Beispielartikeln (Mehl, Zucker, Waschmittel, …), um die App auszuprobieren.</p>
        <button type="button" className="button button--secondary" onClick={handleLoadDemoData} disabled={loadingDemo}>
          {loadingDemo ? 'Lädt…' : 'Demo-Daten laden'}
        </button>
      </div>

      <div className="section-title">App</div>
      <div className="card">
        <p>
          Updates werden automatisch geladen, sobald du die App öffnest. Ist eine neue Version
          bereit, erscheint oben ein Hinweis.
        </p>
        <button type="button" className="button button--secondary" onClick={handleCheckForUpdate} disabled={checkingUpdate}>
          {checkingUpdate ? 'Prüft…' : 'Nach Updates suchen'}
        </button>
      </div>
      <p className="app-version">
        Version {APP_VERSION} · Build {APP_BUILD}
      </p>
    </div>
  );
}
