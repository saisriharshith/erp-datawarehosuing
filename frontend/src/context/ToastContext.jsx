import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="shadow-lg rounded-3 p-3 text-white d-flex align-items-center justify-content-between"
          style={{
            pointerEvents: 'auto',
            background:
              t.type === 'success'
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : t.type === 'danger'
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                : t.type === 'warning'
                ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontSize: '0.85rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                t.type === 'success'
                  ? 'bi-check-circle-fill'
                  : t.type === 'danger'
                  ? 'bi-exclamation-octagon-fill'
                  : t.type === 'warning'
                  ? 'bi-exclamation-triangle-fill'
                  : 'bi-info-circle-fill'
              } fs-6`}
            ></i>
            <span className="fw-medium">{t.message}</span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white btn-sm ms-2"
            onClick={() => removeToast(t.id)}
            style={{ fontSize: '0.65rem' }}
          ></button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
