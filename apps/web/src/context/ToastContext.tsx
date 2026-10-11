import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Toast, type ToastVariant } from '../components/Toast';

interface ToastContextValue {
  readonly success: (message: string) => void;
  readonly error: (message: string) => void;
  readonly dismiss: () => void;
}

interface ToastNotification {
  readonly id: number;
  readonly variant: ToastVariant;
  readonly message: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const nextId = useRef(0);
  const dismiss = useCallback(() => setNotification(null), []);
  const show = useCallback((variant: ToastVariant, message: string) => {
    setNotification({ id: ++nextId.current, variant, message });
  }, []);
  const value = useMemo((): ToastContextValue => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
        {notification ? (
          <Toast
            key={notification.id}
            variant={notification.variant}
            message={notification.message}
            onClose={dismiss}
          />
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
