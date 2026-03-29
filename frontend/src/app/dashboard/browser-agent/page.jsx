'use client';

import { Suspense, useEffect, useState } from 'react';
import { ChevronRight, Compass, ExternalLink, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IssueAgentCompanion } from '../../../components/issues/IssueAgentCompanion';
import { FinCopilotLogo } from '../../../components/shared/FinCopilotLogo';
import { supabase } from '../../../lib/supabase';

function BrowserAgentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === 'true';
  const taskId = searchParams.get('taskId');
  const sessionId = searchParams.get('sessionId');
  const launching = searchParams.get('launching') === 'true';

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase || isDemoParam || launching) {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        router.replace('/login');
      }
    });
  }, [isDemoParam, launching, router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '13px',
            color: 'var(--ink-muted)',
            letterSpacing: '0.05em',
          }}
        >
          Loading agent...
        </span>
      </div>
    );
  }

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
      <aside
        className="neu-raised-lg"
        style={{
          width: '210px',
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
          <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', color: '#1e293b', letterSpacing: '-0.01em' }}>
            FinCopilot
          </span>
        </div>

        <div style={{ height: '1px', background: '#d1d9e0', marginBottom: '12px', marginLeft: '6px', marginRight: '6px' }} />

        <a href="/dashboard" style={sidebarLinkStyle}>
          <Search size={16} />
          <span>Dashboard</span>
        </a>

        <div style={{ ...sidebarLinkStyle, background: 'rgba(0,102,102,0.08)', boxShadow: 'var(--shadow-out-sm)', color: 'var(--primary)' }}>
          <Compass size={16} />
          <span style={{ fontWeight: 600 }}>Browser Agent</span>
        </div>

        <div className="neu-inset-sm" style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '14px' }}>
          <p style={sidebarEyebrowStyle}>Workspace</p>
          <p style={sidebarBodyStyle}>
            Same research flow, but with a dedicated live-agent companion surface for the separate tab.
          </p>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/dashboard" style={{ ...sidebarLinkStyle, justifyContent: 'center' }}>
            <ExternalLink size={14} />
            <span>Return to dashboard</span>
          </a>
        </div>
      </aside>

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 4px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>Home</span>
            <ChevronRight size={13} style={{ color: '#8fa3b8' }} />
            <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>Research</span>
            <ChevronRight size={13} style={{ color: '#8fa3b8' }} />
            <span style={{ fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#1e293b', letterSpacing: '-0.01em' }}>
              Browser Agent
            </span>
          </div>

          <a
            href="/dashboard"
            className="neu-raised-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: 'var(--ink)',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <ExternalLink size={14} />
            Main dashboard
          </a>
        </div>

        <div className="neu-raised-lg" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <IssueAgentCompanion
            taskId={taskId}
            sessionId={sessionId}
            launching={launching && !taskId}
          />
        </div>
      </div>
    </div>
  );
}

export default function BrowserAgentPage() {
  return (
    <Suspense>
      <BrowserAgentInner />
    </Suspense>
  );
}

const sidebarLinkStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
  textAlign: 'left',
  textDecoration: 'none',
  transition: 'all 0.15s ease',
  background: 'transparent',
  color: '#64748b',
  fontFamily: "'Inter', 'DM Sans', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  letterSpacing: '-0.005em',
};

const sidebarEyebrowStyle = {
  fontFamily: 'Space Mono, monospace',
  fontWeight: 700,
  fontSize: '11px',
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '8px',
};

const sidebarBodyStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '12px',
  color: 'var(--ink-muted)',
  lineHeight: 1.6,
};
