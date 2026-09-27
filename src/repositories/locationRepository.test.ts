import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { locationRepository } from '@/repositories/locationRepository';
import { itemRepository } from '@/repositories/itemRepository';
import type { Item, Location } from '@/types/models';

beforeEach(async () => {
  await db.locations.clear();
  await db.items.clear();
});

function makeLocation(name: string, parentId: string | null = null): Location {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, parentId, createdAt: now, updatedAt: now };
}

function makeItem(name: string, locationId: string | null): Item {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    categoryId: null,
    locationId,
    quantity: 1,
    unit: 'Stk.',
    minimumQuantity: 0,
    isFavorite: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

describe('locationRepository', () => {
  it('creates and retrieves a location', async () => {
    const location = makeLocation('Keller');
    await locationRepository.create(location);
    expect(await locationRepository.getById(location.id)).toEqual(location);
  });

  it('updates a location', async () => {
    const location = makeLocation('Keller');
    await locationRepository.create(location);
    await locationRepository.update(location.id, { name: 'Kellerraum' });
    expect((await locationRepository.getById(location.id))?.name).toBe('Kellerraum');
  });

  it('deletes a location', async () => {
    const location = makeLocation('Keller');
    await locationRepository.create(location);
    await locationRepository.delete(location.id);
    expect(await locationRepository.getById(location.id)).toBeUndefined();
  });

  it('supports hierarchical locations via parentId', async () => {
    const basement = makeLocation('Keller');
    const shelf = makeLocation('Regal 3', basement.id);
    const compartment = makeLocation('Fach B', shelf.id);
    await locationRepository.bulkPut([basement, shelf, compartment]);

    const storedShelf = await locationRepository.getById(shelf.id);
    const storedCompartment = await locationRepository.getById(compartment.id);
    expect(storedShelf?.parentId).toBe(basement.id);
    expect(storedCompartment?.parentId).toBe(shelf.id);
  });

  it('clears locationId on items that referenced a deleted location', async () => {
    const location = makeLocation('Keller');
    await locationRepository.create(location);
    const item = makeItem('Waschmittel', location.id);
    await itemRepository.create(item);

    await locationRepository.delete(location.id);

    const stored = await itemRepository.getById(item.id);
    expect(stored?.locationId).toBeNull();
  });

  it('promotes sub-locations to top-level when their parent location is deleted', async () => {
    const basement = makeLocation('Keller');
    const shelf = makeLocation('Regal 3', basement.id);
    await locationRepository.bulkPut([basement, shelf]);

    await locationRepository.delete(basement.id);

    const storedShelf = await locationRepository.getById(shelf.id);
    expect(storedShelf?.parentId).toBeNull();
  });

  it('does not touch items or locations unrelated to the deleted location', async () => {
    const deleted = makeLocation('Keller');
    const kept = makeLocation('Küche');
    await locationRepository.bulkPut([deleted, kept]);
    const unrelatedItem = makeItem('Kaffee', kept.id);
    await itemRepository.create(unrelatedItem);

    await locationRepository.delete(deleted.id);

    expect(await locationRepository.getById(kept.id)).toEqual(kept);
    expect((await itemRepository.getById(unrelatedItem.id))?.locationId).toBe(kept.id);
  });
});
