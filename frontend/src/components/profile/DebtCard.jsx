'use client';

import { NeuCard } from '../shared/NeuCard';
import { CreditCard } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export function DebtCard({ debt, updated }) {
  if (!debt || debt.length === 0) return null;
  const total = debt.reduce((s, d) => s + d.balance, 0);
  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} style={{ color: 'var(--warning)' }} />
          <span style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Debt</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '16px', fontWeight: 700, color: 'var(--warning)' }}>{fmt(total)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {debt.map(d => (
          <div key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'DM Sans' }}>{d.label}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: 'var(--ink)' }}>{fmt(d.balance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{d.interestRate}% APR</span>
              {d.minPayment > 0 && <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Min: {fmt(d.minPayment)}/mo</span>}
            </div>
            {d.note && <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: '3px', lineHeight: 1.4 }}>{d.note}</p>}
          </div>
        ))}
      </div>
    </NeuCard>
  );
}
