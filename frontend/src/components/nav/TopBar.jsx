'use client';

import { ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PAGE_LABELS = {
  chat:        'Chat',
  issues:      'Issues',
  research:    'Research',
  browserAgent:'Browser Agent',
  simulations: 'Simulations',
  profile:     'Profile',
};

export function TopBar() {
  const { activeNav } = useApp();
  const crumb = PAGE_LABELS[activeNav] || 'Chat';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 4px 16px',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
        <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>Home</span>
        <ChevronRight size={13} style={{ color: '#8fa3b8' }} />
        <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#1e293b', letterSpacing: '-0.01em' }}>
          {crumb}
        </span>
      </div>
    </div>
  );
}
