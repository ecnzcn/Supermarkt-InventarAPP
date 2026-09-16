import { db } from '@/db/database';
import type { Category } from '@/types/models';

export const categoryRepository = {
  async getAll(): Promise<Category[]> {
    return db.categories.toArray();
  },

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id);
  },

  async create(category: Category): Promise<void> {
    await db.categories.add(category);
  },

  async update(id: string, changes: Partial<Category>): Promise<void> {
    await db.categories.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  },

  async bulkPut(categories: Category[]): Promise<void> {
    await db.categories.bulkPut(categories);
  },

  async count(): Promise<number> {
    return db.categories.count();
  },
};
