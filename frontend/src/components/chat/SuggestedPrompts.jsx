'use client';

import {
  BookOpen,
  GraduationCap,
  Home,
  MessageSquare,
  PiggyBank,
  ReceiptText,
  Rocket,
  Wallet,
} from 'lucide-react';

const ONBOARDING_PROMPTS = [
  { id: 'p1', text: "Let's set up my financial profile", icon: Rocket },
  { id: 'p2', text: 'I earn $1,200/month from my part-time job', icon: Wallet },
  { id: 'p3', text: 'My monthly expenses are around $1,800', icon: ReceiptText },
  { id: 'p4', text: 'I have a student loan I want to track', icon: GraduationCap },
];

const GENERAL_PROMPTS = [
  { id: 'g1', text: 'Can I afford to move out next semester?', icon: Home },
  { id: 'g2', text: 'How should I handle my student loans?', icon: GraduationCap },
  { id: 'g3', text: 'How can I build an emergency fund?', icon: PiggyBank },
  { id: 'g4', text: 'Should I drop a course to work more?', icon: BookOpen },
];

export function SuggestedPrompts({ onSelect, isOnboarding = false }) {
  const prompts = isOnboarding ? ONBOARDING_PROMPTS : GENERAL_PROMPTS;
  const HeroIcon = isOnboarding ? Rocket : MessageSquare;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '28px',
        padding: '16px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          className="neu-raised-lg"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <HeroIcon size={34} style={{ color: 'var(--primary)' }} />
        </div>
        <h2
          style={{
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--ink)',
            marginBottom: '8px',
          }}
        >
          {isOnboarding ? "Let's get started" : 'Ready when you are'}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--ink-muted)',
            maxWidth: '300px',
            lineHeight: 1.6,
          }}
        >
          {isOnboarding
            ? "Tell me about your income, expenses, debt, and savings. I'll build your financial profile as we chat."
            : 'Ask me anything about your money, goals, or financial decisions.'}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {prompts.map(({ id, text, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(text)}
            className="neu-btn"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '14px 18px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
              color: 'var(--ink)',
            }}
          >
            <div
              className="neu-raised-sm"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
