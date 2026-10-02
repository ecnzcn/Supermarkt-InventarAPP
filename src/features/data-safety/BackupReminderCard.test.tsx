import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackupReminderCard } from './BackupReminderCard';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';
import { DAY_MS, backupReminderStore } from '@/services/dataSafetyService';

const NOW = Date.UTC(2026, 9, 2, 12);
const renderCard = (itemCount = 5) =>
  render(<UndoToastProvider><BackupReminderCard itemCount={itemCount} now={NOW} /></UndoToastProvider>);

describe('BackupReminderCard', () => {
  beforeEach(() => localStorage.clear());

  it('asks for a first backup', () => {
    renderCard();
    expect(screen.getByText('Zeit für eine Sicherung')).toBeInTheDocument();
    expect(screen.getByText(/noch keine Sicherung erstellt/)).toBeInTheDocument();
  });

  it('shows how long ago the last backup was', () => {
    backupReminderStore.markBackedUp(NOW - 20 * DAY_MS);
    renderCard();
    expect(screen.getByText(/Letzte Sicherung vor 20 Tagen/)).toBeInTheDocument();
  });

  it('stays hidden after a recent backup or without items', () => {
    backupReminderStore.markBackedUp(NOW - 2 * DAY_MS);
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
    act(() => backupReminderStore.markBackedUp(NOW - 30 * DAY_MS));
    expect(screen.getByText('Zeit für eine Sicherung')).toBeInTheDocument();
  });

  it('"Später" hides the reminder', async () => {
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(screen.queryByText('Zeit für eine Sicherung')).not.toBeInTheDocument();
  });
});
