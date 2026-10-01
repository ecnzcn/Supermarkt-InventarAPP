import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PwaUpdateBanner } from './PwaUpdateBanner';

describe('PwaUpdateBanner', () => {
  it('renders nothing when no update is waiting', () => {
    const { container } = render(<PwaUpdateBanner needRefresh={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the hint with both actions when an update is waiting', () => {
    render(<PwaUpdateBanner needRefresh onUpdate={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Neue Version verfügbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktualisieren' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Später' })).toBeInTheDocument();
    expect(screen.getAllByText('Neue Version verfügbar')).toHaveLength(1);
  });

  it('"Später" only dismisses', () => {
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();
    render(<PwaUpdateBanner needRefresh onUpdate={onUpdate} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('"Aktualisieren" triggers the update and shows a busy state', async () => {
    const onUpdate = vi.fn(() => new Promise<void>(() => undefined));
    render(<PwaUpdateBanner needRefresh onUpdate={onUpdate} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Vorrat wird aktualisiert …')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lädt …' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Später' })).toBeDisabled();
  });

  it('re-enables the buttons if the update fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onUpdate = vi.fn(() => Promise.reject(new Error('boom')));
    render(<PwaUpdateBanner needRefresh onUpdate={onUpdate} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(await screen.findByRole('button', { name: 'Aktualisieren' })).toBeEnabled();
    error.mockRestore();
  });
});
