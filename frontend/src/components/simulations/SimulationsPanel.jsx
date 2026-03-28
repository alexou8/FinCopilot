'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart2, Plus, History, CheckCircle } from 'lucide-react';
import { NeuButton } from '../shared/NeuButton';
import { SimulationHistoryCard } from './SimulationHistoryCard';
import { SimulationResultView } from './SimulationResultView';
import { RunSimulationModal } from './RunSimulationModal';
import { useSimulations } from '../../hooks/useSimulations';

export function SimulationsPanel() {
  const { simulations, activeSimulation, fetchHistory, run, remove, select } = useSimulations();
  const [showModal, setShowModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast]         = useState(null); // { message, type }
  const toastTimer                = useRef(null);

  function showToast(message, type = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(id) {
    await remove(id);
    showToast('Simulation deleted');
  }

  // Load simulation history on mount
  useEffect(() => {
    if (simulations.length === 0) fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRun(prompt) {
    setIsRunning(true);
    await run(prompt);
    setIsRunning(false);
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
      {/* Left column: history */}
      <div
        className="neu-raised-lg"
        style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={15} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                History
              </h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'DM Sans' }}>
              {simulations.length} run{simulations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>
            Stored in Supabase per user
          </p>
        </div>

        {/* Simulation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {simulations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center', padding: '24px' }}>
              <BarChart2 size={28} style={{ color: 'var(--ink-subtle)' }} />
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', lineHeight: 1.6 }}>
                No simulations yet.<br />Run your first one below.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

        {/* Run button */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--surface-dark)', flexShrink: 0 }}>
          <NeuButton
            variant="primary"
            size="md"
            onClick={() => setShowModal(true)}
            disabled={isRunning}
            style={{ width: '100%', gap: '8px' }}
          >
            <Plus size={15} />
            Run Simulation
          </NeuButton>
        </div>
      </div>

      {/* Right column: result */}
      <div
        className="neu-raised-lg"
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Panel header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--surface-dark)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={15} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Simulations
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: '4px' }}>
            {activeSimulation
              ? `Viewing: ${activeSimulation.prompt}`
              : 'Select a simulation from history or run a new one'}
          </p>
        </div>

        {/* Result content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeSimulation ? (
            <SimulationResultView simulation={activeSimulation} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px', textAlign: 'center', padding: '40px' }}>
              <div className="neu-raised-lg" style={{ width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={36} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '16px', color: 'var(--ink)', marginBottom: '10px' }}>
                  Stress-test your financial decisions
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', maxWidth: '360px', lineHeight: 1.7 }}>
                  Describe a major life decision and TermPath will model both paths — showing you month-by-month projections, risk flags, and the exact changes needed to make it work.
                </p>
              </div>
              <NeuButton variant="primary" size="lg" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                Run Your First Simulation
              </NeuButton>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '420px' }}>
                {[
                  { emoji: '🏠', text: 'Move out next term?' },
                  { emoji: '📚', text: 'Drop a course?' },
                  { emoji: '💼', text: 'Take an unpaid internship?' },
                  { emoji: '🚗', text: 'Buy a car?' },
                ].map(({ emoji, text }) => (
                  <div key={text} className="neu-raised-sm" style={{ padding: '12px 14px', borderRadius: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{emoji}</span>
                    <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'DM Sans', fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <RunSimulationModal
          onClose={() => setShowModal(false)}
          onRun={handleRun}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '14px',
            background: '#1e293b',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            pointerEvents: 'none',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
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
