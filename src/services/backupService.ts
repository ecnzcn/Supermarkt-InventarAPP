import JSZip from 'jszip';
import type { Table } from 'dexie';
import { db } from '@/db/database';
import { itemRepository } from '@/repositories/itemRepository';
import { categoryRepository } from '@/repositories/categoryRepository';
import { locationRepository } from '@/repositories/locationRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { tagRepository } from '@/repositories/tagRepository';
import { validateBackupFile } from '@/services/backupValidation';
import {
  BACKUP_SCHEMA_VERSION,
  type BackupFile,
  type ImportAnalysis,
  type ImportConflictStrategy,
  type ImportConflicts,
  type ImportResult,
} from '@/services/backupTypes';

export function getBackupFilename(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return `Vorrat-Backup-${iso}.zip`;
}

export const backupService = {
  async buildBackupFile(): Promise<BackupFile> {
    const [items, categories, locations, transactions, tags, itemTags] = await Promise.all([
      itemRepository.getAll(),
      categoryRepository.getAll(),
      locationRepository.getAll(),
      transactionRepository.getAll(),
      tagRepository.getAll(),
      db.itemTags.toArray(),
    ]);

    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: Date.now(),
      data: { items, categories, locations, transactions, tags, itemTags },
    };
  },

  async exportBackup(): Promise<Blob> {
    const backup = await this.buildBackupFile();
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify(backup, null, 2));
    return zip.generateAsync({ type: 'blob' });
  },

  async analyzeImportFile(file: File | Blob): Promise<ImportAnalysis> {
    const emptyCounts: ImportConflicts = { items: 0, categories: 0, locations: 0, transactions: 0, tags: 0, itemTags: 0 };

    let parsed: unknown;
    try {
      const zip = await JSZip.loadAsync(file);
      const entry = zip.file('data.json');
      if (!entry) {
        return { valid: false, errors: ['Die Datei enthält keine data.json.'], counts: emptyCounts, conflicts: emptyCounts, backup: null };
      }
      const text = await entry.async('string');
      parsed = JSON.parse(text);
    } catch (error) {
      return {
        valid: false,
        errors: [`Datei konnte nicht gelesen werden: ${error instanceof Error ? error.message : String(error)}`],
        counts: emptyCounts,
        conflicts: emptyCounts,
        backup: null,
      };
    }

    const { valid, errors, backup } = validateBackupFile(parsed);
    if (!valid || !backup) {
      return { valid: false, errors, counts: emptyCounts, conflicts: emptyCounts, backup: null };
    }

    const [existingItemIds, existingCategoryIds, existingLocationIds, existingTransactionIds, existingTagIds, existingItemTagIds] =
      await Promise.all([
        db.items.toCollection().primaryKeys(),
        db.categories.toCollection().primaryKeys(),
        db.locations.toCollection().primaryKeys(),
        db.transactions.toCollection().primaryKeys(),
        db.tags.toCollection().primaryKeys(),
        db.itemTags.toCollection().primaryKeys(),
      ]);

    const asSet = (keys: unknown[]) => new Set(keys as string[]);
    const itemIdSet = asSet(existingItemIds);
    const categoryIdSet = asSet(existingCategoryIds);
    const locationIdSet = asSet(existingLocationIds);
    const transactionIdSet = asSet(existingTransactionIds);
    const tagIdSet = asSet(existingTagIds);
    const itemTagIdSet = asSet(existingItemTagIds);

    const conflicts: ImportConflicts = {
      items: backup.data.items.filter((i) => itemIdSet.has(i.id)).length,
      categories: backup.data.categories.filter((c) => categoryIdSet.has(c.id)).length,
      locations: backup.data.locations.filter((l) => locationIdSet.has(l.id)).length,
      transactions: backup.data.transactions.filter((t) => transactionIdSet.has(t.id)).length,
      tags: backup.data.tags.filter((t) => tagIdSet.has(t.id)).length,
      itemTags: backup.data.itemTags.filter((it) => itemTagIdSet.has(it.id)).length,
    };

    return {
      valid: true,
      errors: [],
      counts: {
        items: backup.data.items.length,
        categories: backup.data.categories.length,
        locations: backup.data.locations.length,
        transactions: backup.data.transactions.length,
        tags: backup.data.tags.length,
        itemTags: backup.data.itemTags.length,
      },
      conflicts,
      backup,
    };
  },

  async applyImport(backup: BackupFile, strategy: ImportConflictStrategy): Promise<ImportResult> {
    const imported: ImportConflicts = { items: 0, categories: 0, locations: 0, transactions: 0, tags: 0, itemTags: 0 };
    const skipped: ImportConflicts = { items: 0, categories: 0, locations: 0, transactions: 0, tags: 0, itemTags: 0 };

    async function importTable<T extends { id: string }>(table: Table<T, string>, records: T[], name: keyof ImportConflicts) {
      for (const record of records) {
        const existing = await table.get(record.id);
        if (existing && strategy === 'skip') {
          skipped[name] += 1;
          continue;
        }
        await table.put(record);
        imported[name] += 1;
      }
    }

    await db.transaction('rw', [db.items, db.categories, db.locations, db.transactions, db.tags, db.itemTags], async () => {
      await importTable(db.categories, backup.data.categories, 'categories');
      await importTable(db.locations, backup.data.locations, 'locations');
      await importTable(db.items, backup.data.items, 'items');
      await importTable(db.tags, backup.data.tags, 'tags');
      await importTable(db.itemTags, backup.data.itemTags, 'itemTags');
      await importTable(db.transactions, backup.data.transactions, 'transactions');
    });

    return { imported, skipped };
  },
};
