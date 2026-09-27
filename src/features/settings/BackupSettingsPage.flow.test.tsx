import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/db/database';
import { inventoryService } from '@/services/inventoryService';
import { itemRepository } from '@/repositories/itemRepository';
import { backupService } from '@/services/backupService';
import { BackupSettingsPage } from '@/features/settings/BackupSettingsPage';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';

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

function renderBackupPage() {
  return render(
    <MemoryRouter>
      <UndoToastProvider>
        <BackupSettingsPage />
      </UndoToastProvider>
    </MemoryRouter>,
  );
}

/**
 * Flow C - Backup-Konflikt "Skip":
 * bestehende Daten -> Backup importieren -> Konfliktstrategie "Skip" (Standard)
 * -> bestehende Daten bleiben unverändert.
 */
describe('Flow C - Backup-Import mit Konfliktstrategie Skip', () => {
  it('keeps the current item untouched when the imported copy conflicts and skip is chosen', async () => {
    const item = await inventoryService.createItem({
      name: 'Zucker',
      categoryId: null,
      locationId: null,
      quantity: 2,
      unit: 'Packungen',
      minimumQuantity: 1,
    });

    // Snapshot the current (valid) state as a backup file, then diverge the live data
    // so the backup's copy of this item conflicts with what's now in the database.
    const backupBlob = await backupService.exportBackup();
    await inventoryService.updateItem(item.id, { name: 'Zucker (bearbeitet)' });

    const backupFile = new File([backupBlob], 'Vorrat-Backup-test.zip', { type: 'application/zip' });
    const user = userEvent.setup();
    renderBackupPage();

    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) throw new Error('file input not found');
    await user.upload(fileInput as HTMLInputElement, backupFile);

    await screen.findByText('Vorschau');
    // Skip is the pre-selected default conflict strategy - no interaction needed to select it.
    expect(screen.getByLabelText('Vorhandene Einträge mit gleicher ID')).toHaveValue('skip');

    await user.click(screen.getByRole('button', { name: 'Import bestätigen' }));
    await screen.findByText('Import abgeschlossen');

    const current = await itemRepository.getById(item.id);
    expect(current?.name).toBe('Zucker (bearbeitet)');
  });
});
