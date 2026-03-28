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
  { id: 'chat',     icon: MessageSquare,  label: 'Chat'      },
  { id: 'issues',   icon: AlertTriangle,  label: 'Issues'    },
  { id: 'scenario', icon: TrendingUp,     label: 'Scenarios' },
  { id: 'profile',  icon: User,           label: 'Profile'   },
];

export function NavSidebar() {
  const { activeNav, setActiveNav, setActivePanel } = useApp();

  function handleNav(id) {
    setActiveNav(id);
    if (id === 'issues' || id === 'scenario') {
      setActivePanel(id);
    }
  }

  return (
    <div
      className="neu-raised-lg"
      style={{
        width: '72px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '18px 0',
        gap: '6px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="neu-raised-sm"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
          boxShadow: '5px 5px 10px rgba(0,102,102,0.35), -3px -3px 8px rgba(255,255,255,0.6)',
        }}
      >
        <Sparkles size={20} color="#fff" />
      </div>

      {/* Divider */}
      <div style={{ width: '32px', height: '1px', background: 'var(--shadow-dark)', opacity: 0.4, marginBottom: '8px' }} />

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              title={label}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                background: isActive
                  ? 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))'
                  : 'transparent',
                boxShadow: isActive
                  ? '5px 5px 10px rgba(0,102,102,0.3), -3px -3px 8px rgba(255,255,255,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'none',
                color: isActive ? '#fff' : 'var(--ink-muted)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = 'var(--shadow-out-sm)';
                  e.currentTarget.style.background = 'var(--gradient-convex)';
                  e.currentTarget.style.color = 'var(--ink)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--ink-muted)';
                }
              }}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* Bottom: Help */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '32px', height: '1px', background: 'var(--shadow-dark)', opacity: 0.4, marginBottom: '4px' }} />
        <button
          title="Help & Support"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: 'var(--ink-muted)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = 'var(--shadow-out-sm)';
            e.currentTarget.style.background = 'var(--gradient-convex)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--ink-muted)';
          }}
        >
          <HelpCircle size={20} />
        </button>

        {/* User avatar dot */}
        <div
          className="neu-raised-sm"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #b8c4d4, #96a6bb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: '4px',
          }}
        >
          AC
        </div>
      </div>
    </div>
  );
}
