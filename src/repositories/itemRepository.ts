import { db } from '@/db/database';
import type { Item } from '@/types/models';

export const itemRepository = {
  async getAll(): Promise<Item[]> {
    return db.items.toArray();
  },

  async getById(id: string): Promise<Item | undefined> {
    return db.items.get(id);
  },

  async create(item: Item): Promise<void> {
    await db.items.add(item);
  },

  async update(id: string, changes: Partial<Item>): Promise<void> {
    await db.items.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.items, db.transactions, db.itemTags, async () => {
      await db.items.delete(id);
      await db.transactions.where('itemId').equals(id).delete();
      await db.itemTags.where('itemId').equals(id).delete();
    });
  },

  async getFavorites(): Promise<Item[]> {
    return db.items.filter((item) => item.isFavorite).toArray();
  },

  async bulkPut(items: Item[]): Promise<void> {
    await db.items.bulkPut(items);
  },

  async count(): Promise<number> {
    return db.items.count();
  },
};
