'use client';

import { AppProvider, useApp } from '../context/AppContext';
import { ChatPanel } from './chat/ChatPanel';
import { IssuesPanel } from './issues/IssuesPanel';
import { IssueAgentCompanion } from './issues/IssueAgentCompanion';
import { IssueResearchPanel } from './issues/IssueResearchPanel';
import { NavSidebar } from './nav/NavSidebar';
import { TopBar } from './nav/TopBar';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { SimulationsPanel } from './simulations/SimulationsPanel';
import { ToastContainer } from './shared/Toast';

function Layout() {
  const { activeNav, issueAgentTaskId, issueAgentSessionId, issueResearchLoading } = useApp();

  const showChat = activeNav === 'chat' || activeNav === 'issues';
  const showIssues = activeNav === 'issues';
  const showResearch = activeNav === 'research';
  const showBrowserAgent = activeNav === 'browserAgent';
  const showSimulations = activeNav === 'simulations';
  const showProfile = activeNav === 'profile';

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        padding: '16px',
        gap: '16px',
        overflow: 'clip',
        background: 'var(--surface)',
      }}
    >
      <NavSidebar />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <TopBar />

        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '16px' }}>
          {showChat && (
            <div
              style={{
                flex: showIssues ? '1.4 1 0' : '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
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

          {showResearch && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <IssueResearchPanel />
            </div>
          )}

          {showBrowserAgent && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="neu-raised-lg" style={{ flex: 1, overflow: 'hidden' }}>
                <IssueAgentCompanion
                  taskId={issueAgentTaskId}
                  sessionId={issueAgentSessionId}
                  launching={issueResearchLoading}
                  surface="dashboard"
                />
              </div>
            </div>
          )}

          {showSimulations && (
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <SimulationsPanel />
            </div>
          )}

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

export function AppShell({ isDemo = false }) {
  return (
    <AppProvider isDemo={isDemo}>
      <Layout />
      <ToastContainer />
    </AppProvider>
  );
}
