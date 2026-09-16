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

  return {
    valid: true,
    errors: [],
    backup: {
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
    },
  };
}
