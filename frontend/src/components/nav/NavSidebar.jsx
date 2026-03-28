'use client';

import {
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  User,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { id: 'chat',     icon: MessageSquare, label: 'Chat'      },
  { id: 'issues',   icon: AlertTriangle, label: 'Issues'    },
  { id: 'scenario', icon: TrendingUp,    label: 'Scenarios' },
  { id: 'profile',  icon: User,          label: 'Profile'   },
];

export function NavSidebar() {
  const { activeNav, setActiveNav, setActivePanel, profile } = useApp();
  const fullName = profile?.name || 'Alex Chen';
  const role     = profile?.university ? `${profile.university.split(' ').slice(-1)[0]} Student` : 'Student';

  function handleNav(id) {
    setActiveNav(id);
    if (id === 'issues' || id === 'scenario') setActivePanel(id);
  }

  return (
    <div
      className="neu-raised-lg"
      style={{
        width: '190px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '4px' }}>
        <div
          style={{
            width: '36px', height: '36px',
            borderRadius: '11px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
            boxShadow: '4px 4px 8px rgba(0,102,102,0.3), -2px -2px 6px rgba(255,255,255,0.6)',
          }}
        >
          <Sparkles size={17} color="#fff" />
        </div>
        <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '14px', color: 'var(--ink)', letterSpacing: '0.02em' }}>
          FinCopilot
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--shadow-dark)', opacity: 0.3, marginBottom: '10px' }} />

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                background: isActive
                  ? 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))'
                  : 'transparent',
                boxShadow: isActive
                  ? '5px 5px 10px rgba(0,102,102,0.28), -3px -3px 8px rgba(255,255,255,0.55)'
                  : 'none',
                color: isActive ? '#fff' : 'var(--ink-muted)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--gradient-convex)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-out-sm)';
                  e.currentTarget.style.color = 'var(--ink)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.color = 'var(--ink-muted)';
                }
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                letterSpacing: '0.01em',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--shadow-dark)', opacity: 0.3, margin: '10px 0' }} />

      {/* Help */}
      <button
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'transparent',
          color: 'var(--ink-muted)',
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--gradient-convex)';
          e.currentTarget.style.boxShadow = 'var(--shadow-out-sm)';
          e.currentTarget.style.color = 'var(--ink)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.color = 'var(--ink-muted)';
        }}
      >
        <HelpCircle size={17} style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '14px' }}>Help</span>
      </button>

      {/* User row */}
      <div
        className="neu-inset-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '13px',
            color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {fullName}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--ink-muted)' }}>
            {role}
          </p>
        </div>
      </div>
    </div>
  );
}
