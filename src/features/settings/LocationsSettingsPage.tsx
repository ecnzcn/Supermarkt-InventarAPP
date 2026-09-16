import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocations } from '@/hooks/useLocations';
import { locationRepository } from '@/repositories/locationRepository';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import type { Location } from '@/types/models';

function makeLocation(name: string, parentId: string | null): Location {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, parentId, createdAt: now, updatedAt: now };
}

export function LocationsSettingsPage() {
  const locations = useLocations();
  const { showError } = useUndoToast();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await locationRepository.create(makeLocation(name.trim(), parentId || null));
      setName('');
      setParentId('');
    } catch (error) {
      showError(`Ort konnte nicht angelegt werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ort löschen? Artikel behalten ihre Zuordnung nicht mehr.')) return;
    try {
      await locationRepository.delete(id);
    } catch (error) {
      showError(`Löschen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function locationLabel(location: Location): string {
    if (!location.parentId) return location.name;
    const parent = locations?.find((l) => l.id === location.parentId);
    return parent ? `${parent.name} → ${location.name}` : location.name;
  }

  return (
    <div>
      <Link to="/settings">‹ Einstellungen</Link>
      <h1 className="page-title">Orte</h1>

      <form onSubmit={handleAdd}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-field">
            <label htmlFor="loc-name">Neuer Ort</label>
            <input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Keller" />
          </div>
          <div className="form-field">
            <label htmlFor="loc-parent">Übergeordneter Ort</label>
            <select id="loc-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Keiner</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button button--primary" style={{ marginBottom: 16 }}>
            Hinzufügen
          </button>
        </div>
      </form>

      <div className="settings-list">
        {locations?.map((location) => (
          <div key={location.id} className="settings-row">
            <span>{locationLabel(location)}</span>
            <button type="button" className="button button--danger" onClick={() => handleDelete(location.id)}>
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
