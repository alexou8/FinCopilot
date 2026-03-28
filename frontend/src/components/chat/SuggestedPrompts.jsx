'use client';

const PROMPTS = [
  { id: 'p1', text: 'Help me understand my finances',        emoji: '📊' },
  { id: 'p2', text: 'Can I afford to move out?',            emoji: '🏠' },
  { id: 'p3', text: 'How should I handle my student loans?', emoji: '🎓' },
  { id: 'p4', text: 'How can I save more each month?',      emoji: '💰' },
];

export function SuggestedPrompts({ onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '28px', padding: '16px' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="neu-raised-lg" style={{ width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>💸</div>
        <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>Ready when you are</h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-muted)', maxWidth: '280px', lineHeight: 1.6 }}>
          Ask me anything about your money, goals, or financial decisions.
        </p>
      </div>
      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PROMPTS.map(p => (
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
