import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ItemCard } from '@/components/ItemCard';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';
import { inventoryService } from '@/services/inventoryService';
import type { EnrichedItem } from '@/types/views';

function makeItem(overrides: Partial<EnrichedItem> = {}): EnrichedItem {
  return {
    id: 'item-1',
    name: 'Mehl',
    categoryId: null,
    locationId: null,
    quantity: 4,
    unit: 'Packungen',
    minimumQuantity: 1,
    isFavorite: false,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    category: null,
    location: null,
    tags: [],
    stockStatus: 'ok',
    ...overrides,
  };
}

function renderItemCard(item: EnrichedItem) {
  return render(
    <MemoryRouter>
      <UndoToastProvider>
        <ItemCard item={item} />
      </UndoToastProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ItemCard favorite toggle', () => {
  it('calls inventoryService.toggleFavorite and shows no error toast on success', async () => {
    const toggleSpy = vi.spyOn(inventoryService, 'toggleFavorite').mockResolvedValue(undefined);
    const user = userEvent.setup();
    const item = makeItem({ isFavorite: false });
    renderItemCard(item);

    await user.click(screen.getByRole('button', { name: 'Als Favorit markieren' }));

    await waitFor(() => expect(toggleSpy).toHaveBeenCalledWith('item-1'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a visible error toast when the service call fails', async () => {
    vi.spyOn(inventoryService, 'toggleFavorite').mockRejectedValue(new Error('IndexedDB nicht verfügbar'));
    const user = userEvent.setup();
    const item = makeItem({ isFavorite: false });
    renderItemCard(item);

    await user.click(screen.getByRole('button', { name: 'Als Favorit markieren' }));

    const toast = await screen.findByRole('status');
    expect(toast).toHaveTextContent('Favorit konnte nicht geändert werden');
    expect(toast).toHaveTextContent('IndexedDB nicht verfügbar');
  });
});
