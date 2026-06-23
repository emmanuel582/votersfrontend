import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.toast;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${++idRef.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const colorMap: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'var(--color-success)', text: 'var(--color-success-text)' },
    error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'var(--color-error)', text: 'var(--color-error-text)' },
    info: { bg: 'rgba(212, 175, 55, 0.12)', border: 'var(--color-gold)', text: 'var(--color-gold)' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'var(--color-warning)', text: 'var(--color-warning-text)' },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container - Top Right */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: 'min(380px, calc(100vw - 32px))',
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: colorMap[t.type].bg,
              border: `1px solid ${colorMap[t.type].border}`,
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(12px)',
              animation: 'toastSlideIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: colorMap[t.type].border,
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {iconMap[t.type]}
            </span>
            <span style={{
              color: colorMap[t.type].text,
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.4,
            }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
