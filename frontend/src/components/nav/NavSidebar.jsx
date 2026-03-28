'use client';

import { MessageSquare, AlertTriangle, BarChart2, User, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinCopilotLogo } from '../shared/FinCopilotLogo';

const NAV_ITEMS = [
  { id: 'chat',        icon: MessageSquare, label: 'Chat'        },
  { id: 'issues',      icon: AlertTriangle,  label: 'Issues'      },
  { id: 'simulations', icon: BarChart2,      label: 'Simulations' },
  { id: 'profile',     icon: User,           label: 'Profile'     },
];

const FONT = "'Inter', 'DM Sans', sans-serif";

export function NavSidebar() {
  const { activeNav, setActiveNav, profile, authUser } = useApp();

  const fullName = authUser?.name || profile?.name || 'Guest';
  const email    = authUser?.email || 'Demo mode';

  function handleNav(id) {
    setActiveNav(id);
  }

  return (
    <div
      className="neu-raised-lg"
      style={{
        width: '190px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: '2px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '6px' }}>
        <FinCopilotLogo size={34} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '15px', color: '#1e293b', letterSpacing: '-0.01em' }}>
          FinCopilot
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#d1d9e0', marginBottom: '12px', marginLeft: '6px', marginRight: '6px' }} />

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(0,102,102,0.08)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-out-sm)' : 'none',
                color: isActive ? 'var(--primary)' : '#64748b',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  e.currentTarget.style.color = '#334155';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, strokeWidth: isActive ? 2.2 : 1.8 }} />
              <span style={{
                fontFamily: FONT,
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                letterSpacing: '-0.005em',
                color: isActive ? 'var(--primary)' : '#64748b',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#d1d9e0', margin: '12px 6px' }} />

      {/* Help */}
      <button
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          background: 'transparent',
          color: '#64748b',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
          e.currentTarget.style.color = '#334155';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#64748b';
        }}
      >
        <HelpCircle size={16} style={{ flexShrink: 0, strokeWidth: 1.8 }} />
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: '14px', letterSpacing: '-0.005em' }}>
          Help &amp; Support
        </span>
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
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontFamily: FONT, fontWeight: 600, color: '#fff',
        }}>
          {fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: FONT, fontWeight: 500, fontSize: '13px',
            color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}>
            {fullName}
          </p>
          <p style={{
            fontFamily: FONT, fontWeight: 400, fontSize: '10px', color: '#94a3b8',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {email}
          </p>
        </div>
        <button
          title="Sign out"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}
