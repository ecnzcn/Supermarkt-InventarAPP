import { db } from '@/db/database';
import type { Location } from '@/types/models';

export const locationRepository = {
  async getAll(): Promise<Location[]> {
    return db.locations.toArray();
  },

  async getById(id: string): Promise<Location | undefined> {
    return db.locations.get(id);
  },

  async create(location: Location): Promise<void> {
    await db.locations.add(location);
  },

  async update(id: string, changes: Partial<Location>): Promise<void> {
    await db.locations.update(id, changes);
  },

  /**
   * Deletes a location and cleans up references to it: items that pointed at it fall
   * back to no location, and any sub-location that had it as a parent is promoted to
   * top-level - so no Item or Location is ever left pointing at a deleted id.
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.locations, db.items, async () => {
      await db.locations.delete(id);
      await db.items.where('locationId').equals(id).modify({ locationId: null });
      await db.locations.where('parentId').equals(id).modify({ parentId: null });
    });
  },

  async bulkPut(locations: Location[]): Promise<void> {
    await db.locations.bulkPut(locations);
  },

  async count(): Promise<number> {
    return db.locations.count();
  },
};
