'use client';

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function parseBold(str) {
  return str.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={j} style={{ fontWeight: 600, color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>
      : part
  );
}

function SimpleMarkdown({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '5px' }} />;
        const trimmed = line.trim();
        if (trimmed.includes('|') && !trimmed.match(/^-+\|/) && !trimmed.split('|').every(c => /^[\s-]*$/.test(c.trim()))) {
          const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length > 1) {
            return (
              <div key={i} style={{ display: 'flex', gap: '14px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '4px' }}>
                {cells.map((c, j) => <span key={j} style={{ flex: 1, color: 'var(--ink-muted)' }}>{parseBold(c)}</span>)}
              </div>
            );
          }
        }
        if (/^\|?[\s-|]+\|?$/.test(trimmed) && trimmed.includes('-')) return null;
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: 'var(--primary)', flexShrink: 0 }}>•</span>
              <span>{parseBold(trimmed.replace(/^[-•]\s/, ''))}</span>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <div key={i} style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: 'var(--primary)', fontFamily: 'JetBrains Mono', fontSize: '12px', flexShrink: 0, minWidth: '16px' }}>{numMatch[1]}.</span>
              <span>{parseBold(numMatch[2])}</span>
            </div>
          );
        }
        return <p key={i} style={{ margin: 0 }}>{parseBold(line)}</p>;
      }).filter(Boolean)}
    </div>
  );
}

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '78%' }}>
          <div style={{
            background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
            color: '#fff',
            padding: '13px 18px',
            borderRadius: '18px 18px 4px 18px',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '4px 4px 10px rgba(0,102,102,0.3), -2px -2px 6px rgba(255,255,255,0.15)',
          }}>
            {message.content}
          </div>
          <div style={{ textAlign: 'right', marginTop: '5px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'JetBrains Mono' }}>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div className="neu-raised-sm" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <span style={{ color: 'var(--primary)', fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>FC</span>
      </div>
      <div style={{ maxWidth: '82%' }}>
        <div
          className="neu-raised-sm"
          style={{
            padding: '13px 18px',
            borderRadius: '4px 18px 18px 18px',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'DM Sans, sans-serif',
            color: 'var(--ink)',
            border: message.isError ? '1px solid rgba(255,33,87,0.3)' : 'none',
          }}
        >
          <SimpleMarkdown text={message.content} />
        </div>
        <div style={{ marginTop: '5px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'JetBrains Mono' }}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
