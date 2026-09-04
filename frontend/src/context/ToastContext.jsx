import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastContainer({ toasts = [], removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        pointerEvents: 'none'
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'danger' || toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const bg = isError ? '#ef4444' : isSuccess ? '#10b981' : isWarning ? '#f59e0b' : '#3b82f6';
        const icon = isError
          ? 'bi-exclamation-triangle-fill'
          : isSuccess
          ? 'bi-check-circle-fill'
          : isWarning
          ? 'bi-exclamation-circle-fill'
          : 'bi-info-circle-fill';

        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              backgroundColor: bg,
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              pointerEvents: 'auto',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`bi ${icon}`} style={{ fontSize: '1rem' }}></i>
              <span>{toast.message}</span>
            </div>
            {removeToast && (
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a safe fallback so calling addToast outside provider won't crash
    return {
      toasts: [],
      addToast: (msg, type) => console.log(`[TOAST:${type || 'info'}]`, msg),
      removeToast: () => {}
    };
  }
  return context;
}

export default ToastProvider;

