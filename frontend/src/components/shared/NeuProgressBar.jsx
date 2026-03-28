'use client';

const colorMap = {
  primary: '#006666',
  success: '#00A63D',
  warning: '#FE9900',
  danger:  '#FF2157',
};

export function NeuProgressBar({ value = 0, max = 100, color = 'primary', label, showPercent = true, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = colorMap[color] || colorMap.primary;
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ink-muted)' }}>
          {label && <span style={{ fontFamily: 'DM Sans' }}>{label}</span>}
          {showPercent && <span style={{ fontFamily: 'JetBrains Mono' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="neu-inset-sm" style={{ height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', backgroundColor: barColor, borderRadius: '999px', transition: 'width 0.7s ease' }}
          role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} />
      </div>
    </div>
  );
}
