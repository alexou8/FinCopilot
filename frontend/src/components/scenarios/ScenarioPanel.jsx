'use client';

import { TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useScenario } from '../../hooks/useScenario';
import { ComparisonChart } from './ComparisonChart';
import { VerdictCard } from './VerdictCard';
import { MetricComparison } from './MetricComparison';
import { NeuButton } from '../shared/NeuButton';

export function ScenarioPanel() {
  const { scenario, setActivePanel } = useApp();
  const { loadDemo } = useScenario();
  if (!scenario) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '32px', textAlign: 'center' }}>
        <div className='neu-raised-lg' style={{ width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>No scenario yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '6px', fontFamily: 'DM Sans', maxWidth: '240px', lineHeight: 1.6 }}>Ask a what-if question in chat to see a comparison chart here.</p>
        </div>
        <NeuButton size='md' variant='primary' onClick={loadDemo}>Load demo scenario</NeuButton>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What-If Scenario</h2>
          <button onClick={() => setActivePanel('issues')} className='neu-btn' style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ink-muted)', padding: '6px 12px', borderRadius: '10px', fontFamily: 'DM Sans' }}>Back to Issues</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '5px', fontStyle: 'italic' }}>{scenario.title}</p>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ComparisonChart trajectories={scenario.trajectories} />
        <MetricComparison metrics={scenario.metrics} />
        <VerdictCard verdict={scenario.verdict} />
      </div>
    </div>
  );
}