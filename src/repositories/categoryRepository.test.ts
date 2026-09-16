import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { categoryRepository } from '@/repositories/categoryRepository';
import type { Category } from '@/types/models';

beforeEach(async () => {
  await db.categories.clear();
});

function makeCategory(name: string): Category {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, icon: '📦', parentId: null, createdAt: now, updatedAt: now };
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
});
