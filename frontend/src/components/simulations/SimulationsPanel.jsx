'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart2, History, CheckCircle } from 'lucide-react';
import { SimulationHistoryCard } from './SimulationHistoryCard';
import { SimulationResultView } from './SimulationResultView';
import { SimulationChatPanel } from './SimulationChatPanel';
import { useSimulations } from '../../hooks/useSimulations';

export function SimulationsPanel() {
  const { simulations, activeSimulation, fetchHistory, run, remove, select } = useSimulations();
  const [isRunning, setIsRunning]   = useState(false);
  const [toast, setToast]           = useState(null);
  const toastTimer                  = useRef(null);

  function showToast(message, type = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(id) {
    await remove(id);
    showToast('Simulation deleted');
  }

  useEffect(() => {
    if (simulations.length === 0) fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRun(prompt) {
    if (!prompt?.trim()) return;
    setIsRunning(true);
    await run(prompt);
    setIsRunning(false);
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>

      {/* ── Left column: Scenario Chat ── */}
      <div style={{ flex: '1.4 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SimulationChatPanel onRunSimulation={handleRun} isRunning={isRunning} />
      </div>

      {/* ── Right column: History (top) + Results (bottom) ── */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>

        {/* History panel */}
        <div
          className="neu-raised-lg"
          style={{ flexShrink: 0, maxHeight: '260px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <History size={13} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '11px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  History
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'DM Sans' }}>
                {simulations.length} run{simulations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {simulations.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', textAlign: 'center' }}>
                  No simulations yet. Describe a scenario and click Run.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {simulations.map(sim => (
                  <SimulationHistoryCard
                    key={sim.id}
                    simulation={sim}
                    isActive={activeSimulation?.id === sim.id}
                    onSelect={select}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results panel */}
        <div
          className="neu-raised-lg"
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <BarChart2 size={13} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '11px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Results
              </h2>
            </div>
            {activeSimulation && (
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '3px' }}>
                {activeSimulation.prompt}
              </p>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
            {activeSimulation ? (
              <SimulationResultView simulation={activeSimulation} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center', padding: '24px' }}>
                <BarChart2 size={28} style={{ color: 'var(--ink-subtle)' }} />
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6, maxWidth: '240px' }}>
                  Chat about your scenario, then click Run Simulation to see the 12-month comparison here.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 20px', borderRadius: '14px', background: '#1e293b', color: '#fff',
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)', pointerEvents: 'none',
          animation: 'fadeInUp 0.2s ease',
        }}>
          <CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
