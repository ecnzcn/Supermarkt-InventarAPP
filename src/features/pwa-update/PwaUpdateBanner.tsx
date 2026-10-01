import { useState } from 'react';

interface PwaUpdateBannerProps {
  needRefresh: boolean;
  onUpdate: () => void | Promise<void>;
  onDismiss: () => void;
}

/**
 * Persistent hint that a new Vorrat version is ready. Deliberately separate from the
 * auto-dismissing undo toast: it stays until the user decides and never stacks.
 */
export function PwaUpdateBanner({ needRefresh, onUpdate, onDismiss }: PwaUpdateBannerProps) {
  const [updating, setUpdating] = useState(false);

  if (!needRefresh) return null;

  async function handleUpdate() {
    setUpdating(true);
    try {
      await onUpdate();
    } catch (error) {
      console.error('Vorrat: Aktualisierung fehlgeschlagen', error);
      setUpdating(false);
    }
  }

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <div className="update-banner__text">
        <p className="update-banner__title">Neue Version verfügbar</p>
        <p className="update-banner__subtitle">
          {updating ? 'Vorrat wird aktualisiert …' : 'Deine Daten bleiben erhalten.'}
        </p>
      </div>
      <div className="update-banner__actions">
        <button type="button" className="button button--secondary update-banner__button" onClick={onDismiss} disabled={updating}>
          Später
        </button>
        <button type="button" className="button button--primary update-banner__button" onClick={handleUpdate} disabled={updating}>
          {updating ? 'Lädt …' : 'Aktualisieren'}
        </button>
      </div>
    </div>
  );
}
