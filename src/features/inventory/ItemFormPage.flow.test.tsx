import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { db } from '@/db/database';
import { inventoryService } from '@/services/inventoryService';
import { itemRepository } from '@/repositories/itemRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { ItemFormPage } from '@/features/inventory/ItemFormPage';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';

beforeEach(async () => {
  await db.transaction('rw', [db.items, db.categories, db.locations, db.transactions, db.tags, db.itemTags], async () => {
    await Promise.all([
      db.items.clear(),
      db.categories.clear(),
      db.locations.clear(),
      db.transactions.clear(),
      db.tags.clear(),
      db.itemTags.clear(),
    ]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderEditPage(itemId: string) {
  return render(
    <MemoryRouter initialEntries={[`/inventory/${itemId}/edit`]}>
      <UndoToastProvider>
        <Routes>
          <Route path="/inventory/:itemId/edit" element={<ItemFormPage />} />
          <Route path="/inventory" element={<div>Inventarliste</div>} />
        </Routes>
      </UndoToastProvider>
    </MemoryRouter>,
  );
}

/**
 * Flow B - Artikel löschen:
 * Artikel öffnen -> Löschen -> Bestätigung -> Artikel existiert nicht mehr
 * -> zugehörige Transaktionshistorie ist ebenfalls entfernt.
 */
describe('Flow B - Artikel löschen', () => {
  it('removes the item and its transaction history after confirmation', async () => {
    const item = await inventoryService.createItem({
      name: 'Kaffee',
      categoryId: null,
      locationId: null,
      quantity: 3,
      unit: 'Packungen',
      minimumQuantity: 1,
    });
    await inventoryService.adjustQuantity(item.id, 1, 'purchase');
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(1);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderEditPage(item.id);

    await screen.findByDisplayValue('Kaffee');
    await user.click(screen.getByRole('button', { name: 'Artikel löschen' }));

    expect(window.confirm).toHaveBeenCalled();
    await screen.findByText('Inventarliste'); // navigated away after deletion

    expect(await itemRepository.getById(item.id)).toBeUndefined();
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(0);
  });

  it('keeps the item when the confirmation is cancelled', async () => {
    const item = await inventoryService.createItem({
      name: 'Tee',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderEditPage(item.id);

    await screen.findByDisplayValue('Tee');
    await user.click(screen.getByRole('button', { name: 'Artikel löschen' }));

    expect(await itemRepository.getById(item.id)).not.toBeUndefined();
  });
});
