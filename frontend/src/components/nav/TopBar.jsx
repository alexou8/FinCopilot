'use client';

import { Bell, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PAGE_LABELS = {
  chat:     { crumb: 'Chat',      title: 'AI Assistant'   },
  issues:   { crumb: 'Issues',    title: 'Financial Issues' },
  scenario: { crumb: 'Scenarios', title: 'What-If Scenarios' },
  profile:  { crumb: 'Profile',   title: 'Financial Profile' },
};

export function TopBar() {
  const { activeNav, profile } = useApp();
  const page = PAGE_LABELS[activeNav] || PAGE_LABELS.chat;
  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AC';

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
        <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--ink-muted)' }}>
          Home
        </span>
        <ChevronRight size={13} style={{ color: 'var(--ink-subtle)' }} />
        <span style={{ fontFamily: 'Space Mono', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
          {page.crumb}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notification bell */}
        <button
          className="neu-raised-sm"
          style={{
            width: '38px', height: '38px',
            borderRadius: '12px',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)',
            background: 'var(--gradient-convex)',
            transition: 'all 0.18s',
          }}
          title="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div
          className="neu-raised-sm"
          style={{
            width: '38px', height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #b8c4d4, #96a6bb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Mono, monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
          title={profile?.name || 'Alex Chen'}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
