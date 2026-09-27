import { BACKUP_SCHEMA_VERSION, type BackupFile } from '@/services/backupTypes';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}
function isNullableString(v: unknown): v is string | null {
  return v === null || isString(v);
}

function validateItem(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`items[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.name), 'name'],
    [isNullableString(r.categoryId), 'categoryId'],
    [isNullableString(r.locationId), 'locationId'],
    [isNumber(r.quantity), 'quantity'],
    [isString(r.unit), 'unit'],
    [isNumber(r.minimumQuantity), 'minimumQuantity'],
    [isBoolean(r.isFavorite), 'isFavorite'],
    [isString(r.notes), 'notes'],
    [isNumber(r.createdAt), 'createdAt'],
    [isNumber(r.updatedAt), 'updatedAt'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`items[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

function validateCategory(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`categories[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.name), 'name'],
    [isString(r.icon), 'icon'],
    [isNullableString(r.parentId), 'parentId'],
    [isNumber(r.createdAt), 'createdAt'],
    [isNumber(r.updatedAt), 'updatedAt'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`categories[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

function validateLocation(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`locations[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.name), 'name'],
    [isNullableString(r.parentId), 'parentId'],
    [isNumber(r.createdAt), 'createdAt'],
    [isNumber(r.updatedAt), 'updatedAt'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`locations[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

function validateTransaction(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`transactions[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const validReason = r.reason === 'purchase' || r.reason === 'consumption' || r.reason === 'adjustment';
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.itemId), 'itemId'],
    [isNumber(r.delta), 'delta'],
    [isNumber(r.previousQuantity), 'previousQuantity'],
    [isNumber(r.newQuantity), 'newQuantity'],
    [validReason, 'reason'],
    [isNumber(r.timestamp), 'timestamp'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`transactions[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

function validateTag(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`tags[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.name), 'name'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`tags[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

function validateItemTag(record: unknown, index: number, errors: string[]): boolean {
  if (typeof record !== 'object' || record === null) {
    errors.push(`itemTags[${index}]: kein gültiges Objekt`);
    return false;
  }
  const r = record as Record<string, unknown>;
  const checks: [boolean, string][] = [
    [isString(r.id), 'id'],
    [isString(r.itemId), 'itemId'],
    [isString(r.tagId), 'tagId'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, field]) => field);
  if (failed.length > 0) {
    errors.push(`itemTags[${index}]: ungültige Felder (${failed.join(', ')})`);
    return false;
  }
  return true;
}

const QUANTITY_EPSILON = 1e-6;

interface HierarchyNode {
  id: string;
  parentId: string | null;
}

/** True if following `parentId` from `startId` ever revisits a node, including self-reference. */
function isInCycle(byId: Map<string, HierarchyNode>, startId: string): boolean {
  const visited = new Set<string>([startId]);
  let currentId: string | null = byId.get(startId)?.parentId ?? null;
  while (currentId !== null) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    currentId = byId.get(currentId)?.parentId ?? null;
  }
  return false;
}

/**
 * Checks referential integrity, value ranges, transaction consistency and hierarchy
 * cycles across an already structurally-valid backup. Runs after `validateBackupFile`'s
 * per-record shape checks, so every field here is already known to have the right type.
 */
function validateBackupSemantics(backup: BackupFile): string[] {
  const errors: string[] = [];
  const { items, categories, locations, transactions, tags, itemTags } = backup.data;

  const itemIds = new Set(items.map((i) => i.id));
  const categoryIds = new Set(categories.map((c) => c.id));
  const locationIds = new Set(locations.map((l) => l.id));
  const tagIds = new Set(tags.map((t) => t.id));

  // Referenzen
  items.forEach((item, index) => {
    if (item.categoryId !== null && !categoryIds.has(item.categoryId)) {
      errors.push(`items[${index}] (${item.name}): categoryId "${item.categoryId}" existiert nicht.`);
    }
    if (item.locationId !== null && !locationIds.has(item.locationId)) {
      errors.push(`items[${index}] (${item.name}): locationId "${item.locationId}" existiert nicht.`);
    }
    // Werte
    if (item.quantity < 0) {
      errors.push(`items[${index}] (${item.name}): quantity ist negativ (${item.quantity}).`);
    }
    if (item.minimumQuantity < 0) {
      errors.push(`items[${index}] (${item.name}): minimumQuantity ist negativ (${item.minimumQuantity}).`);
    }
  });

  transactions.forEach((tx, index) => {
    if (!itemIds.has(tx.itemId)) {
      errors.push(`transactions[${index}]: itemId "${tx.itemId}" existiert nicht.`);
    }
    if (tx.previousQuantity < 0 || tx.newQuantity < 0) {
      errors.push(`transactions[${index}]: negative Bestandswerte (previousQuantity=${tx.previousQuantity}, newQuantity=${tx.newQuantity}).`);
    }
    if (Math.abs(tx.newQuantity - tx.previousQuantity - tx.delta) > QUANTITY_EPSILON) {
      errors.push(
        `transactions[${index}]: inkonsistent – newQuantity (${tx.newQuantity}) - previousQuantity (${tx.previousQuantity}) ≠ delta (${tx.delta}).`,
      );
    }
  });

  itemTags.forEach((link, index) => {
    if (!itemIds.has(link.itemId)) {
      errors.push(`itemTags[${index}]: itemId "${link.itemId}" existiert nicht.`);
    }
    if (!tagIds.has(link.tagId)) {
      errors.push(`itemTags[${index}]: tagId "${link.tagId}" existiert nicht.`);
    }
  });

  // Hierarchien: Parent muss existieren, keine Zyklen
  const categoryById = new Map<string, HierarchyNode>(categories.map((c) => [c.id, c]));
  categories.forEach((category, index) => {
    if (category.parentId !== null && !categoryIds.has(category.parentId)) {
      errors.push(`categories[${index}] (${category.name}): parentId "${category.parentId}" existiert nicht.`);
    } else if (isInCycle(categoryById, category.id)) {
      errors.push(`categories[${index}] (${category.name}): Hierarchiezyklus erkannt.`);
    }
  });

  const locationById = new Map<string, HierarchyNode>(locations.map((l) => [l.id, l]));
  locations.forEach((location, index) => {
    if (location.parentId !== null && !locationIds.has(location.parentId)) {
      errors.push(`locations[${index}] (${location.name}): parentId "${location.parentId}" existiert nicht.`);
    } else if (isInCycle(locationById, location.id)) {
      errors.push(`locations[${index}] (${location.name}): Hierarchiezyklus erkannt.`);
    }
  });

  return errors;
}

export function validateBackupFile(parsed: unknown): { valid: boolean; errors: string[]; backup: BackupFile | null } {
  const errors: string[] = [];

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, errors: ['Datei enthält kein gültiges JSON-Objekt.'], backup: null };
  }

  const root = parsed as Record<string, unknown>;

  if (!isNumber(root.schemaVersion)) {
    errors.push('Fehlendes oder ungültiges Feld "schemaVersion".');
  } else if (root.schemaVersion > BACKUP_SCHEMA_VERSION) {
    errors.push(`Backup wurde mit einer neueren App-Version erstellt (Schema ${root.schemaVersion}).`);
  }

  if (!isNumber(root.exportedAt)) {
    errors.push('Fehlendes oder ungültiges Feld "exportedAt".');
  }

  const data = root.data;
  if (typeof data !== 'object' || data === null) {
    errors.push('Fehlendes Feld "data".');
    return { valid: false, errors, backup: null };
  }

  const d = data as Record<string, unknown>;
  const tables: [string, unknown, (r: unknown, i: number, e: string[]) => boolean][] = [
    ['items', d.items, validateItem],
    ['categories', d.categories, validateCategory],
    ['locations', d.locations, validateLocation],
    ['transactions', d.transactions, validateTransaction],
    ['tags', d.tags, validateTag],
    ['itemTags', d.itemTags, validateItemTag],
  ];

  for (const [name, value, validator] of tables) {
    if (!Array.isArray(value)) {
      errors.push(`Feld "${name}" fehlt oder ist kein Array.`);
      continue;
    }
    value.forEach((record, index) => validator(record, index, errors));
  }

  if (errors.length > 0) {
    return { valid: false, errors, backup: null };
  }

  const backup: BackupFile = {
    schemaVersion: root.schemaVersion as number,
    exportedAt: root.exportedAt as number,
    data: {
      items: d.items as BackupFile['data']['items'],
      categories: d.categories as BackupFile['data']['categories'],
      locations: d.locations as BackupFile['data']['locations'],
      transactions: d.transactions as BackupFile['data']['transactions'],
      tags: d.tags as BackupFile['data']['tags'],
      itemTags: d.itemTags as BackupFile['data']['itemTags'],
    },
  };

  const semanticErrors = validateBackupSemantics(backup);
  if (semanticErrors.length > 0) {
    return { valid: false, errors: semanticErrors, backup: null };
  }

  return { valid: true, errors: [], backup };
}
