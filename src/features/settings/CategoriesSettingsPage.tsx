import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { categoryRepository } from '@/repositories/categoryRepository';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import type { Category } from '@/types/models';

function makeCategory(name: string, icon: string): Category {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, icon, parentId: null, createdAt: now, updatedAt: now };
}

export function CategoriesSettingsPage() {
  const categories = useCategories();
  const { showError } = useUndoToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await categoryRepository.create(makeCategory(name.trim(), icon.trim() || '📦'));
      setName('');
      setIcon('📦');
    } catch (error) {
      showError(`Kategorie konnte nicht angelegt werden: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Kategorie löschen? Artikel behalten ihre Zuordnung nicht mehr.')) return;
    try {
      await categoryRepository.delete(id);
    } catch (error) {
      showError(`Löschen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div>
      <Link to="/settings">‹ Einstellungen</Link>
      <h1 className="page-title">Kategorien</h1>

      <form onSubmit={handleAdd} className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-field" style={{ maxWidth: 72 }}>
          <label htmlFor="cat-icon">Icon</label>
          <input id="cat-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
        </div>
        <div className="form-field">
          <label htmlFor="cat-name">Neue Kategorie</label>
          <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Getränke" />
        </div>
        <button type="submit" className="button button--primary" style={{ marginBottom: 16 }}>
          Hinzufügen
        </button>
      </form>

      <div className="settings-list">
        {categories?.map((category) => (
          <div key={category.id} className="settings-row">
            <span>
              {category.icon} {category.name}
            </span>
            <button type="button" className="button button--danger" onClick={() => handleDelete(category.id)}>
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
