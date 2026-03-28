'use client';

import { Bell, ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { signOut } from '../../services/authService';

const PAGE_LABELS = {
  chat:        'Chat',
  issues:      'Issues',
  simulations: 'Simulations',
  profile:     'Profile',
};

export function TopBar() {
  const { activeNav, authUser, isDemo } = useApp();
  const router = useRouter();
  const crumb = PAGE_LABELS[activeNav] || 'Chat';

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

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

      {/* User email badge (non-demo) */}
      {!isDemo && authUser?.email && (
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
          color: 'var(--ink-muted)', maxWidth: '160px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {authUser.email}
        </span>
      )}

      {/* Notification bell */}
      <button
        className="neu-raised-sm"
        style={{
          width: '38px', height: '38px', borderRadius: '12px',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-muted)', background: 'var(--gradient-convex)',
          transition: 'all 0.18s',
        }}
        title="Notifications"
      >
        <Bell size={16} />
      </button>

      {/* Sign out (hidden in demo mode) */}
      {!isDemo && (
        <button
          onClick={handleSignOut}
          className="neu-raised-sm"
          style={{
            width: '38px', height: '38px', borderRadius: '12px',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', background: 'var(--gradient-convex)',
            transition: 'all 0.18s',
          }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      )}
    </div>
  );
}
