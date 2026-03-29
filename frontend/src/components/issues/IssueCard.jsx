'use client';

import { NeuCard } from '../shared/NeuCard';
import { NeuBadge } from '../shared/NeuBadge';
import { NeuButton } from '../shared/NeuButton';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../hooks/useChat';

export function IssueCard({ issue }) {
  const {
    activeIssue,
    issueResearchLoading,
    launchIssueResearch,
    setActiveNav,
    addToast,
  } = useApp();
  const { send } = useChat();

  const isLaunching =
    issue.actionType === 'research' &&
    issueResearchLoading &&
    (activeIssue?.rule_id ?? activeIssue?.id) === (issue.rule_id ?? issue.id);

  async function handleAction() {
    if (issue.actionType === 'research') {
      try {
        await launchIssueResearch(issue);
      } catch (_error) {
        // The research workspace renders the failure state.
      }
      return;
    }

    if (issue.actionType === 'scenario') {
      setActiveNav('simulations');
      return;
    }

    setActiveNav('chat');
    const prompt = `Help me with this issue: "${issue.title}". ${
      issue.explanation ? `Context: ${issue.explanation.slice(0, 200)}` : ''
    }`;
    setTimeout(() => send(prompt), 300);
    addToast(`Asking about: ${issue.title}`, 'chat');
  }

  return (
    <NeuCard>
      <div style={{ marginBottom: '10px' }}>
        <NeuBadge severity={issue.severity} />
      </div>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--ink)',
          fontFamily: 'DM Sans',
          lineHeight: 1.4,
          marginBottom: '8px',
        }}
      >
        {issue.title}
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--ink-muted)',
          fontFamily: 'DM Sans',
          lineHeight: 1.6,
          marginBottom: '14px',
        }}
      >
        {issue.explanation}
      </p>
      <NeuButton size="sm" variant="primary" onClick={handleAction} disabled={isLaunching}>
        {isLaunching ? 'Researching...' : `${issue.action} ->`}
      </NeuButton>
    </NeuCard>
  );
}
