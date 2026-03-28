'use client';

import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { NeuInput } from '../shared/NeuInput';

export function MessageInput({ onSend, disabled, placeholder = 'Ask about your finances…' }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <NeuInput
          ref={inputRef}
          multiline
          rows={2}
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Chat message input"
          style={{ minHeight: '64px', maxHeight: '130px', fontSize: '14px', padding: '14px 18px' }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={canSend ? 'neu-btn-primary' : 'neu-btn'}
        style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: canSend ? '#fff' : 'var(--ink-muted)' }}
      >
        <Send size={18} />
      </button>
    </div>
  );
}
