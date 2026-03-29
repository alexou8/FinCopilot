'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Search,
  Send,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  answerBrowserAgent,
  getBrowserAgentStatus,
  pauseBrowserAgent,
  resumeBrowserAgent,
  stopBrowserAgent,
} from '../../services/browserAgentService';
import {
  getLastIssueAgentTaskId,
  loadIssueAgentTask,
  updateIssueAgentTask,
} from '../../lib/issueAgent';
import { NeuBadge } from '../shared/NeuBadge';
import { NeuButton } from '../shared/NeuButton';
import { NeuCard } from '../shared/NeuCard';

const STATUS_META = {
  idle: { label: 'Starting', severity: 'default' },
  running: { label: 'Live browser control', severity: 'success' },
  paused: { label: 'Paused', severity: 'warning' },
  question: { label: 'Needs input', severity: 'warning' },
  done: { label: 'Task complete', severity: 'success' },
  failed: { label: 'Runtime issue', severity: 'critical' },
};

function openUrl(url) {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function IssueAgentCompanion({ taskId, sessionId, launching = false }) {
  const [task, setTask] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [answer, setAnswer] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const resolvedTaskId = taskId || getLastIssueAgentTaskId();
    if (!resolvedTaskId) return;
    setTask(loadIssueAgentTask(resolvedTaskId));
  }, [taskId]);

  const resolvedSessionId = sessionId || task?.sessionId || null;

  useEffect(() => {
    if (!resolvedSessionId) return;

    let mounted = true;

    async function poll() {
      try {
        const next = await getBrowserAgentStatus(resolvedSessionId);
        if (!mounted) return;
        setRuntime(next);
        if (task?.taskId) {
          const persisted = updateIssueAgentTask(task.taskId, current => ({
            ...current,
            sessionId: resolvedSessionId,
            runtime: next,
          }));
          if (persisted) setTask(persisted);
        }
      } catch (error) {
        if (!mounted) return;
        setRuntime(prev => prev || {
          state: 'failed',
          active: false,
          message: error.message || 'Could not reach the browser agent runtime.',
          error: error.message || 'Could not reach the browser agent runtime.',
        });
      }
    }

    poll();
    const interval = window.setInterval(poll, 1500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [resolvedSessionId, task?.taskId]);

  const effectiveRuntime = runtime || task?.runtime || null;
  const effectiveState = effectiveRuntime?.state || task?.state || 'idle';
  const status = STATUS_META[effectiveState] || STATUS_META.idle;
  const sources = task?.research?.sources || [];
  const topSourceUrl = sources[0]?.url || task?.research?.search_url;
  const currentMessage =
    effectiveRuntime?.message ||
    task?.research?.browser_goal ||
    'Preparing the browser agent.';
  const currentQuestion = effectiveRuntime?.question || null;
  const currentUrl = effectiveRuntime?.current_url || null;
  const agentError = effectiveRuntime?.error || task?.agentUnavailableReason || null;
  const stepLog = effectiveRuntime?.step_log || [];
  const visitedPages = effectiveRuntime?.visited_pages || [];
  const runtimeMode = effectiveRuntime?.runtime_mode || 'computer_use';
  const pagesAnalyzed = effectiveRuntime?.pages_analyzed || visitedPages.length || 0;
  const domainsAnalyzed =
    effectiveRuntime?.domains_analyzed ||
    new Set(visitedPages.map(page => page.domain)).size;

  const currentStep = useMemo(() => {
    if (!task?.research?.steps?.length) return null;
    return task.research.steps[0];
  }, [task]);

  async function runAction(fn) {
    if (!resolvedSessionId) return;
    setActionLoading(true);
    try {
      const next = await fn(resolvedSessionId);
      setRuntime(next);
      if (task?.taskId) {
        const persisted = updateIssueAgentTask(task.taskId, current => ({
          ...current,
          sessionId: resolvedSessionId,
          runtime: next,
        }));
        if (persisted) setTask(persisted);
      }
    } catch (error) {
      const failedRuntime = {
        ...(effectiveRuntime || {}),
        state: 'failed',
        active: false,
        message: error.message || 'Browser agent action failed.',
        error: error.message || 'Browser agent action failed.',
      };
      setRuntime(failedRuntime);
      if (task?.taskId) {
        const persisted = updateIssueAgentTask(task.taskId, current => ({
          ...current,
          sessionId: resolvedSessionId,
          runtime: failedRuntime,
        }));
        if (persisted) setTask(persisted);
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAnswer() {
    if (!answer.trim()) return;

    if (resolvedSessionId) {
      await runAction(id => answerBrowserAgent(id, answer.trim()));
      setAnswer('');
      return;
    }

    if (!task?.taskId) return;
    const persisted = updateIssueAgentTask(task.taskId, current => ({
      ...current,
      state: 'done',
      capturedAnswer: answer.trim(),
      result: `Captured evidence: ${answer.trim()}. Bring this back into FinCopilot and decide on the next step.`,
    }));
    if (persisted) setTask(persisted);
    setAnswer('');
  }

  if (launching) {
    return (
      <div style={emptyStateWrapStyle}>
        <NeuCard className="animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div className="neu-raised-sm" style={iconPillStyle}>
              <Loader2 size={18} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            </div>
            <div>
              <p style={eyebrowStyle}>Visible Browser Agent</p>
              <h2 style={titleStyle}>Preparing browser session</h2>
            </div>
          </div>
          <p style={bodyTextStyle}>
            FinCopilot is opening a visible Chromium window and wiring the live companion state for this issue.
          </p>
        </NeuCard>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={emptyStateWrapStyle}>
        <NeuCard className="animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div className="neu-raised-sm" style={iconPillStyle}>
              <Compass size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p style={eyebrowStyle}>Issue Research</p>
              <h2 style={titleStyle}>No browser task found</h2>
            </div>
          </div>
          <p style={bodyTextStyle}>
            Launch the browser agent from a financial issue card in the dashboard first.
          </p>
        </NeuCard>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          padding: '22px 24px',
          borderBottom: '1px solid var(--surface-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div className="neu-raised-sm" style={{ ...iconPillStyle, width: '42px', height: '42px' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <p style={eyebrowStyle}>Visible Browser Agent</p>
            <NeuBadge severity={status.severity} label={status.label} />
            <NeuBadge
              severity={runtimeMode === 'vision' ? 'warning' : 'success'}
              label={runtimeMode === 'vision' ? 'Vision-Guided Fallback' : 'Computer Use'}
            />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, fontFamily: 'DM Sans' }}>
            {task.issue?.title}
          </h1>
          <p style={{ ...bodyTextStyle, marginTop: '8px' }}>
            {task.research?.browser_goal}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <NeuButton size="sm" variant="primary" onClick={() => openUrl(task.research?.search_url)}>
            <Search size={14} />
            Open search results
          </NeuButton>
          <NeuButton size="sm" onClick={() => openUrl(topSourceUrl)}>
            <ArrowUpRight size={14} />
            Open top source
          </NeuButton>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '18px 20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 620px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <NeuCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <NeuBadge severity={task.issue?.severity || 'default'} />
              <span style={monoStyle}>
                Query: {task.research?.search_query}
              </span>
            </div>

            <div className="neu-inset-sm" style={{ padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
              <p style={sectionLabelStyle}>Current action</p>
              <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.7, fontFamily: 'DM Sans' }}>
                {currentMessage}
              </p>
              {currentUrl && (
                <p style={{ ...monoStyle, marginTop: '10px', wordBreak: 'break-word' }}>
                  Current URL: {currentUrl}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: currentQuestion ? '18px' : '0' }}>
              {effectiveState === 'running' && (
                <NeuButton size="sm" onClick={() => runAction(pauseBrowserAgent)} disabled={actionLoading || !resolvedSessionId}>
                  <Pause size={14} />
                  Pause
                </NeuButton>
              )}
              {effectiveState === 'paused' && (
                <NeuButton size="sm" variant="primary" onClick={() => runAction(resumeBrowserAgent)} disabled={actionLoading || !resolvedSessionId}>
                  <Play size={14} />
                  Resume
                </NeuButton>
              )}
              {effectiveState !== 'done' && effectiveState !== 'failed' && (
                <NeuButton size="sm" onClick={() => runAction(stopBrowserAgent)} disabled={actionLoading || !resolvedSessionId} style={{ color: 'var(--danger)' }}>
                  <Square size={14} />
                  Stop
                </NeuButton>
              )}
            </div>

            {currentQuestion && (
              <div className="neu-inset-sm" style={{ padding: '16px', borderRadius: '16px' }}>
                <p style={sectionLabelStyle}>Agent needs your input</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px', lineHeight: 1.6 }}>
                  {currentQuestion}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    value={answer}
                    onChange={event => setAnswer(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && handleAnswer()}
                    placeholder={task.collaborationPrompt?.placeholder || 'Type your answer...'}
                    className="neu-input"
                    style={{
                      flex: '1 1 320px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontFamily: 'DM Sans',
                    }}
                  />
                  <NeuButton size="sm" variant="primary" onClick={handleAnswer} disabled={actionLoading}>
                    <Send size={14} />
                    Submit
                  </NeuButton>
                </div>
              </div>
            )}
          </NeuCard>

          {(effectiveRuntime?.result || task?.result) && (
            <NeuCard style={{ border: '1px solid rgba(0, 166, 61, 0.22)' }}>
              <p style={sectionLabelStyle}>Result</p>
              <p style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.75 }}>
                {effectiveRuntime?.result || task?.result}
              </p>
            </NeuCard>
          )}

          {agentError && (
            <NeuCard style={{ border: '1px solid rgba(255, 33, 87, 0.18)' }}>
              <p style={{ ...sectionLabelStyle, color: 'var(--danger)' }}>Runtime issue</p>
              <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.7 }}>
                {agentError}
              </p>
              <p style={{ ...bodyTextStyle, marginTop: '10px' }}>
                Local browser failures usually mean Playwright or Chromium is missing. OpenAI access failures usually mean the current project cannot use the requested model.
              </p>
            </NeuCard>
          )}

          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
              Exploration trail
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stepLog.length > 0 ? (
                stepLog.slice().reverse().map((entry, index) => (
                  <div key={`${entry}-${index}`} className="neu-inset-sm" style={{ padding: '12px 14px', borderRadius: '14px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.6 }}>
                      {entry}
                    </p>
                  </div>
                ))
              ) : (
                <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
                  <p style={bodyTextStyle}>
                    The companion log will fill in as the browser moves through pages and compares options.
                  </p>
                </div>
              )}
            </div>
          </NeuCard>
        </div>

        <div style={{ flex: '0.9 1 340px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
              Coverage
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <MetricCard label="Pages analyzed" value={String(pagesAnalyzed)} />
              <MetricCard label="Domains covered" value={String(domainsAnalyzed)} />
            </div>
            <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
              <p style={sectionLabelStyle}>Suggested first step</p>
              <p style={bodyTextStyle}>
                {currentStep?.title ? `${currentStep.title}: ${currentStep.action}` : task.research?.summary}
              </p>
            </div>
          </NeuCard>

          <NeuCard>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
              How this works
            </p>
            <p style={bodyTextStyle}>
              A visible Chromium window opens on your screen. FinCopilot explores trusted public pages, follows relevant internal links, and keeps this workspace updated with its path and coverage.
            </p>
          </NeuCard>

          <NeuCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                Analyzed pages
              </p>
              <span style={monoStyle}>{visitedPages.length} tracked</span>
            </div>
            {visitedPages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visitedPages.map((page, index) => (
                  <VisitedPageCard key={`${page.url}-${index}`} page={page} />
                ))}
              </div>
            ) : (
              <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
                <p style={bodyTextStyle}>
                  Page-level analysis will appear here once the agent has traversed multiple relevant screens.
                </p>
              </div>
            )}
          </NeuCard>

          <NeuCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                Sources
              </p>
              <span style={monoStyle}>{sources.length} linked</span>
            </div>
            {sources.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sources.map((source, index) => (
                  <SourceCard key={`${source.url}-${index}`} source={source} />
                ))}
              </div>
            ) : (
              <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
                <p style={bodyTextStyle}>
                  No cited links were attached to this task. Use the search results and keep to trusted public pages.
                </p>
              </div>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '16px' }}>
      <p style={sectionLabelStyle}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  );
}

