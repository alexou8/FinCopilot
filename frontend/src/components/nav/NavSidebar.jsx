'use client';

import { MessageSquare, AlertTriangle, BarChart2, User, LogOut, Search, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { FinCopilotLogo } from '../shared/FinCopilotLogo';
import { signOut } from '../../services/authService';

const NAV_ITEMS = [
  { id: 'chat',         icon: MessageSquare, label: 'Chat' },
  { id: 'issues',       icon: AlertTriangle, label: 'Issues' },
  { id: 'research',     icon: Search, label: 'Research' },
  { id: 'browserAgent', icon: Compass, label: 'Browser Agent' },
  { id: 'simulations',  icon: BarChart2, label: 'Simulations' },
  { id: 'profile',      icon: User, label: 'Profile' },
];

const FONT = "'Inter', 'DM Sans', sans-serif";

export function NavSidebar() {
  const { activeNav, setActiveNav, profile, authUser, issues } = useApp();
  const router = useRouter();

  const fullName = authUser?.name || profile?.name || 'Guest';
  const email = authUser?.email || 'Demo mode';

  function handleNav(id) {
    setActiveNav(id);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
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
        gap: '2px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '6px' }}>
        <FinCopilotLogo size={34} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '15px', color: '#1e293b', letterSpacing: '-0.01em' }}>
          FinCopilot
        </span>
      </div>

      <div style={{ height: '1px', background: '#d1d9e0', marginBottom: '12px', marginLeft: '6px', marginRight: '6px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeNav === id;
          const showBadge =
            (id === 'issues' && issues.length > 0 && activeNav !== 'issues') ||
            (id === 'simulations' && profile?.decision?.description && activeNav !== 'simulations');
          const badgeColor = id === 'issues' ? 'var(--danger)' : 'var(--primary)';

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
                position: 'relative',
              }}
              onMouseEnter={event => {
                if (!isActive) {
                  event.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  event.currentTarget.style.color = '#334155';
                }
              }}
              onMouseLeave={event => {
                if (!isActive) {
                  event.currentTarget.style.background = 'transparent';
                  event.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon size={16} style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
                {showBadge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: badgeColor,
                      border: '2px solid var(--surface-light)',
                      animation: 'badgePulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  letterSpacing: '-0.005em',
                  color: isActive ? 'var(--primary)' : '#64748b',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

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
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: FONT,
            fontWeight: 600,
            color: '#fff',
          }}
        >
          {fullName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: '13px',
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {fullName}
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: '10px',
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {email}
          </p>
        </div>
        <button
          title="Sign out"
          onClick={handleSignOut}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0 }}
          onMouseEnter={event => {
            event.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={event => {
            event.currentTarget.style.color = '#94a3b8';
          }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}
