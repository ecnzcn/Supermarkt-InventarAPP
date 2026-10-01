/** Minimal slice of ServiceWorkerRegistration needed for update checks (keeps this testable). */
export interface UpdatableRegistration {
  installing: unknown;
  update: () => Promise<unknown>;
}

export interface UpdateCheckOptions {
  /** Periodic check while the app stays open. Default: 60 minutes. */
  intervalMs?: number;
  doc?: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
  isOnline?: () => boolean;
}

export const DEFAULT_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Asks the browser to look for a new service worker.
 *
 * Why this exists: an app installed on the iPhone home screen is usually *resumed* from the
 * background instead of being reloaded, so the browser never performs its normal
 * navigation-time update check – a new deployment would stay invisible until iOS happens
 * to kill the app. Checking on every return to the foreground (plus a slow interval while
 * the app stays open) makes new versions show up reliably.
 */
export async function checkForUpdate(
  registration: UpdatableRegistration,
  isOnline: () => boolean = () => navigator.onLine,
): Promise<void> {
  if (!isOnline() || registration.installing) return;
  try {
    await registration.update();
  } catch (error) {
    // Offline / flaky network: not an error for the user, the next check will retry.
    console.warn('Vorrat: Update-Prüfung fehlgeschlagen', error);
  }
}

/** Starts foreground + periodic update checks. Returns a cleanup function. */
export function startUpdateChecks(registration: UpdatableRegistration, options: UpdateCheckOptions = {}): () => void {
  const doc = options.doc ?? document;
  const isOnline = options.isOnline ?? (() => navigator.onLine);
  const intervalMs = options.intervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;

  const onVisibilityChange = () => {
    if (doc.visibilityState === 'visible') void checkForUpdate(registration, isOnline);
  };

  doc.addEventListener('visibilitychange', onVisibilityChange);
  const intervalId = setInterval(() => void checkForUpdate(registration, isOnline), intervalMs);

  return () => {
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    clearInterval(intervalId);
  };
}
