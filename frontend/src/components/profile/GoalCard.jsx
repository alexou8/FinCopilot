'use client';

import { NeuCard } from '../shared/NeuCard';
import { NeuProgressBar } from '../shared/NeuProgressBar';
import { Target } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

export function GoalCard({ goal, updated }) {
  if (!goal) return null;
  const onTrack = goal.currentMonthlySavings >= goal.monthlySavingsNeeded;
  const color = onTrack ? 'success' : goal.projectedMonths > goal.monthsAway * 2 ? 'danger' : 'warning';
  return (
    <NeuCard updated={updated}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Target size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal</span>
      </div>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '6px' }}>{goal.label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '10px' }}>
        <span>{fmt(goal.currentAmount)} saved</span>
        <span>Target: {fmt(goal.targetAmount)}</span>
      </div>
      <NeuProgressBar value={goal.currentAmount} max={goal.targetAmount} color={color} showPercent />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Saving</p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: 700, color: onTrack ? 'var(--success)' : 'var(--warning)' }}>{fmt(goal.currentMonthlySavings)}/mo</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Need</p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{fmt(goal.monthlySavingsNeeded)}/mo</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Est. time</p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', fontWeight: 700, color: goal.projectedMonths > goal.monthsAway ? 'var(--danger)' : 'var(--success)' }}>{goal.projectedMonths} mo</p>
        </div>
      </div>
    </NeuCard>
  );
}
