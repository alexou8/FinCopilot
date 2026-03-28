'use client';

import { AppProvider, useApp } from '../context/AppContext';
import { ChatPanel } from './chat/ChatPanel';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { IssuesPanel } from './issues/IssuesPanel';
import { SimulationsPanel } from './simulations/SimulationsPanel';
import { NavSidebar } from './nav/NavSidebar';
import { TopBar } from './nav/TopBar';

function Layout() {
  const { activeNav } = useApp();

  // Each tab maps to a distinct layout:
  //  chat        → chat panel only (full width)
  //  issues      → chat (left) + issues panel (right)
  //  simulations → full-width SimulationsPanel (history + results side-by-side)
  //  profile     → full-width ProfileSidebar
  const showChat        = activeNav === 'chat' || activeNav === 'issues';
  const showIssues      = activeNav === 'issues';
  const showSimulations = activeNav === 'simulations';
  const showProfile     = activeNav === 'profile';

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        padding: '20px',
        gap: '16px',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      {/* Far-left: Nav Sidebar */}
      <NavSidebar />

      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top bar */}
        <TopBar />

        {/* Panels row */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '16px' }}>

          {/* Chat + Issues view */}
          {showChat && (
            <div style={{ flex: showIssues ? '1.4 1 0' : '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ChatPanel />
            </div>
          )}

          {showIssues && (
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="neu-raised-lg" style={{ flex: 1, overflow: 'hidden' }}>
                <IssuesPanel />
              </div>
            </div>
          )}

          {/* Simulations: full-width split-pane */}
          {showSimulations && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SimulationsPanel />
            </div>
          )}

          {/* Profile: full-width editable view */}
          {showProfile && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ProfileSidebar />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  // TODO: Replace with real Supabase session check.
  // For now always loads in demo mode so all tabs are pre-populated.
  return (
    <AppProvider isDemo={true}>
      <Layout />
    </AppProvider>
  );
}
