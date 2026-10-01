import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkForUpdate, startUpdateChecks } from './updateChecks';

function fakeDoc() {
  const target = new EventTarget();
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  return { doc, fire: () => target.dispatchEvent(new Event('visibilitychange')) };
}

describe('checkForUpdate', () => {
  it('asks the registration for an update when online', async () => {
    const reg = { installing: null, update: vi.fn().mockResolvedValue(undefined) };
    await checkForUpdate(reg, () => true);
    expect(reg.update).toHaveBeenCalledTimes(1);
  });

  it('skips the check when offline or while a worker is already installing', async () => {
    const offline = { installing: null, update: vi.fn() };
    await checkForUpdate(offline, () => false);
    const busy = { installing: {}, update: vi.fn() };
    await checkForUpdate(busy, () => true);
    expect(offline.update).not.toHaveBeenCalled();
    expect(busy.update).not.toHaveBeenCalled();
  });

  it('never throws on network errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reg = { installing: null, update: vi.fn().mockRejectedValue(new Error('offline')) };
    await expect(checkForUpdate(reg, () => true)).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe('startUpdateChecks', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('checks when the app returns to the foreground (iOS resume)', () => {
    const { doc, fire } = fakeDoc();
    const reg = { installing: null, update: vi.fn().mockResolvedValue(undefined) };
    startUpdateChecks(reg, { doc, isOnline: () => true });

    doc.visibilityState = 'hidden';
    fire();
    expect(reg.update).not.toHaveBeenCalled();

    doc.visibilityState = 'visible';
    fire();
    expect(reg.update).toHaveBeenCalledTimes(1);
  });

  it('checks periodically and stops after cleanup', () => {
    const { doc, fire } = fakeDoc();
    const reg = { installing: null, update: vi.fn().mockResolvedValue(undefined) };
    const stop = startUpdateChecks(reg, { doc, isOnline: () => true, intervalMs: 1000 });

    vi.advanceTimersByTime(2500);
    expect(reg.update).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(5000);
    fire();
    expect(reg.update).toHaveBeenCalledTimes(2);
  });
});
