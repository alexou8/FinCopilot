'use client';

import { AlertTriangle, TrendingUp } from 'lucide-react';
import { AppProvider, useApp } from '../context/AppContext';
import { ChatPanel } from './chat/ChatPanel';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { IssuesPanel } from './issues/IssuesPanel';
import { ScenarioPanel } from './scenarios/ScenarioPanel';
import { NeuTabs } from './shared/NeuTabs';

const centerTabs = [
  { id: 'issues',   label: 'Issues',   icon: <AlertTriangle size={14} /> },
  { id: 'scenario', label: 'Scenario', icon: <TrendingUp size={14} />    },
];

function Layout() {
  const { activePanel, setActivePanel } = useApp();

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        padding: '20px',
        gap: '20px',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      {/* Left: Chat (~40%) */}
      <div style={{ flex: '2 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ChatPanel />
      </div>

      {/* Center: Issues / Scenario (~30%) */}
      <div style={{ flex: '1.5 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
        <NeuTabs tabs={centerTabs} activeTab={activePanel} onChange={setActivePanel} />
        <div className="neu-raised-lg" style={{ flex: 1, overflow: 'hidden' }}>
          {activePanel === 'issues' ? <IssuesPanel /> : <ScenarioPanel />}
        </div>
      </div>

      {/* Right: Profile (~30%) */}
      <div style={{ flex: '1.5 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ProfileSidebar />
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
