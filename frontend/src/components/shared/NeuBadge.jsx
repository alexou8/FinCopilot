'use client';

const config = {
  critical: { dot: 'var(--danger)',   text: 'var(--danger)',   label: 'Critical' },
  warning:  { dot: 'var(--warning)',  text: 'var(--warning)',  label: 'Warning'  },
  tip:      { dot: 'var(--primary)',  text: 'var(--primary)',  label: 'Tip'      },
  success:  { dot: 'var(--success)',  text: 'var(--success)',  label: 'Success'  },
  default:  { dot: 'var(--ink-muted)', text: 'var(--ink-muted)', label: ''       },
};

export function NeuBadge({ severity = 'default', label, className = '' }) {
  const { dot, text, label: defaultLabel } = config[severity] || config.default;
  const displayLabel = label !== undefined ? label : defaultLabel;
  return (
    <span className={"neu-raised-sm " + className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontFamily: 'Space Mono, monospace', fontWeight: 700, color: text }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, backgroundColor: dot }} />
      {displayLabel}
    </span>
  );
}
