import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { locationRepository } from '@/repositories/locationRepository';
import type { Location } from '@/types/models';

beforeEach(async () => {
  await db.locations.clear();
});

function makeLocation(name: string, parentId: string | null = null): Location {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, parentId, createdAt: now, updatedAt: now };
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
});
