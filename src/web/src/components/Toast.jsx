import React from 'react';

/**
 * Toast Notification Component
 * Displays notifications with auto-dismiss
 */
export function Toast({ toasts = [] }) {
  const colors = {
    success: { bg: '#6B8E5A', border: 'rgba(107,142,90,0.3)', icon: '✓' },
    error: { bg: '#E86B3A', border: 'rgba(232,107,58,0.3)', icon: '⚠' },
    warning: { bg: '#D4A574', border: 'rgba(212,165,116,0.3)', icon: '!' },
    info: { bg: '#7B9FBE', border: 'rgba(123,159,190,0.3)', icon: 'ℹ' },
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => {
        const style = colors[toast.type] || colors.info;
        return (
          <div
            key={toast.id}
            style={{
              marginBottom: 12,
              padding: '12px 16px',
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: '#F2F0EB',
              maxWidth: 320,
              minWidth: 200,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out',
              pointerEvents: 'auto',
            }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{style.icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Toast Context and Provider for global state
 */
import { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children, toasts, showToast }) {
  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <Toast toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
