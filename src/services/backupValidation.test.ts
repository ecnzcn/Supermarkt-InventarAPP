import { describe, expect, it } from 'vitest';
import { validateBackupFile } from '@/services/backupValidation';
import { BACKUP_SCHEMA_VERSION, type BackupFile } from '@/services/backupTypes';

function baseBackup(): BackupFile {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    data: {
      items: [
        {
          id: 'item-1',
          name: 'Mehl',
          categoryId: 'cat-1',
          locationId: 'loc-1',
          quantity: 4,
          unit: 'Packungen',
          minimumQuantity: 1,
          isFavorite: false,
          notes: '',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      categories: [{ id: 'cat-1', name: 'Backen', icon: '🧁', parentId: null, createdAt: 0, updatedAt: 0 }],
      locations: [{ id: 'loc-1', name: 'Keller', parentId: null, createdAt: 0, updatedAt: 0 }],
      transactions: [
        { id: 'tx-1', itemId: 'item-1', delta: 1, previousQuantity: 3, newQuantity: 4, reason: 'purchase', timestamp: 0 },
      ],
      tags: [{ id: 'tag-1', name: 'bio' }],
      itemTags: [{ id: 'it-1', itemId: 'item-1', tagId: 'tag-1' }],
    },
  };
}

describe('validateBackupFile – semantic integrity', () => {
  it('accepts a fully valid, self-consistent backup', () => {
    const result = validateBackupFile(baseBackup());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.backup).not.toBeNull();
  });

  it('rejects an item referencing a non-existent category', () => {
    const backup = baseBackup();
    backup.data.items[0].categoryId = 'does-not-exist';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('categoryId') && e.includes('does-not-exist'))).toBe(true);
  });

  it('rejects an item referencing a non-existent location', () => {
    const backup = baseBackup();
    backup.data.items[0].locationId = 'does-not-exist';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('locationId') && e.includes('does-not-exist'))).toBe(true);
  });

  it('rejects a transaction referencing a non-existent item', () => {
    const backup = baseBackup();
    backup.data.transactions[0].itemId = 'ghost-item';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('itemId') && e.includes('ghost-item'))).toBe(true);
  });

  it('rejects an ItemTag referencing a non-existent item', () => {
    const backup = baseBackup();
    backup.data.itemTags[0].itemId = 'ghost-item';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('itemTags[0]') && e.includes('itemId'))).toBe(true);
  });

  it('rejects an ItemTag referencing a non-existent tag', () => {
    const backup = baseBackup();
    backup.data.itemTags[0].tagId = 'ghost-tag';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('itemTags[0]') && e.includes('tagId'))).toBe(true);
  });

  it('rejects a location with a non-existent parent', () => {
    const backup = baseBackup();
    backup.data.locations[0].parentId = 'ghost-location';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('locations[0]') && e.includes('parentId'))).toBe(true);
  });

  it('rejects a category with a non-existent parent', () => {
    const backup = baseBackup();
    backup.data.categories[0].parentId = 'ghost-category';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('categories[0]') && e.includes('parentId'))).toBe(true);
  });

  it('rejects a category hierarchy cycle', () => {
    const backup = baseBackup();
    backup.data.categories = [
      { id: 'a', name: 'A', icon: '📦', parentId: 'b', createdAt: 0, updatedAt: 0 },
      { id: 'b', name: 'B', icon: '📦', parentId: 'a', createdAt: 0, updatedAt: 0 },
    ];
    backup.data.items[0].categoryId = 'a';
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Hierarchiezyklus'))).toBe(true);
  });

  it('rejects a location hierarchy cycle (including self-reference)', () => {
    const backup = baseBackup();
    backup.data.locations = [{ id: 'loc-1', name: 'Keller', parentId: 'loc-1', createdAt: 0, updatedAt: 0 }];
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Hierarchiezyklus'))).toBe(true);
  });

  it('rejects a negative item quantity', () => {
    const backup = baseBackup();
    backup.data.items[0].quantity = -1;
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('quantity ist negativ'))).toBe(true);
  });

  it('rejects a negative minimumQuantity', () => {
    const backup = baseBackup();
    backup.data.items[0].minimumQuantity = -2;
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('minimumQuantity ist negativ'))).toBe(true);
  });

  it('rejects an inconsistent transaction (newQuantity - previousQuantity !== delta)', () => {
    const backup = baseBackup();
    backup.data.transactions[0] = { ...backup.data.transactions[0], previousQuantity: 3, newQuantity: 4, delta: 5 };
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('inkonsistent'))).toBe(true);
  });

  it('rejects a transaction with a negative previousQuantity or newQuantity', () => {
    const backup = baseBackup();
    backup.data.transactions[0] = { ...backup.data.transactions[0], previousQuantity: -1, newQuantity: 0, delta: 1 };
    const result = validateBackupFile(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('negative Bestandswerte'))).toBe(true);
  });
});
