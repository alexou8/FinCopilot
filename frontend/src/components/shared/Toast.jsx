'use client';

import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Landmark,
  MessageSquare,
  ReceiptText,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const TOAST_META = {
  success: { icon: CheckCircle, color: '#4ade80' },
  error: { icon: AlertTriangle, color: '#fb7185' },
  chat: { icon: MessageSquare, color: '#7dd3fc' },
  income: { icon: Wallet, color: '#4ade80' },
  expenses: { icon: ReceiptText, color: '#fbbf24' },
  debt: { icon: CreditCard, color: '#fb7185' },
  accounts: { icon: Landmark, color: '#38bdf8' },
  decision: { icon: Target, color: '#2dd4bf' },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const meta = TOAST_META[toast.type] || TOAST_META.success;
        const Icon = meta.icon;

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '14px',
              background: '#1e293b',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              pointerEvents: 'auto',
              animation: 'toastSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} style={{ color: meta.color, flexShrink: 0 }} />
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '4px',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
