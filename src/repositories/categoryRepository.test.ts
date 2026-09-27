import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { categoryRepository } from '@/repositories/categoryRepository';
import { itemRepository } from '@/repositories/itemRepository';
import type { Category, Item } from '@/types/models';

beforeEach(async () => {
  await db.categories.clear();
  await db.items.clear();
});

function makeCategory(name: string, parentId: string | null = null): Category {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, icon: '📦', parentId, createdAt: now, updatedAt: now };
}

function makeItem(name: string, categoryId: string | null): Item {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    categoryId,
    locationId: null,
    quantity: 1,
    unit: 'Stk.',
    minimumQuantity: 0,
    isFavorite: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

describe('categoryRepository', () => {
  it('creates and retrieves a category', async () => {
    const category = makeCategory('Backen');
    await categoryRepository.create(category);
    expect(await categoryRepository.getById(category.id)).toEqual(category);
  });

  it('lists all categories', async () => {
    await categoryRepository.create(makeCategory('Backen'));
    await categoryRepository.create(makeCategory('Getränke'));
    expect(await categoryRepository.count()).toBe(2);
  });

  it('updates a category', async () => {
    const category = makeCategory('Backen');
    await categoryRepository.create(category);
    await categoryRepository.update(category.id, { name: 'Backwaren', icon: '🍞' });
    const updated = await categoryRepository.getById(category.id);
    expect(updated?.name).toBe('Backwaren');
    expect(updated?.icon).toBe('🍞');
  });

  it('deletes a category', async () => {
    const category = makeCategory('Backen');
    await categoryRepository.create(category);
    await categoryRepository.delete(category.id);
    expect(await categoryRepository.getById(category.id)).toBeUndefined();
  });

  it('supports user-defined categories alongside defaults', async () => {
    await categoryRepository.bulkPut([makeCategory('Backen'), makeCategory('Getränke')]);
    const custom = makeCategory('Haustier');
    await categoryRepository.create(custom);
    const all = await categoryRepository.getAll();
    expect(all.map((c) => c.name).sort()).toEqual(['Backen', 'Getränke', 'Haustier']);
  });

  it('clears categoryId on items that referenced a deleted category', async () => {
    const category = makeCategory('Backen');
    await categoryRepository.create(category);
    const item = makeItem('Mehl', category.id);
    await itemRepository.create(item);

    await categoryRepository.delete(category.id);

    const stored = await itemRepository.getById(item.id);
    expect(stored?.categoryId).toBeNull();
  });

  it('promotes subcategories to top-level when their parent category is deleted', async () => {
    const parent = makeCategory('Getränke');
    await categoryRepository.create(parent);
    const child = makeCategory('Alkoholfrei', parent.id);
    await categoryRepository.create(child);

    await categoryRepository.delete(parent.id);

    const storedChild = await categoryRepository.getById(child.id);
    expect(storedChild?.parentId).toBeNull();
  });

  it('does not touch items or categories unrelated to the deleted category', async () => {
    const deleted = makeCategory('Backen');
    const kept = makeCategory('Getränke');
    await categoryRepository.bulkPut([deleted, kept]);
    const unrelatedItem = makeItem('Cola', kept.id);
    await itemRepository.create(unrelatedItem);

    await categoryRepository.delete(deleted.id);

    expect(await categoryRepository.getById(kept.id)).toEqual(kept);
    expect((await itemRepository.getById(unrelatedItem.id))?.categoryId).toBe(kept.id);
  });
});
