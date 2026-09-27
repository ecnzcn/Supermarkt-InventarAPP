import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { inventoryService, type QuantityChangeResult } from '@/services/inventoryService';
import { itemRepository } from '@/repositories/itemRepository';
import { transactionRepository } from '@/repositories/transactionRepository';

/** Unwraps a quantity-change call expected to represent a real change, not a no-op. */
async function expectChange(promise: Promise<QuantityChangeResult | null>): Promise<QuantityChangeResult> {
  const result = await promise;
  if (!result) throw new Error('Expected a real quantity change, but the call was a no-op.');
  return result;
}

beforeEach(async () => {
  await db.transaction('rw', db.items, db.transactions, db.itemTags, async () => {
    await db.items.clear();
    await db.transactions.clear();
    await db.itemTags.clear();
  });
});

describe('inventoryService', () => {
  it('creates an item with sane defaults', async () => {
    const item = await inventoryService.createItem({
      name: '  Mehl  ',
      categoryId: null,
      locationId: null,
      quantity: 4,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    expect(item.name).toBe('Mehl');
    expect(item.quantity).toBe(4);
    expect(item.isFavorite).toBe(false);
  });

  it('increments quantity by one and logs a purchase transaction', async () => {
    const item = await inventoryService.createItem({
      name: 'Zucker',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const { item: updated, transaction } = await expectChange(inventoryService.adjustQuantity(item.id, 1, 'purchase'));

    expect(updated.quantity).toBe(3);
    expect(transaction.previousQuantity).toBe(2);
    expect(transaction.newQuantity).toBe(3);
    expect(transaction.delta).toBe(1);
    expect(transaction.reason).toBe('purchase');

    const stored = await itemRepository.getById(item.id);
    expect(stored?.quantity).toBe(3);
  });

  it('decrements quantity by one and logs a consumption transaction', async () => {
    const item = await inventoryService.createItem({
      name: 'Waschmittel',
      categoryId: null,
      locationId: null,
      quantity: 3,
      unit: 'Flaschen',
      minimumQuantity: 1,
    });

    const { item: updated, transaction } = await expectChange(inventoryService.adjustQuantity(item.id, -1, 'consumption'));

    expect(updated.quantity).toBe(2);
    expect(transaction.reason).toBe('consumption');
  });

  it('never lets quantity go below zero', async () => {
    const item = await inventoryService.createItem({
      name: 'Spültabs',
      categoryId: null,
      locationId: null,
      quantity: 0,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const result = await inventoryService.adjustQuantity(item.id, -1, 'consumption');

    // Quantity stays clamped at 0, but no-op 0->0 changes must not be written at all
    // (see 2A-4: they carry no information and would pollute the transaction history).
    expect(result).toBeNull();
    expect((await itemRepository.getById(item.id))?.quantity).toBe(0);
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(0);
  });

  it('going from 1 to 0 still records exactly one real transaction', async () => {
    const item = await inventoryService.createItem({
      name: 'Butter',
      categoryId: null,
      locationId: null,
      quantity: 1,
      unit: 'Stk.',
      minimumQuantity: 1,
    });

    const { transaction } = await expectChange(inventoryService.adjustQuantity(item.id, -1, 'consumption'));
    expect(transaction.previousQuantity).toBe(1);
    expect(transaction.newQuantity).toBe(0);
    expect(transaction.delta).toBe(-1);
    expect((await itemRepository.getById(item.id))?.quantity).toBe(0);
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(1);
  });

  it('does not record a transaction when setQuantity is given the current value', async () => {
    const item = await inventoryService.createItem({
      name: 'Senf',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Gläser',
      minimumQuantity: 1,
    });

    const result = await inventoryService.setQuantity(item.id, 2);
    expect(result).toBeNull();
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(0);
  });

  it('supports direct quantity editing via setQuantity', async () => {
    const item = await inventoryService.createItem({
      name: 'Kaffee',
      categoryId: null,
      locationId: null,
      quantity: 1,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const { item: updated } = await expectChange(inventoryService.setQuantity(item.id, 10));
    expect(updated.quantity).toBe(10);
  });

  it('clamps a negative direct edit to zero', async () => {
    const item = await inventoryService.createItem({
      name: 'Tee',
      categoryId: null,
      locationId: null,
      quantity: 5,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const { item: updated } = await expectChange(inventoryService.setQuantity(item.id, -3));
    expect(updated.quantity).toBe(0);
  });

  it('records a transaction for every quantity change', async () => {
    const item = await inventoryService.createItem({
      name: 'Nudeln',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    await inventoryService.adjustQuantity(item.id, 1, 'purchase');
    await inventoryService.adjustQuantity(item.id, -1, 'consumption');

    const transactions = await transactionRepository.getByItemId(item.id);
    expect(transactions).toHaveLength(2);
  });

  it('undoes a transaction by restoring the previous quantity', async () => {
    const item = await inventoryService.createItem({
      name: 'Reis',
      categoryId: null,
      locationId: null,
      quantity: 5,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    const { transaction } = await expectChange(inventoryService.adjustQuantity(item.id, -1, 'consumption'));
    expect((await itemRepository.getById(item.id))?.quantity).toBe(4);

    const result = await inventoryService.undoTransaction(transaction.id);
    expect(result).toBe('undone');
    expect((await itemRepository.getById(item.id))?.quantity).toBe(5);

    const transactions = await transactionRepository.getByItemId(item.id);
    expect(transactions).toHaveLength(0);
  });

  it('rejects undo of a stale transaction without altering the current quantity', async () => {
    const item = await inventoryService.createItem({
      name: 'Zwiebeln',
      categoryId: null,
      locationId: null,
      quantity: 10,
      unit: 'Stk.',
      minimumQuantity: 1,
    });

    // 10 -> 9
    const { transaction: firstChange } = await expectChange(inventoryService.adjustQuantity(item.id, -1, 'consumption'));
    // 9 -> 8
    const { transaction: secondChange } = await expectChange(inventoryService.adjustQuantity(item.id, -1, 'consumption'));
    expect((await itemRepository.getById(item.id))?.quantity).toBe(8);

    // Undoing the older (now stale) transaction must be rejected, not silently apply
    // its previousQuantity=10 snapshot over the current, more recent state.
    const staleResult = await inventoryService.undoTransaction(firstChange.id);
    expect(staleResult).toBe('stale');
    expect((await itemRepository.getById(item.id))?.quantity).toBe(8);

    // Both transactions must still be intact - nothing was deleted or overwritten.
    const remaining = await transactionRepository.getByItemId(item.id);
    expect(remaining.map((t) => t.id).sort()).toEqual([firstChange.id, secondChange.id].sort());

    // The most recent transaction can still be undone normally.
    const undoResult = await inventoryService.undoTransaction(secondChange.id);
    expect(undoResult).toBe('undone');
    expect((await itemRepository.getById(item.id))?.quantity).toBe(9);
  });

  it('reports "not-found" when undoing a transaction that no longer exists', async () => {
    const result = await inventoryService.undoTransaction('does-not-exist');
    expect(result).toBe('not-found');
  });

  it('updates item fields without requiring more than a name', async () => {
    const item = await inventoryService.createItem({
      name: 'Honig',
      categoryId: null,
      locationId: null,
      quantity: 1,
      unit: 'Glas',
      minimumQuantity: 0,
    });

    await inventoryService.updateItem(item.id, { notes: 'Bio', minimumQuantity: 1 });
    const updated = await itemRepository.getById(item.id);
    expect(updated?.notes).toBe('Bio');
    expect(updated?.minimumQuantity).toBe(1);
    expect(updated?.name).toBe('Honig');
  });

  it('toggles favorite state', async () => {
    const item = await inventoryService.createItem({
      name: 'Dosentomaten',
      categoryId: null,
      locationId: null,
      quantity: 3,
      unit: 'Dosen',
      minimumQuantity: 1,
    });

    await inventoryService.toggleFavorite(item.id);
    expect((await itemRepository.getById(item.id))?.isFavorite).toBe(true);

    await inventoryService.toggleFavorite(item.id);
    expect((await itemRepository.getById(item.id))?.isFavorite).toBe(false);
  });

  it('deletes an item along with its transactions', async () => {
    const item = await inventoryService.createItem({
      name: 'Küchenrolle',
      categoryId: null,
      locationId: null,
      quantity: 8,
      unit: 'Packungen',
      minimumQuantity: 2,
    });
    await inventoryService.adjustQuantity(item.id, -1, 'consumption');

    await inventoryService.deleteItem(item.id);

    expect(await itemRepository.getById(item.id)).toBeUndefined();
    expect(await transactionRepository.getByItemId(item.id)).toHaveLength(0);
  });
});