function SourceCard({ source }) {
  const host = getHostLabel(source.url);

  return (
    <NeuCard raised={false} style={{ padding: '14px 16px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div className="neu-raised-sm" style={smallIconPillStyle}>
          <ExternalLink size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
            {source.title}
          </p>
          <p style={{ ...monoStyle, color: 'var(--ink-muted)', wordBreak: 'break-word' }}>
            {host}
          </p>
        </div>
        <button
          onClick={() => openUrl(source.url)}
          title="Open source"
          style={iconButtonStyle}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>
    </NeuCard>
  );
}

function VisitedPageCard({ page }) {
  return (
    <NeuCard raised={false} style={{ padding: '14px 16px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div className="neu-raised-sm" style={smallIconPillStyle}>
          <Compass size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
            {page.title}
          </p>
          <p style={{ ...monoStyle, color: 'var(--ink-muted)', wordBreak: 'break-word', marginBottom: '8px' }}>
            {page.domain}
          </p>
          {page.snippet && (
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              {page.snippet}
            </p>
          )}
        </div>
        <button
          onClick={() => openUrl(page.url)}
          title="Open analyzed page"
          style={iconButtonStyle}
        >
          <ArrowUpRight size={16} />
        </button>
      </div>
    </NeuCard>
  );
}

function getHostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_error) {
    return url;
  }
}

const emptyStateWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '24px',
};

const iconPillStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const smallIconPillStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const titleStyle = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--ink)',
  lineHeight: 1.25,
  fontFamily: 'DM Sans',
};

const bodyTextStyle = {
  fontSize: '13px',
  color: 'var(--ink-muted)',
  fontFamily: 'DM Sans',
  lineHeight: 1.7,
};

const monoStyle = {
  fontSize: '11px',
  color: 'var(--primary)',
  fontFamily: 'JetBrains Mono, monospace',
};

const eyebrowStyle = {
  fontSize: '12px',
  color: 'var(--ink)',
  fontFamily: 'Space Mono, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 700,
};

const sectionLabelStyle = {
  fontSize: '11px',
  color: 'var(--ink-muted)',
  fontFamily: 'Space Mono, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '8px',
};

const iconButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: 'var(--primary)',
  cursor: 'pointer',
  padding: '4px',
  flexShrink: 0,
};
