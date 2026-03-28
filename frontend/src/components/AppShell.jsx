'use client';

import { AppProvider, useApp } from '../context/AppContext';
import { ChatPanel } from './chat/ChatPanel';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { IssuesPanel } from './issues/IssuesPanel';
import { ScenarioPanel } from './scenarios/ScenarioPanel';
import { NavSidebar } from './nav/NavSidebar';
import { TopBar } from './nav/TopBar';

function Layout() {
  const { activePanel, activeNav } = useApp();

  // Determine which panels to show based on active nav
  const showChat    = true; // chat always visible
  const showCenter  = activeNav === 'issues' || activeNav === 'scenario';
  const showProfile = activeNav === 'profile' || activeNav === 'issues' || activeNav === 'scenario';

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

      {/* Main content area (everything to the right of sidebar) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Top bar */}
        <TopBar />

        {/* Panels row */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '16px' }}>

          {/* Chat */}
          <div style={{
            flex: showCenter ? '2 1 0' : showProfile ? '2 1 0' : '3 1 0',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            <ChatPanel />
          </div>

          {/* Center: Issues / Scenario */}
          {showCenter && (
            <div style={{ flex: '1.5 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="neu-raised-lg" style={{ flex: 1, overflow: 'hidden' }}>
                {activePanel === 'issues' ? <IssuesPanel /> : <ScenarioPanel />}
              </div>
            </div>
          )}

          {/* Right: Profile */}
          {showProfile && (
            <div style={{
              flex: activeNav === 'profile' ? '2 1 0' : '1.5 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <ProfileSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDemoMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'true';
}

export function AppShell() {
  return (
    <AppProvider isDemo={getDemoMode()}>
      <Layout />
    </AppProvider>
  );
}
