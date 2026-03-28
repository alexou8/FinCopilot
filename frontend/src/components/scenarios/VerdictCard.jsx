'use client';

import { NeuCard } from '../shared/NeuCard';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function VerdictCard({ verdict }) {
  if (!verdict) return null;
  const { feasible, headline, summary, recommendations } = verdict;
  const Icon  = feasible === true ? CheckCircle : feasible === false ? XCircle : AlertTriangle;
  const color = feasible === true ? 'var(--success)' : feasible === false ? 'var(--warning)' : 'var(--danger)';
  return (
    <NeuCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Icon size={20} style={{ color, flexShrink: 0 }} />
        <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '12px', color, lineHeight: 1.3 }}>{headline}</h3>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: recommendations && recommendations.length ? '12px' : 0 }}>{summary}</p>
      {recommendations && recommendations.length > 0 && (
        <div>
          <p style={{ fontFamily: 'Space Mono', fontSize: '10px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Recommended actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', fontFamily: 'DM Sans' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ color: 'var(--ink-muted)' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </NeuCard>
  );
}
