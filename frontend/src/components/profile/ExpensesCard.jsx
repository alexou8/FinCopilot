'use client';

import { NeuCard } from '../shared/NeuCard';
import { TrendingDown } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export function ExpensesCard({ expenses, updated }) {
  if (!expenses) return null;
  const total = expenses.monthly;
  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
          <span style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expenses</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>
          {fmt(total)}<span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 400 }}>/mo</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {expenses.categories.map((c, i) => {
          const pct = Math.round((c.amount / total) * 100);
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>{c.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: 'var(--ink)' }}>{fmt(c.amount)}</span>
              </div>
              <div className="neu-inset-sm" style={{ height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', backgroundColor: c.color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </NeuCard>
  );
}
