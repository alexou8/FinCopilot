'use client';

const ONBOARDING_PROMPTS = [
  { id: 'p1', text: "Let's set up my financial profile",      emoji: '🚀' },
  { id: 'p2', text: 'I earn $1,200/month from my part-time job', emoji: '💵' },
  { id: 'p3', text: 'My monthly expenses are around $1,800',  emoji: '📋' },
  { id: 'p4', text: 'I have a student loan I want to track',  emoji: '🎓' },
];

const GENERAL_PROMPTS = [
  { id: 'g1', text: 'Can I afford to move out next semester?', emoji: '🏠' },
  { id: 'g2', text: 'How should I handle my student loans?',   emoji: '🎓' },
  { id: 'g3', text: 'How can I build an emergency fund?',      emoji: '💰' },
  { id: 'g4', text: 'Should I drop a course to work more?',    emoji: '📚' },
];

export function SuggestedPrompts({ onSelect, isOnboarding = false }) {
  const prompts = isOnboarding ? ONBOARDING_PROMPTS : GENERAL_PROMPTS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '28px', padding: '16px' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="neu-raised-lg" style={{ width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>
          {isOnboarding ? '🚀' : '💸'}
        </div>
        <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>
          {isOnboarding ? "Let's get started" : 'Ready when you are'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-muted)', maxWidth: '300px', lineHeight: 1.6 }}>
          {isOnboarding
            ? "Tell me about your income, expenses, debt, and savings — I'll build your financial profile as we chat."
            : 'Ask me anything about your money, goals, or financial decisions.'}
        </p>
      </div>
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {prompts.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.text)}
            className="neu-btn"
            style={{ width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', color: 'var(--ink)' }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{p.emoji}</span>
            <span>{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
