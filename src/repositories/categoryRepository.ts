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

  /**
   * Deletes a category and cleans up references to it: items that pointed at it fall
   * back to no category, and any subcategory that had it as a parent is promoted to
   * top-level - so no Item or Category is ever left pointing at a deleted id.
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.categories, db.items, async () => {
      await db.categories.delete(id);
      await db.items.where('categoryId').equals(id).modify({ categoryId: null });
      await db.categories.where('parentId').equals(id).modify({ parentId: null });
    });
  },

  async bulkPut(categories: Category[]): Promise<void> {
    await db.categories.bulkPut(categories);
  },

  async count(): Promise<number> {
    return db.categories.count();
  },
};
