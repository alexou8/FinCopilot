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

function formatMetricValue(value, formatter) {
  if (value == null || Number.isNaN(value)) return '—';
  return formatter(value);
}

export function MetricComparison({ metrics }) {
  if (!metrics) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {metricDefs.map(({ key, label, format, higherIsBetter }) => {
        const cur  = metrics.current[key];
        const scen = metrics.scenario[key];
        const comparable = cur != null && scen != null && !Number.isNaN(cur) && !Number.isNaN(scen);
        const improved = comparable ? (higherIsBetter ? scen > cur : scen < cur) : null;
        return (
          <NeuCard key={key} className="p-4">
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginBottom: '6px' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--ink-muted)', textDecoration: cur == null ? 'none' : 'line-through' }}>
                {formatMetricValue(cur, format)}
              </span>
              <ArrowRight size={11} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: improved == null ? 'var(--ink-muted)' : improved ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {formatMetricValue(scen, format)}
              </span>
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}
