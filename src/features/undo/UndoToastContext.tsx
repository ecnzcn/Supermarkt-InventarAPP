import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { inventoryService } from '@/services/inventoryService';

interface ToastState {
  id: number;
  message: string;
  tone: 'default' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showUndo: (message: string, transactionId: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((next: Omit<ToastState, 'id'>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    idRef.current += 1;
    setToast({ ...next, id: idRef.current });
    timeoutRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
  }, [dismiss]);

  const showUndo = useCallback((message: string, transactionId: string) => {
    showToast({
      message,
      tone: 'default',
      actionLabel: 'Rückgängig',
      onAction: () => {
        inventoryService.undoTransaction(transactionId).catch((error) => {
          console.error('Rückgängig machen fehlgeschlagen', error);
        });
      },
    });
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast({ message, tone: 'error' });
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast({ message, tone: 'default' });
  }, [showToast]);

  const value = useMemo(() => ({ showUndo, showError, showInfo }), [showUndo, showError, showInfo]);

  const handleAction = () => {
    toast?.onAction?.();
    dismiss();
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.tone}`} role="status">
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button type="button" className="toast__action" onClick={handleAction}>
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useUndoToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useUndoToast must be used within UndoToastProvider');
  return ctx;
}
