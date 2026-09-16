import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/database';
import { backupService } from '@/services/backupService';
import { inventoryService } from '@/services/inventoryService';
import { itemRepository } from '@/repositories/itemRepository';

beforeEach(async () => {
  await db.transaction('rw', [db.items, db.categories, db.locations, db.transactions, db.tags, db.itemTags], async () => {
    await Promise.all([
      db.items.clear(),
      db.categories.clear(),
      db.locations.clear(),
      db.transactions.clear(),
      db.tags.clear(),
      db.itemTags.clear(),
    ]);
  });
});

describe('backupService', () => {
  it('round-trips data through export and import', async () => {
    const item = await inventoryService.createItem({
      name: 'Mehl',
      categoryId: null,
      locationId: null,
      quantity: 4,
      unit: 'Packungen',
      minimumQuantity: 1,
    });
    await inventoryService.adjustQuantity(item.id, 1, 'purchase');

    const blob = await backupService.exportBackup();

    await itemRepository.delete(item.id);
    expect(await itemRepository.getById(item.id)).toBeUndefined();

    const analysis = await backupService.analyzeImportFile(blob);
    expect(analysis.valid).toBe(true);
    expect(analysis.counts.items).toBe(1);
    expect(analysis.conflicts.items).toBe(0);

    const result = await backupService.applyImport(analysis.backup!, 'skip');
    expect(result.imported.items).toBe(1);

    const restored = await itemRepository.getById(item.id);
    expect(restored?.name).toBe('Mehl');
    expect(restored?.quantity).toBe(5);
  });

  it('rejects a file without data.json', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('other.json', '{}');
    const blob = await zip.generateAsync({ type: 'blob' });

    const analysis = await backupService.analyzeImportFile(blob);
    expect(analysis.valid).toBe(false);
    expect(analysis.errors[0]).toMatch(/data\.json/);
  });

  it('rejects malformed schema data', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify({ schemaVersion: 1, exportedAt: Date.now(), data: { items: [{ id: 'x' }] } }));
    const blob = await zip.generateAsync({ type: 'blob' });

    const analysis = await backupService.analyzeImportFile(blob);
    expect(analysis.valid).toBe(false);
    expect(analysis.errors.length).toBeGreaterThan(0);
  });

  it('detects conflicts with existing records and respects the skip strategy', async () => {
    const item = await inventoryService.createItem({
      name: 'Zucker',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });
    const blob = await backupService.exportBackup();

    await inventoryService.updateItem(item.id, { name: 'Geändert' });

    const analysis = await backupService.analyzeImportFile(blob);
    expect(analysis.conflicts.items).toBe(1);

    const result = await backupService.applyImport(analysis.backup!, 'skip');
    expect(result.skipped.items).toBe(1);
    expect((await itemRepository.getById(item.id))?.name).toBe('Geändert');
  });

  it('overwrites existing records when the overwrite strategy is chosen', async () => {
    const item = await inventoryService.createItem({
      name: 'Zucker',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });
    const blob = await backupService.exportBackup();

    await inventoryService.updateItem(item.id, { name: 'Geändert' });

    const analysis = await backupService.analyzeImportFile(blob);
    const result = await backupService.applyImport(analysis.backup!, 'overwrite');
    expect(result.imported.items).toBe(1);
    expect((await itemRepository.getById(item.id))?.name).toBe('Zucker');
  });
});
