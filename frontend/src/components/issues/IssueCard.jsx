'use client';

import { NeuCard } from '../shared/NeuCard';
import { NeuBadge } from '../shared/NeuBadge';
import { NeuButton } from '../shared/NeuButton';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../hooks/useChat';

export function IssueCard({ issue }) {
  const { setActiveNav, addToast } = useApp();
  const { send } = useChat();

  function handleAction() {
    if (issue.actionType === 'scenario') {
      setActiveNav('simulations');
    } else {
      // advice-type: navigate to chat and send a contextual question
      setActiveNav('chat');
      const prompt = `Help me with this issue: "${issue.title}". ${issue.explanation ? 'Context: ' + issue.explanation.slice(0, 200) : ''}`;
      // Small delay so tab switch renders first
      setTimeout(() => send(prompt), 300);
      addToast(`💬 Asking about: ${issue.title}`);
    }
  }

  return (
    <NeuCard>
      <div style={{ marginBottom: '10px' }}>
        <NeuBadge severity={issue.severity} />
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'DM Sans', lineHeight: 1.4, marginBottom: '8px' }}>
        {issue.title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: '14px' }}>
        {issue.explanation}
      </p>
      <NeuButton size="sm" variant="primary" onClick={handleAction}>
        {issue.action} →
      </NeuButton>
    </NeuCard>
  );
}

