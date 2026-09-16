import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { seedDemoItems } from '@/db/demoData';
import { itemRepository } from '@/repositories/itemRepository';

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

describe('seedDemoItems', () => {
  it('creates a realistic set of demo items with resolved category/location', async () => {
    const result = await seedDemoItems();
    expect(result.created).toBeGreaterThan(0);
    expect(result.skippedExisting).toBe(0);

    const items = await itemRepository.getAll();
    const flour = items.find((i) => i.name === 'Mehl');
    expect(flour).toBeDefined();
    expect(flour?.categoryId).not.toBeNull();
    expect(flour?.locationId).not.toBeNull();
    expect(flour?.quantity).toBeGreaterThan(0);
  });

  it('is idempotent: running twice does not create duplicates', async () => {
    const first = await seedDemoItems();
    const second = await seedDemoItems();

    expect(second.created).toBe(0);
    expect(second.skippedExisting).toBe(first.created);

    const items = await itemRepository.getAll();
    const names = items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
