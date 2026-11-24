import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ToastItem } from '../types';

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  liveAnnouncement: string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        dismissToast(id);
      }, DEFAULT_DURATION);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  const pauseToast = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
  }, []);

  const resumeToast = useCallback(
    (id: string) => {
      scheduleDismiss(id);
    },
    [scheduleDismiss]
  );

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, text, type }]);
      scheduleDismiss(id);

      // Announce via native ariaNotify() when available, otherwise via live region fallback
      const docWithAriaNotify = document as Document & {
        ariaNotify?: (message: string, options?: { priority?: 'normal' | 'high' }) => void;
      };
      if (typeof docWithAriaNotify.ariaNotify === 'function') {
        docWithAriaNotify.ariaNotify(text, { priority: type === 'error' ? 'high' : 'normal' });
      } else {
        setLiveAnnouncement('');
        requestAnimationFrame(() => setLiveAnnouncement(text));
      }
    },
    [scheduleDismiss]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        pauseToast,
        resumeToast,
        liveAnnouncement
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
