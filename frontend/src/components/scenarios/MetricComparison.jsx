'use client';

import { NeuCard } from '../shared/NeuCard';
import { ArrowRight } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

const metricDefs = [
  { key: 'monthlySavings',      label: 'Monthly savings', format: fmt,            higherIsBetter: true  },
  { key: 'monthsToGoal',        label: 'Months to goal',  format: n => n + ' mo', higherIsBetter: false },
  { key: 'emergencyFundMonths', label: 'Emergency fund',  format: n => n + ' mo', higherIsBetter: true  },
  { key: 'monthlyInterestPaid', label: 'Interest/mo',     format: fmt,            higherIsBetter: false },
];

export function MetricComparison({ metrics }) {
  if (!metrics) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {metricDefs.map(({ key, label, format, higherIsBetter }) => {
        const cur  = metrics.current[key];
        const scen = metrics.scenario[key];
        const improved = higherIsBetter ? scen > cur : scen < cur;
        return (
          <NeuCard key={key} className="p-4">
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginBottom: '6px' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--ink-muted)', textDecoration: 'line-through' }}>{format(cur)}</span>
              <ArrowRight size={11} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '15px', fontWeight: 700, color: improved ? 'var(--success)' : 'var(--danger)' }}>{format(scen)}</span>
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}
