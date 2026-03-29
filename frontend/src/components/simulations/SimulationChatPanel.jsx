'use client';

import { useEffect, useRef } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { MessageBubble } from '../chat/MessageBubble';
import { MessageInput } from '../chat/MessageInput';
import { TypingIndicator } from '../chat/TypingIndicator';
import { NeuButton } from '../shared/NeuButton';
import { useSimulationChat } from '../../hooks/useSimulationChat';
import { useApp } from '../../context/AppContext';

const DEFAULT_PROMPTS = [
  'Should I move out next semester?',
  'Can I afford an unpaid internship?',
  'What if I buy a car?',
  'What happens if I drop a course?',
];

/**
 * @param {object} props
 * @param {function} props.onRunSimulation
 * @param {boolean} props.isRunning
 * @param {boolean} [props.compact] — when true, hides the header and Run button
 *   (used inside SimulationLauncher's expandable refinement area)
 */
export function SimulationChatPanel({ onRunSimulation, isRunning, compact = false }) {
  const { simMessages, isSimTyping, send, scenarioPrompt } = useSimulationChat();
  const { profile } = useApp();

  const decisionDescription = profile?.decision?.description;
  const examplePrompts = decisionDescription
    ? [decisionDescription, ...DEFAULT_PROMPTS.filter(p => p.toLowerCase() !== decisionDescription.toLowerCase()).slice(0, 3)]
    : DEFAULT_PROMPTS;
  const bottomRef = useRef(null);
  const hasMessages = simMessages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, isSimTyping]);

  return (
    <div className={compact ? '' : 'neu-raised-lg'} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header — hidden in compact mode */}
      {!compact && (
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(145deg, var(--primary-light), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Sparkles size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '14px', color: 'var(--ink)', letterSpacing: '0.02em' }}>
                Scenario Chat
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '2px' }}>
                {hasMessages ? 'Describing your financial scenario' : 'Describe a decision you\'re considering'}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          </div>
        </div>
      )}

      <div
        style={{ flex: 1, overflowY: 'auto', padding: compact ? '14px 20px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        role="log" aria-label="Simulation scenario chat" aria-live="polite"
      >
        {!hasMessages ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.7 }}>
              {compact
                ? 'Refine the details of your scenario. I\'ll update the simulation model with any changes you describe.'
                : 'Tell me about the financial decision you\'re considering. I\'ll ask a few questions to understand the impact, then you can run the simulation.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {examplePrompts.map(ex => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="neu-btn"
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'DM Sans',
                    color: 'var(--ink-muted)',
                    fontStyle: 'italic',
                    cursor: 'pointer',
                  }}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {simMessages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            {isSimTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input + Run Simulation button */}
      <div style={{ padding: compact ? '10px 20px 14px' : '16px 24px 20px', borderTop: '1px solid var(--surface-dark)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <MessageInput
          onSend={send}
          disabled={isSimTyping || isRunning}
          placeholder={compact ? 'Refine your scenario...' : 'Describe your scenario\u2026'}
        />
        {/* Hide the Run button in compact mode — the launcher has its own */}
        {!compact && (
          <NeuButton
            variant="primary"
            size="md"
            onClick={() => onRunSimulation(scenarioPrompt)}
            disabled={isRunning || !hasMessages}
            style={{ width: '100%', gap: '8px' }}
          >
            {isRunning ? (
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
        )}
      </div>

      {!compact && <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>}
    </div>
  );
}
