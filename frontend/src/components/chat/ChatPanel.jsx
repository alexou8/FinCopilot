'use client';

import { useEffect, useRef } from 'react';
import { Bot, Sparkles, RotateCcw } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedPrompts } from './SuggestedPrompts';
import { useApp } from '../../context/AppContext';
import { useChat } from '../../hooks/useChat';

export function ChatPanel() {
  const { messages, setMessages, isTyping, profile, onboardingProgress } = useApp();
  const { send } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show onboarding state when no profile has been set up yet
  const isOnboarding = !onboardingProgress.completed;

  return (
    <div className="neu-raised-lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'DM Sans', fontWeight: 600 }}>
                  Step {onboardingProgress.step + 1}/{onboardingProgress.total}: {onboardingProgress.label}
                </span>
              </div>
            )}
            {!isOnboarding && messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="neu-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '8px',
                  fontSize: '11px', fontFamily: 'DM Sans', fontWeight: 600,
                  color: 'var(--ink-muted)', cursor: 'pointer',
                }}
                title="Start a new conversation"
              >
                <RotateCcw size={12} />
                New Chat
              </button>
            )}
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>Online</span>
          </div>
        </div>

        {/* Onboarding progress bar */}
        {isOnboarding && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
            {Array.from({ length: onboardingProgress.total }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: i < onboardingProgress.step
                    ? 'var(--primary)'
                    : i === onboardingProgress.step
                      ? 'linear-gradient(90deg, var(--primary), var(--primary-light))'
                      : 'var(--surface-dark)',
                  transition: 'background 0.4s ease',
                  boxShadow: i < onboardingProgress.step ? '0 0 6px rgba(0,102,102,0.3)' : 'none',
                }}
              />
            ))}
          </div>
        )}
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
