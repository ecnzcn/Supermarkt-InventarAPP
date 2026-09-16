import type { Category, InventoryTransaction, Item, ItemTag, Location, Tag } from '@/types/models';

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  items: Item[];
  categories: Category[];
  locations: Location[];
  transactions: InventoryTransaction[];
  tags: Tag[];
  itemTags: ItemTag[];
}

export interface BackupFile {
  schemaVersion: number;
  exportedAt: number;
  data: BackupData;
}

export interface ImportConflicts {
  items: number;
  categories: number;
  locations: number;
  transactions: number;
  tags: number;
  itemTags: number;
}

export interface ImportAnalysis {
  valid: boolean;
  errors: string[];
  counts: {
    items: number;
    categories: number;
    locations: number;
    transactions: number;
    tags: number;
    itemTags: number;
  };
  conflicts: ImportConflicts;
  backup: BackupFile | null;
}

export type ImportConflictStrategy = 'skip' | 'overwrite';

export interface ImportResult {
  imported: ImportConflicts;
  skipped: ImportConflicts;
}
