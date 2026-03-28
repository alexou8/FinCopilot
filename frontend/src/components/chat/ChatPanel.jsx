'use client';

import { useEffect, useRef } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedPrompts } from './SuggestedPrompts';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../hooks/useChat';

export function ChatPanel() {
  const { messages, isTyping, profile } = useApp();
  const { send } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show onboarding state when no profile has been set up yet
  const isOnboarding = !profile;

  return (
    <div className="neu-raised-lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '22px 28px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <div className="neu-raised" style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '16px', color: 'var(--ink)', letterSpacing: '0.02em' }}>FinCopilot</h1>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans, sans-serif', marginTop: '1px' }}>
            {isOnboarding ? 'Let\'s set up your financial profile' : 'Ask anything about your finances'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOnboarding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,102,102,0.08)', padding: '4px 10px', borderRadius: '99px' }}>
              <Sparkles size={11} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'DM Sans', fontWeight: 600 }}>Onboarding</span>
            </div>
          )}
          <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        role="log" aria-label="Conversation" aria-live="polite"
      >
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={send} isOnboarding={isOnboarding} />
        ) : (
          <>
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <MessageInput
          onSend={send}
          disabled={isTyping}
          placeholder={isOnboarding ? 'Tell me about your income, expenses, or financial goals…' : 'Ask about your finances…'}
        />
      </div>
    </div>
  );
}
