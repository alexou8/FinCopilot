'use client';

import { NeuCard } from '../shared/NeuCard';
import { Landmark } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
const typeEmoji = { chequing: '🏦', savings: '💵', tfsa: '📈', rrsp: '🏛️' };

export function AccountsCard({ accounts, updated }) {
  if (!accounts || accounts.length === 0) return null;
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accounts</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>{fmt(total)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {accounts.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{typeEmoji[a.type] || '💳'}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>{a.label}</span>
              {a.apy && <span style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>({a.apy}%)</span>}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{fmt(a.balance)}</span>
          </div>
        ))}
      </div>
    </NeuCard>
  );
}
