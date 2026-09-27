import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoToastProvider, useUndoToast } from '@/features/undo/UndoToastContext';
import { inventoryService } from '@/services/inventoryService';

function TriggerUndo() {
  const { showUndo } = useUndoToast();
  return (
    <button type="button" onClick={() => showUndo('Zwiebeln: 9 → 8 Stk.', 'tx-1')}>
      Menge ändern
    </button>
  );
}

function renderWithProvider() {
  return render(
    <UndoToastProvider>
      <TriggerUndo />
    </UndoToastProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UndoToastProvider - stale undo feedback', () => {
  it('shows the undo action and applies the change when the service confirms it', async () => {
    const undoSpy = vi.spyOn(inventoryService, 'undoTransaction').mockResolvedValue('undone');
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Menge ändern' }));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));

    expect(undoSpy).toHaveBeenCalledWith('tx-1');
  });

  it('shows a visible error toast when undo is rejected as stale', async () => {
    vi.spyOn(inventoryService, 'undoTransaction').mockResolvedValue('stale');
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Menge ändern' }));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));

    const toast = await screen.findByRole('status');
    expect(toast).toHaveTextContent('Rückgängig nicht möglich');
    expect(toast).toHaveTextContent('erneut geändert');
  });
});
