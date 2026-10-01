import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { db } from '@/db/database';
import { inventoryService } from '@/services/inventoryService';
import { itemRepository } from '@/repositories/itemRepository';
import { ItemFormPage } from '@/features/inventory/ItemFormPage';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';

beforeEach(async () => {
  await Promise.all([db.items.clear(), db.categories.clear(), db.locations.clear(), db.transactions.clear(), db.tags.clear(), db.itemTags.clear()]);
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <UndoToastProvider>
        <Routes>
          <Route path="/inventory/new" element={<ItemFormPage />} />
          <Route path="/inventory/:itemId/edit" element={<ItemFormPage />} />
          <Route path="/inventory" element={<div>Inventarliste</div>} />
        </Routes>
      </UndoToastProvider>
    </MemoryRouter>,
  );
}

describe('Artikelformular – Zahlenfelder & Einheit', () => {
  it('opens a decimal keypad and accepts only numbers in Menge and Mindestbestand', async () => {
    const user = userEvent.setup();
    renderAt('/inventory/new');

    const quantity = screen.getByLabelText('Menge');
    const minimum = screen.getByLabelText('Mindestbestand');
    expect(quantity).toHaveAttribute('inputmode', 'decimal');
    expect(minimum).toHaveAttribute('inputmode', 'decimal');

    await user.clear(quantity);
    await user.type(quantity, 'vier 4,5x');
    expect(quantity).toHaveValue('4,5');

    await user.clear(minimum);
    await user.type(minimum, 'abc2');
    expect(minimum).toHaveValue('2');
  });

  it('saves a unit chosen from the list and decimal quantities', async () => {
    const user = userEvent.setup();
    renderAt('/inventory/new');

    await user.type(screen.getByLabelText('Name'), 'Olivenöl');
    await user.clear(screen.getByLabelText('Menge'));
    await user.type(screen.getByLabelText('Menge'), '1,5');
    await user.selectOptions(screen.getByLabelText('Einheit'), 'l');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await screen.findByText('Inventarliste');
    const [saved] = await itemRepository.getAll();
    expect(saved).toMatchObject({ name: 'Olivenöl', quantity: 1.5, unit: 'l' });
  });

  it('supports a custom unit via "Eigene Einheit …"', async () => {
    const user = userEvent.setup();
    renderAt('/inventory/new');

    await user.type(screen.getByLabelText('Name'), 'Zwiebeln');
    await user.selectOptions(screen.getByLabelText('Einheit'), 'Eigene Einheit …');
    await user.type(screen.getByLabelText('Eigene Einheit'), 'Netz');
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));

    await screen.findByText('Inventarliste');
    const [saved] = await itemRepository.getAll();
    expect(saved.unit).toBe('Netz');
  });

  it('keeps an existing non-listed unit when editing', async () => {
    const item = await inventoryService.createItem({ name: 'Petersilie', categoryId: null, locationId: null, quantity: 2, unit: 'Bund', minimumQuantity: 0.5 });
    renderAt(`/inventory/${item.id}/edit`);

    expect(await screen.findByLabelText('Eigene Einheit')).toHaveValue('Bund');
    expect(screen.getByLabelText('Mindestbestand')).toHaveValue('0,5');
  });
});
