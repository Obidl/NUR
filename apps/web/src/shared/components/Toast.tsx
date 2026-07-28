import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '@/shared/lib/cx';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cx(
                'pointer-events-auto flex max-w-md items-center gap-3 rounded-[var(--radius-pill)] border border-nur-line bg-nur-elevated px-4 py-3 text-nur-ink shadow-[var(--shadow-sm)]',
                item.tone === 'success' && 'border-nur-accent/20',
                item.tone === 'error' && 'border-[var(--nur-danger)]/35',
              )}
            >
              <p className="min-w-0 flex-1 text-sm leading-relaxed">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-full p-1 text-nur-faint transition-colors hover:bg-nur-elevated hover:text-nur-ink"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
