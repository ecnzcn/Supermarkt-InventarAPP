import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/database';
import { inventoryService } from '@/services/inventoryService';
import { DAY_MS } from '@/services/consumptionStatsService';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';

beforeEach(async () => {
  await Promise.all([db.items.clear(), db.transactions.clear(), db.categories.clear(), db.locations.clear(), db.tags.clear(), db.itemTags.clear()]);
});

async function itemWithUsage(name: string, quantity: number, minimumQuantity: number, consumedPerWeek: number) {
  const item = await inventoryService.createItem({ name, categoryId: null, locationId: null, quantity, unit: 'Stk.', minimumQuantity, isFavorite: false, notes: '' });
  const now = Date.now();
  await db.transactions.bulkPut([14, 7].map((daysAgo) => ({
    id: `${item.id}-${daysAgo}`, itemId: item.id, delta: -consumedPerWeek, previousQuantity: 0, newQuantity: 0,
    reason: 'consumption' as const, timestamp: now - daysAgo * DAY_MS,
  })));
  return item;
}

describe('Dashboard – „Geht bald aus“', () => {
  it('lists items above minimum stock that will run out within 14 days, soonest first', async () => {
    await itemWithUsage('Milch', 6, 1, 7);       // 1/day -> ~6 days
    await itemWithUsage('Kaffee', 10, 1, 7);     // ~10 days
    await itemWithUsage('Salz', 20, 1, 1);       // ~140 days -> not listed
    await itemWithUsage('Zucker', 1, 2, 7);      // already low -> in "Bald aufbrauchen" instead

    render(<MemoryRouter><UndoToastProvider><DashboardPage /></UndoToastProvider></MemoryRouter>);

    const heading = await screen.findByText('Geht bald aus');
    const section = heading.parentElement as HTMLElement;
    const hints = within(section).getAllByText(/^Noch ca\./).map((el) => el.closest('.item-card')?.textContent ?? '');
    expect(hints).toHaveLength(2);
    expect(hints[0]).toContain('Milch');
    expect(hints[0]).toContain('Noch ca. 6 Tage');
    expect(hints[1]).toContain('Kaffee');
    expect(screen.queryByText('Noch ca. 20 Wochen')).not.toBeInTheDocument();
  });
});
