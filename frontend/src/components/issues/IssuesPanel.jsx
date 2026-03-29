'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IssueCard } from './IssueCard';
import { getIssues } from '../../services/issuesService';

export function IssuesPanel() {
  const { issues, setIssues, authUser, isDemo } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch issues whenever authUser becomes available (Supabase auth is async),
  // but skip if issues were already auto-fetched after onboarding completion.
  useEffect(() => {
    if (isDemo || !authUser?.id || issues.length > 0) return;
    setLoading(true);
    setFetchError(null);
    getIssues(authUser.id)
      .then(setIssues)
      .catch(err => { console.error(err); setFetchError('Could not load issues.'); })
      .finally(() => setLoading(false));
  }, [authUser?.id, isDemo]); // re-run when auth resolves
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings  = issues.filter(i => i.severity === 'warning');
  const tips      = issues.filter(i => i.severity === 'tip');

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '32px' }}>
        <RefreshCw size={24} style={{ color: 'var(--ink-muted)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>Analysing your financial profile…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '32px', textAlign: 'center' }}>
        <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
        <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>{fetchError}</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '32px', textAlign: 'center' }}>
        <div className="neu-raised-lg" style={{ width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>✅</div>
        <div>
          <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>No issues found yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '6px', fontFamily: 'DM Sans', lineHeight: 1.5 }}>Complete your financial profile in the chat to get a full analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
        <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Financial Issues</h2>
        <div className="neu-raised-sm" style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '999px' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--ink-muted)' }}>{issues.length}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {critical.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '10px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Critical</p>
            {critical.map(i => <IssueCard key={i.rule_id ?? i.id} issue={i} />)}
          </div>
        )}
        {warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '10px', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Warnings</p>
            {warnings.map(i => <IssueCard key={i.rule_id ?? i.id} issue={i} />)}
          </div>
        )}
        {tips.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tips</p>
            {tips.map(i => <IssueCard key={i.rule_id ?? i.id} issue={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
