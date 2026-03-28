'use client';

import { NeuCard } from '../shared/NeuCard';
import { TrendingUp } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export function IncomeCard({ income, updated }) {
  if (!income) return null;
  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          <span style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Income</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>
          {fmt(income.monthly)}<span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 400 }}>/mo</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {income.sources.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>{s.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{fmt(s.amount)}</span>
          </div>
        ))}
      </div>
    </NeuCard>
  );
}
