import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';
import { PwaUpdateContext, type PwaUpdateState } from '@/features/pwa-update/PwaUpdateContext';
import { APP_BUILD, APP_VERSION } from '@/constants/appVersion';
import packageJson from '../../../package.json';

function renderSettings(checkNow: PwaUpdateState['checkNow']) {
  const value: PwaUpdateState = { needRefresh: false, updateNow: vi.fn(), dismiss: vi.fn(), checkNow };
  return render(
    <MemoryRouter>
      <PwaUpdateContext.Provider value={value}>
        <UndoToastProvider>
          <SettingsPage />
        </UndoToastProvider>
      </PwaUpdateContext.Provider>
    </MemoryRouter>,
  );
}

describe('SettingsPage – App-Version & Updates', () => {
  it('shows the version from package.json, not a hardcoded string', () => {
    renderSettings(vi.fn());
    expect(APP_VERSION).toBe(packageJson.version);
    expect(screen.getByText(`Version ${APP_VERSION} · Build ${APP_BUILD}`)).toBeInTheDocument();
  });

  it('reports "up to date" after a manual check', async () => {
    const checkNow = vi.fn().mockResolvedValue('up-to-date');
    renderSettings(checkNow);
    fireEvent.click(screen.getByRole('button', { name: 'Nach Updates suchen' }));
    expect(checkNow).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Vorrat ist auf dem neuesten Stand.')).toBeInTheDocument();
  });

  it('reports a found update after a manual check', async () => {
    renderSettings(vi.fn().mockResolvedValue('update-found'));
    fireEvent.click(screen.getByRole('button', { name: 'Nach Updates suchen' }));
    expect(await screen.findByText('Neue Version gefunden – sie wird geladen.')).toBeInTheDocument();
  });
});
