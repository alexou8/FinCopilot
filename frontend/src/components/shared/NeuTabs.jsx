'use client';

export function NeuTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={"flex gap-1.5 p-1.5 neu-inset rounded-2xl " + className} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '10px 16px',
            borderRadius: '14px',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--ink-muted)',
            transition: 'all 0.18s ease',
            cursor: 'pointer',
          }}
          className={activeTab === tab.id ? 'neu-raised-sm' : ''}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
