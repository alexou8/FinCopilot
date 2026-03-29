'use client';

import { NeuCard } from '../shared/NeuCard';
import { NeuBadge } from '../shared/NeuBadge';
import { NeuButton } from '../shared/NeuButton';
import { useApp } from '../../context/AppContext';

export function IssueCard({ issue }) {
  const { activeIssue, issueResearchLoading, launchIssueResearch } = useApp();
  const isLaunching =
    issueResearchLoading && (activeIssue?.rule_id ?? activeIssue?.id) === (issue.rule_id ?? issue.id);

  async function handleAction() {
    try {
      await launchIssueResearch(issue);
    } catch (_error) {
      // The research workspace renders the failure state.
    }
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
