'use client';
import React, { useEffect } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const TYPE_STYLES = {
  success: { bg: 'rgba(16,185,129,0.14)',  border: 'rgba(16,185,129,0.35)', icon: '✅' },
  error:   { bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.35)',  icon: '❌' },
  info:    { bg: 'rgba(124,58,237,0.14)',  border: 'rgba(124,58,237,0.35)', icon: '💡' },
};

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const s = TYPE_STYLES[toast.type];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 16px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: 260, maxWidth: 360,
      animation: 'toastSlideIn 0.25s ease',
      fontSize: '0.83rem', lineHeight: 1.5,
      color: '#f1f5f9',
      fontFamily: 'Inter, sans-serif',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onDismiss} style={{
        background: 'transparent', border: 'none', color: '#475569',
        cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px',
        flexShrink: 0, lineHeight: 1,
      }}>✕</button>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column-reverse', gap: 8,
      pointerEvents: 'all',
    }}>
      {toasts.map(t => (
        <SingleToast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
