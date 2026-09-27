import { db } from '@/db/database';
import { itemRepository } from '@/repositories/itemRepository';
import type { InventoryTransaction, Item, TransactionReason } from '@/types/models';

export interface CreateItemInput {
  name: string;
  categoryId: string | null;
  locationId: string | null;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  isFavorite?: boolean;
  notes?: string;
}

export interface QuantityChangeResult {
  item: Item;
  transaction: InventoryTransaction;
}

/**
 * 'undone': reverted successfully.
 * 'stale': rejected because the item's quantity no longer matches this transaction's
 *          newQuantity, so the previousQuantity snapshot is outdated - reverting could
 *          overwrite a more recent change. Nothing is modified.
 * 'not-found': the transaction (or its item) no longer exists; nothing to undo.
 */
export type UndoResult = 'undone' | 'stale' | 'not-found';

function clampQuantity(quantity: number): number {
  return Math.max(0, Math.round(quantity * 1000) / 1000);
}

export const inventoryService = {
  async createItem(input: CreateItemInput): Promise<Item> {
    const now = Date.now();
    const item: Item = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      categoryId: input.categoryId,
      locationId: input.locationId,
      quantity: clampQuantity(input.quantity),
      unit: input.unit.trim() || 'Stk.',
      minimumQuantity: Math.max(0, input.minimumQuantity),
      isFavorite: input.isFavorite ?? false,
      notes: input.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };
    await itemRepository.create(item);
    return item;
  },

  async updateItem(id: string, changes: Partial<CreateItemInput>): Promise<void> {
    const patch: Partial<Item> = { ...changes, updatedAt: Date.now() };
    if (changes.quantity !== undefined) patch.quantity = clampQuantity(changes.quantity);
    await itemRepository.update(id, patch);
  },

  async deleteItem(id: string): Promise<void> {
    await itemRepository.delete(id);
  },

  async toggleFavorite(id: string): Promise<void> {
    const item = await itemRepository.getById(id);
    if (!item) throw new Error(`Item ${id} not found`);
    await itemRepository.update(id, { isFavorite: !item.isFavorite, updatedAt: Date.now() });
  },

  /**
   * Atomically applies a quantity delta and logs the resulting transaction.
   * Quantity is floored at zero, matching the app's zero-boundary rule.
   */
  async adjustQuantity(itemId: string, delta: number, reason: TransactionReason = 'adjustment'): Promise<QuantityChangeResult> {
    return db.transaction('rw', db.items, db.transactions, async () => {
      const item = await db.items.get(itemId);
      if (!item) throw new Error(`Item ${itemId} not found`);

      const previousQuantity = item.quantity;
      const newQuantity = clampQuantity(previousQuantity + delta);
      const now = Date.now();

      const updatedItem: Item = { ...item, quantity: newQuantity, updatedAt: now };
      await db.items.put(updatedItem);

      const transaction: InventoryTransaction = {
        id: crypto.randomUUID(),
        itemId,
        delta: newQuantity - previousQuantity,
        previousQuantity,
        newQuantity,
        reason,
        timestamp: now,
      };
      await db.transactions.add(transaction);

      return { item: updatedItem, transaction };
    });
  },

  /** Sets the quantity directly (used for tap-to-edit), logging an adjustment transaction. */
  async setQuantity(itemId: string, quantity: number): Promise<QuantityChangeResult> {
    return db.transaction('rw', db.items, db.transactions, async () => {
      const item = await db.items.get(itemId);
      if (!item) throw new Error(`Item ${itemId} not found`);

      const previousQuantity = item.quantity;
      const newQuantity = clampQuantity(quantity);
      const now = Date.now();

      const updatedItem: Item = { ...item, quantity: newQuantity, updatedAt: now };
      await db.items.put(updatedItem);

      const transaction: InventoryTransaction = {
        id: crypto.randomUUID(),
        itemId,
        delta: newQuantity - previousQuantity,
        previousQuantity,
        newQuantity,
        reason: 'adjustment',
        timestamp: now,
      };
      await db.transactions.add(transaction);

      return { item: updatedItem, transaction };
    });
  },

  /**
   * Reverts a specific quantity-change transaction, restoring the item's previous quantity.
   *
   * Only allowed while the item's current quantity still matches this transaction's
   * `newQuantity` - i.e. nothing has changed the stock since. Otherwise a later change
   * (another +/-, a direct edit, or a second undo) could be silently overwritten by
   * reverting to a now-outdated snapshot, so the undo is rejected instead.
   */
  async undoTransaction(transactionId: string): Promise<UndoResult> {
    return db.transaction('rw', db.items, db.transactions, async () => {
      const transaction = await db.transactions.get(transactionId);
      if (!transaction) return 'not-found';

      const item = await db.items.get(transaction.itemId);
      if (!item) {
        await db.transactions.delete(transactionId);
        return 'not-found';
      }

      if (item.quantity !== transaction.newQuantity) {
        return 'stale';
      }

      await db.items.put({ ...item, quantity: transaction.previousQuantity, updatedAt: Date.now() });
      await db.transactions.delete(transactionId);
      return 'undone';
    });
  },
};
