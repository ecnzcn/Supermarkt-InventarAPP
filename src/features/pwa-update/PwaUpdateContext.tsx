import { createContext, useContext } from 'react';

export type ManualCheckResult = 'update-found' | 'up-to-date' | 'unavailable';

export interface PwaUpdateState {
  /** A new, already-downloaded version is waiting to take over. */
  needRefresh: boolean;
  /** Activates the waiting version; vite-plugin-pwa reloads the page once it controls it. */
  updateNow: () => Promise<void>;
  /** Hides the hint for this session; the waiting version is offered again on next start. */
  dismiss: () => void;
  /** Manual "Nach Updates suchen" from the settings. */
  checkNow: () => Promise<ManualCheckResult>;
}

const noop: PwaUpdateState = {
  needRefresh: false,
  updateNow: async () => undefined,
  dismiss: () => undefined,
  checkNow: async () => 'unavailable',
};

export const PwaUpdateContext = createContext<PwaUpdateState>(noop);

export function usePwaUpdateState(): PwaUpdateState {
  return useContext(PwaUpdateContext);
}
