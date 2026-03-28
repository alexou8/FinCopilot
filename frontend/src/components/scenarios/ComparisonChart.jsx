'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const fmtY = n => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="neu-raised-sm" style={{ padding: '10px 14px', background: 'var(--surface)', minWidth: '150px' }}>
      <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '11px', color: 'var(--ink)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', fontSize: '12px' }}>
          <span style={{ color: p.color, fontFamily: 'DM Sans' }}>{p.name}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--ink)' }}>{fmtY(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ComparisonChart({ trajectories }) {
  if (!trajectories || !trajectories.length) return null;
  return (
    <div className="neu-inset-sm" style={{ padding: '18px 14px 14px', borderRadius: '14px' }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trajectories} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#718096" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#718096" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradScenario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#006666" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#006666" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <YAxis tickFormatter={fmtY} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={4500} stroke="#FE9900" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#FE9900', fontSize: 10 }} />
          <Area type="monotone" dataKey="current"  name="Current path" stroke="#a3b1c6" strokeWidth={2}   fill="url(#gradCurrent)"  dot={false} />
          <Area type="monotone" dataKey="scenario" name="With changes"  stroke="#006666" strokeWidth={2.5} fill="url(#gradScenario)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>
          <div style={{ width: '18px', height: '2px', background: '#a3b1c6' }}></div> Current path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink)', fontFamily: 'DM Sans' }}>
          <div style={{ width: '18px', height: '2.5px', background: '#006666' }}></div> With changes
        </div>
      </div>
    </div>
  );
}
