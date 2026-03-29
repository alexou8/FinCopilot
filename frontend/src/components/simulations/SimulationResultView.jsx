'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ComparisonChart } from '../scenarios/ComparisonChart';
import { MetricComparison } from '../scenarios/MetricComparison';
import { VerdictCard } from '../scenarios/VerdictCard';
import { useApp } from '../../context/AppContext';

function VerdictBadge({ feasible }) {
  if (feasible === true)
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,166,61,0.1)', color: 'var(--success)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans' }}>
        <CheckCircle size={12} /> Feasible
      </span>
    );
  if (feasible === false)
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,33,87,0.1)', color: 'var(--danger)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans' }}>
        <XCircle size={12} /> Not Feasible
      </span>
    );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(254,153,0,0.1)', color: 'var(--warning)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans' }}>
      <AlertCircle size={12} /> Risky
    </span>
  );
}

export function SimulationResultView({ simulation }) {
  const { profile } = useApp();
  if (!simulation) return null;
  const { prompt, scenarios, verdict, metrics, trajectories } = simulation;
  // Prefer the simulation-specific targetAmount (from the run's profile_data_before),
  // then fall back to global profile context
  const goalAmount = simulation.targetAmount ?? profile?.decision?.target_amount ?? profile?.goal?.targetAmount ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="neu-inset-sm" style={{ padding: '16px 18px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Simulation
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'DM Sans', lineHeight: 1.4 }}>
              {prompt}
            </p>
            {scenarios && (
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '4px' }}>
                {scenarios.baseline?.label} vs. {scenarios.alternative?.label}
              </p>
            )}
          </div>
          <VerdictBadge feasible={verdict?.feasible} />
        </div>
      </div>

      {/* Chart */}
      {trajectories && <ComparisonChart trajectories={trajectories} goalAmount={goalAmount} />}

      {/* Metrics */}
      {metrics && <MetricComparison metrics={metrics} />}

      {/* Verdict */}
      {verdict && <VerdictCard verdict={verdict} />}
    </div>
  );
}
