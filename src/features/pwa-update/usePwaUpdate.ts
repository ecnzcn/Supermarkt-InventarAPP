import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { checkForUpdate, startUpdateChecks } from './updateChecks';
import type { ManualCheckResult, PwaUpdateState } from './PwaUpdateContext';

/**
 * The only place that imports vite-plugin-pwa's virtual module and registers the service
 * worker. Must be called exactly once (see PwaUpdateRoot in App.tsx). Everything else
 * (banner, settings) consumes the resulting state via PwaUpdateContext, so it can be
 * tested with plain values.
 */
export function usePwaUpdate(): PwaUpdateState {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const stopChecksRef = useRef<(() => void) | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      stopChecksRef.current?.();
      stopChecksRef.current = startUpdateChecks(registration);
    },
    onRegisterError(error) {
      console.error('Vorrat: Service Worker konnte nicht registriert werden', error);
    },
  });

  useEffect(() => () => stopChecksRef.current?.(), []);

  const checkNow = useCallback(async (): Promise<ManualCheckResult> => {
    const registration = registrationRef.current;
    if (!registration) return 'unavailable';
    if (registration.waiting) {
      setNeedRefresh(true);
      return 'update-found';
    }
    await checkForUpdate(registration);
    return registration.installing || registration.waiting ? 'update-found' : 'up-to-date';
  }, [setNeedRefresh]);

  return {
    needRefresh,
    updateNow: () => updateServiceWorker(true),
    dismiss: () => setNeedRefresh(false),
    checkNow,
  };
}
