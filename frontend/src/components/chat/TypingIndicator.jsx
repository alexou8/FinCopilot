'use client';

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div className="neu-raised-sm" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'var(--primary)', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>FC</span>
      </div>
      <div className="neu-raised-sm" style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} aria-label="FinCopilot is typing">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
