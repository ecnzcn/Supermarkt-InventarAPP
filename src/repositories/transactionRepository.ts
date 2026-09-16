import { db } from '@/db/database';
import type { InventoryTransaction } from '@/types/models';

export const transactionRepository = {
  async getAll(): Promise<InventoryTransaction[]> {
    return db.transactions.orderBy('timestamp').reverse().toArray();
  },

  async getByItemId(itemId: string): Promise<InventoryTransaction[]> {
    return db.transactions.where('itemId').equals(itemId).reverse().sortBy('timestamp');
  },

  async create(transaction: InventoryTransaction): Promise<void> {
    await db.transactions.add(transaction);
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },

  async bulkPut(transactions: InventoryTransaction[]): Promise<void> {
    await db.transactions.bulkPut(transactions);
  },

  async count(): Promise<number> {
    return db.transactions.count();
  },
};
