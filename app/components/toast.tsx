"use client";

import React from "react";

type Toast = { id: number; text: string; type?: 'success'|'error'|'info' };

export default function ToastHost() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  React.useEffect(() => {
    let nextId = 1;
    function onToast(e: Event) {
      const ce = e as CustomEvent<{ text: string; type?: 'success'|'error'|'info' }>
      const t: Toast = { id: nextId++, text: ce.detail?.text || '', type: ce.detail?.type || 'info' };
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    }
    window.addEventListener('app:toast', onToast as any);
    return () => window.removeEventListener('app:toast', onToast as any);
  }, []);
  return (
    <div style={{ position:'fixed', right: 16, bottom: 16, display:'grid', gap: 8, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ minWidth: 260, maxWidth: 420, padding: '10px 12px', borderRadius: 8, color: t.type==='error'?'#7f1d1d':'#065f46', background: t.type==='error'?'#fee2e2':'#ecfdf5', border: `1px solid ${t.type==='error'?'#fecaca':'#a7f3d0'}`, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
