import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/database';
import { inventoryService } from '@/services/inventoryService';
import { InventoryPage } from '@/features/inventory/InventoryPage';
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

function renderInventoryPage() {
  return render(
    <MemoryRouter>
      <UndoToastProvider>
        <InventoryPage />
      </UndoToastProvider>
    </MemoryRouter>,
  );
}

/**
 * Flow A - Bestand ändern:
 * Inventar öffnen -> Artikel sichtbar -> + -> Bestand prüfen -> - -> Bestand prüfen
 * -> Undo -> Bestand prüfen.
 * Exercises the real ItemCard/QuantityControl components against the real
 * inventoryService and the (fake-indexeddb backed) Dexie database - no mocks.
 */
describe('Flow A - Bestand ändern über das Inventar', () => {
  it('updates quantity via +/- and restores it via undo', async () => {
    await inventoryService.createItem({
      name: 'Mehl',
      categoryId: null,
      locationId: null,
      quantity: 4,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const user = userEvent.setup();
    renderInventoryPage();

    const card = (await screen.findByText('Mehl')).closest('.item-card');
    if (!card) throw new Error('item-card not found');
    const withinCard = within(card as HTMLElement);

    // + : 4 -> 5
    await user.click(withinCard.getByRole('button', { name: 'Mehl: Menge erhöhen' }));
    expect(await withinCard.findByText('5')).toBeInTheDocument();

    // - : 5 -> 4
    await user.click(withinCard.getByRole('button', { name: 'Mehl: Menge verringern' }));
    expect(await withinCard.findByText('4')).toBeInTheDocument();

    // Undo of the "-" must restore the value from right after the "+" (5), not the
    // original 4 - it reverts the single most recent transaction, not the whole session.
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(await withinCard.findByText('5')).toBeInTheDocument();
  });
});
