'use client';

import { AlertTriangle, ArrowUpRight, Compass, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NeuBadge } from '../shared/NeuBadge';
import { NeuButton } from '../shared/NeuButton';
import { NeuCard } from '../shared/NeuCard';

function openUrl(url) {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function SourceCard({ source }) {
  let host = source.url;
  try {
    host = new URL(source.url).hostname.replace(/^www\./, '');
  } catch (_error) {
    // Keep the original url string if parsing fails.
  }

  return (
    <NeuCard raised={false} style={{ padding: '14px 16px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          className="neu-raised-sm"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ExternalLink size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '4px' }}>
            {source.title}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--ink-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              wordBreak: 'break-word',
            }}
          >
            {host}
          </p>
        </div>
        <button
          onClick={() => openUrl(source.url)}
          title="Open source"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--primary)',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>
    </NeuCard>
  );
}

export function IssueResearchPanel() {
  const {
    activeIssue,
    issueResearch,
    issueAgentTaskId,
    issueResearchLoading,
    issueResearchError,
    launchIssueResearch,
    openIssueAgentTab,
    setActiveNav,
  } = useApp();

  async function handleRetry() {
    if (!activeIssue) return;
    try {
      await launchIssueResearch(activeIssue);
    } catch (_error) {
      // Error state is already shown in the panel.
    }
  }

  if (issueResearchLoading) {
    return (
      <div
        className="neu-raised-lg"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          height: '100%',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <RefreshCw size={24} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans' }}>
            Researching live options for this issue
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '6px', lineHeight: 1.6 }}>
            FinCopilot is building a guided browser plan with current costs, solution ideas, and trusted sources.
          </p>
        </div>
      </div>
    );
  }

  if (issueResearchError) {
    return (
      <div
        className="neu-raised-lg"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          height: '100%',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans' }}>
            Guided research is unavailable right now
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '6px', lineHeight: 1.6 }}>
            {issueResearchError}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <NeuButton size="sm" variant="primary" onClick={handleRetry}>
            Retry research
          </NeuButton>
          <NeuButton size="sm" onClick={() => setActiveNav('issues')}>
            Back to issues
          </NeuButton>
        </div>
      </div>
    );
  }

  if (!issueResearch) {
    return (
      <div
        className="neu-raised-lg"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          height: '100%',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <div
          className="neu-raised-lg"
          style={{ width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Search size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans' }}>
            Issue Research Workspace
          </p>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '6px', lineHeight: 1.6 }}>
            Open a financial issue from the Issues panel to launch guided browser research with current sources.
          </p>
        </div>
        <NeuButton size="sm" onClick={() => setActiveNav('issues')}>
          Go to issues
        </NeuButton>
      </div>
    );
  }

  const sources = issueResearch.sources || [];
  const findings = issueResearch.findings || [];
  const steps = issueResearch.steps || [];
  const recommendations = issueResearch.recommendations || [];
  const topSourceUrl = sources[0]?.url || issueResearch.search_url;

  return (
    <div className="neu-raised-lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid var(--surface-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="neu-raised-sm"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Compass size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Issue Research
            </p>
            <NeuBadge
              severity={issueResearch.mode === 'live' ? 'success' : 'warning'}
              label={issueResearch.mode === 'live' ? 'Live Web Research' : 'Manual Search Plan'}
            />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', lineHeight: 1.35 }}>
            {issueResearch.title}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <NeuButton size="sm" onClick={() => setActiveNav('issues')}>
            Back to issues
          </NeuButton>
          <NeuButton size="sm" onClick={() => openIssueAgentTab()} disabled={!issueAgentTaskId}>
            Open browser agent
          </NeuButton>
          <NeuButton size="sm" variant="primary" onClick={() => openUrl(issueResearch.search_url)}>
            Open search tab
          </NeuButton>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignContent: 'flex-start' }}>
        <div style={{ flex: '1 1 560px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <NeuCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <NeuBadge severity={activeIssue?.severity || 'default'} />
              <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                Query: {issueResearch.search_query}
              </span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '8px' }}>
              Browser goal
            </p>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.7, marginBottom: '14px' }}>
              {issueResearch.browser_goal}
            </p>
            <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'DM Sans', lineHeight: 1.7 }}>
                {issueResearch.summary}
              </p>
            </div>
            {issueAgentTaskId && (
              <p style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '12px' }}>
                Browser agent workspace ready: {issueAgentTaskId}
              </p>
            )}
            {activeIssue?.explanation && (
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '12px', lineHeight: 1.6 }}>
                Current issue context: {activeIssue.explanation}
              </p>
            )}
          </NeuCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {findings.map((finding, index) => (
              <NeuCard key={`${finding.label}-${index}`}>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {finding.label}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '8px' }}>
                  {finding.value}
                </p>
                {finding.detail && (
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                    {finding.detail}
                  </p>
                )}
              </NeuCard>
            ))}
          </div>

          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '12px' }}>
              Guided browser steps
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((step, index) => (
                <div key={`${step.title}-${index}`} className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span
                      className="neu-raised-sm"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {index + 1}
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans' }}>
                      {step.title}
                    </p>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink)', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: '6px' }}>
                    {step.action}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                    {step.reason}
                  </p>
                  {step.source_hint && (
                    <p style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '8px' }}>
                      Source hint: {step.source_hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </NeuCard>

          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '12px' }}>
              Recommended next moves
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommendations.map((item, index) => (
                <div key={`${item.title}-${index}`} style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    {index + 1}.
                  </span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '4px' }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                      {item.description}
                    </p>
                    {item.expected_impact && (
                      <p style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '6px' }}>
                        Expected impact: {item.expected_impact}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </NeuCard>
        </div>

        <div style={{ flex: '0.9 1 320px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans', marginBottom: '12px' }}>
              Browser launch
            </p>
            <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Search query
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
                {issueResearch.search_query}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <NeuButton size="sm" variant="primary" onClick={() => openUrl(issueResearch.search_url)}>
                Search in new tab
              </NeuButton>
              <NeuButton size="sm" onClick={() => openUrl(topSourceUrl)}>
                Open top source
              </NeuButton>
            </div>
          </NeuCard>

          <NeuCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'DM Sans' }}>
                Cited sources
              </p>
              <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {sources.length} linked
              </span>
            </div>
            {sources.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sources.map((source, index) => (
                  <SourceCard key={`${source.url}-${index}`} source={source} />
                ))}
              </div>
            ) : (
              <div className="neu-inset-sm" style={{ padding: '16px', borderRadius: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                  No live source links were attached to this result, so FinCopilot prepared a manual search plan instead. Open the search tab and keep only trusted pages.
                </p>
              </div>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  );
}
