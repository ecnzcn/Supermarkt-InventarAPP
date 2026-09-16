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

  async delete(id: string): Promise<void> {
    await db.locations.delete(id);
  },

  async bulkPut(locations: Location[]): Promise<void> {
    await db.locations.bulkPut(locations);
  },

  async count(): Promise<number> {
    return db.locations.count();
  },
};
