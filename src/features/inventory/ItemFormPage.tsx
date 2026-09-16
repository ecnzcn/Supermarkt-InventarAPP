import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { useTags } from '@/hooks/useTags';
import { itemRepository } from '@/repositories/itemRepository';
import { tagRepository } from '@/repositories/tagRepository';
import { inventoryService } from '@/services/inventoryService';
import { useUndoToast } from '@/features/undo/UndoToastContext';
import { TransactionHistory } from '@/features/inventory/TransactionHistory';

export function ItemFormPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const isEditing = Boolean(itemId);
  const navigate = useNavigate();
  const { showError } = useUndoToast();

  const categories = useCategories();
  const locations = useLocations();
  const allTags = useTags();
  const existingItem = useLiveQuery(() => (itemId ? itemRepository.getById(itemId) : undefined), [itemId]);
  const existingItemTags = useLiveQuery(() => (itemId ? tagRepository.getTagsForItem(itemId) : undefined), [itemId]);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('Stk.');
  const [minimumQuantity, setMinimumQuantity] = useState('0');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setCategoryId(existingItem.categoryId ?? '');
      setLocationId(existingItem.locationId ?? '');
      setQuantity(String(existingItem.quantity));
      setUnit(existingItem.unit);
      setMinimumQuantity(String(existingItem.minimumQuantity));
      setNotes(existingItem.notes);
      setIsFavorite(existingItem.isFavorite);
    }
  }, [existingItem]);

  useEffect(() => {
    if (existingItemTags) {
      setTagsText(existingItemTags.map((t) => t.name).join(', '));
    }
  }, [existingItemTags]);

  async function resolveTagIds(names: string[]): Promise<string[]> {
    const existing = allTags ?? [];
    const byName = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
    const ids: string[] = [];
    for (const rawName of names) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;
      const found = byName.get(trimmed.toLowerCase());
      if (found) {
        ids.push(found.id);
      } else {
        const tag = { id: crypto.randomUUID(), name: trimmed };
        await tagRepository.create(tag);
        byName.set(trimmed.toLowerCase(), tag);
        ids.push(tag.id);
      }
    }
    return ids;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showError('Bitte einen Namen eingeben.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        categoryId: categoryId || null,
        locationId: locationId || null,
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'Stk.',
        minimumQuantity: Number(minimumQuantity) || 0,
        isFavorite,
        notes,
      };

      const tagNames = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await resolveTagIds(tagNames);

      if (isEditing && itemId) {
        await inventoryService.updateItem(itemId, input);
        await tagRepository.setTagsForItem(itemId, tagIds);
      } else {
        const created = await inventoryService.createItem(input);
        await tagRepository.setTagsForItem(created.id, tagIds);
      }
      navigate('/inventory');
    } catch (error) {
      showError(`Speichern fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemId) return;
    if (!window.confirm(`"${name}" wirklich löschen?`)) return;
    try {
      await inventoryService.deleteItem(itemId);
      navigate('/inventory');
    } catch (error) {
      showError(`Löschen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (isEditing && existingItem === undefined) {
    return <p>Lädt…</p>;
  }
  if (isEditing && existingItem === null) {
    return <p>Artikel wurde nicht gefunden.</p>;
  }

  return (
    <div>
      <h1 className="page-title">{isEditing ? 'Artikel bearbeiten' : 'Neuer Artikel'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="item-name">Name</label>
          <input id="item-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="item-quantity">Menge</label>
            <input id="item-quantity" type="number" min={0} step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="item-unit">Einheit</label>
            <input id="item-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Stk., Packungen, …" />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="item-min">Mindestbestand</label>
          <input
            id="item-min"
            type="number"
            min={0}
            step="0.1"
            value={minimumQuantity}
            onChange={(e) => setMinimumQuantity(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="item-category">Kategorie</label>
            <select id="item-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Keine</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="item-location">Ort</label>
            <select id="item-location" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Kein</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="item-tags">Tags (kommagetrennt)</label>
          <input id="item-tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="bio, glutenfrei" />
        </div>

        <div className="form-field">
          <label htmlFor="item-notes">Notizen</label>
          <textarea id="item-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <div className="form-field">
          <label>
            <input type="checkbox" checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} /> Favorit
          </label>
        </div>

        <button type="submit" className="button button--primary button--full" disabled={saving}>
          {isEditing ? 'Speichern' : 'Hinzufügen'}
        </button>

        {isEditing && (
          <button type="button" className="button button--danger button--full" style={{ marginTop: 12 }} onClick={handleDelete}>
            Artikel löschen
          </button>
        )}
      </form>

      {isEditing && itemId && (
        <>
          <div className="section-title">Verlauf</div>
          <div className="card">
            <TransactionHistory itemId={itemId} />
          </div>
        </>
      )}
    </div>
  );
}
