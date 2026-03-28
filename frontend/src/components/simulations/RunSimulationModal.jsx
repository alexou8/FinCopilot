'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader } from 'lucide-react';
import { NeuButton } from '../shared/NeuButton';

const EXAMPLE_PROMPTS = [
  'Should I move out in 8 months?',
  'Can I afford to drop a course and work more hours?',
  'What happens if I pay off my credit card this month?',
  'Can I take an unpaid internship next semester?',
];

export function RunSimulationModal({ onClose, onRun }) {
  const [prompt, setPrompt]   = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef           = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleRun() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    await onRun(prompt.trim());
    setLoading(false);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun();
    if (e.key === 'Escape') onClose();
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(30, 41, 59, 0.35)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        className="neu-raised-lg"
        style={{
          width: '100%', maxWidth: '540px',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} style={{ color: '#fff' }} />
              </div>
              <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>
                Run Simulation
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.5 }}>
              Describe a major decision. We'll model both paths and show you the financial impact over the next year.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ink-muted)', padding: '4px', borderRadius: '8px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Textarea */}
        <div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Should I move out in 8 months?"
            rows={4}
            className="neu-input"
            style={{
              width: '100%', resize: 'none',
              fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
              color: 'var(--ink)', lineHeight: 1.6,
              padding: '14px 18px',
            }}
          />
          <p style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'DM Sans', marginTop: '6px' }}>
            Tip: ⌘ + Enter to run
          </p>
        </div>

        {/* Example prompts */}
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Examples
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="neu-btn"
                style={{
                  textAlign: 'left', padding: '9px 14px', borderRadius: '10px',
                  fontSize: '13px', fontFamily: 'DM Sans', color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                }}
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--surface-dark)', paddingTop: '20px' }}>
          <NeuButton size="md" onClick={onClose} disabled={loading}>
            Cancel
          </NeuButton>
          <NeuButton
            size="md" variant="primary"
            onClick={handleRun}
            disabled={!prompt.trim() || loading}
          >
            {loading ? (
              <>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Simulating…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Run Simulation
              </>
            )}
          </NeuButton>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
