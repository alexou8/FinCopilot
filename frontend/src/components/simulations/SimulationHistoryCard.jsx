'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Trash2, ChevronRight, Check, X } from 'lucide-react';

const fmt = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

function VerdictIcon({ feasible }) {
  if (feasible === true)  return <CheckCircle  size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />;
  if (feasible === false) return <XCircle      size={14} style={{ color: 'var(--danger)',  flexShrink: 0 }} />;
  return                         <AlertCircle  size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />;
}

export function SimulationHistoryCard({ simulation, isActive, onSelect, onDelete }) {
  const { prompt, createdAt, verdict, scenarios } = simulation;
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const dateStr = createdAt ? fmt.format(new Date(createdAt)) : '';

  async function handleDeleteConfirm(e) {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(simulation.id);
    // component unmounts after this — no need to reset state
  }

  function handleDeleteRequest(e) {
    e.stopPropagation();
    setConfirming(true);
  }

  function handleDeleteCancel(e) {
    e.stopPropagation();
    setConfirming(false);
  }

  return (
    <div
      onClick={() => !confirming && onSelect(simulation)}
      className={isActive ? 'neu-inset-sm' : 'neu-raised-sm'}
      style={{
        padding: '14px 16px',
        borderRadius: '14px',
        cursor: confirming ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
        position: 'relative',
        opacity: deleting ? 0.5 : 1,
      }}
    >
      {/* Prompt */}
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--ink)',
        marginBottom: '6px',
        paddingRight: '28px',
        lineHeight: 1.4,
      }}>
        {prompt}
      </p>

      {/* Scenario labels */}
      {scenarios && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>
            {scenarios.baseline?.label}
          </span>
          <ChevronRight size={10} style={{ color: '#8fa3b8' }} />
          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'DM Sans' }}>
            {scenarios.alternative?.label}
          </span>
        </div>
      )}

      {/* Footer: verdict + date OR delete confirmation */}
      {confirming ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,33,87,0.07)', borderRadius: '8px',
            padding: '6px 10px', marginTop: '2px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--danger)', fontFamily: 'DM Sans', fontWeight: 600, flex: 1 }}>
            Delete this simulation?
          </span>
          <button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            title="Confirm delete"
            style={{
              border: 'none', background: 'var(--danger)', cursor: 'pointer',
              color: '#fff', padding: '3px 10px', borderRadius: '6px',
              fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <Check size={11} /> Delete
          </button>
          <button
            onClick={handleDeleteCancel}
            title="Cancel"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ink-muted)', padding: '3px 6px', borderRadius: '6px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <VerdictIcon feasible={verdict?.feasible} />
          <span style={{
            fontSize: '11px',
            color: verdict?.feasible ? 'var(--success)' : 'var(--danger)',
            fontFamily: 'DM Sans',
            fontWeight: 500,
            flex: 1,
          }}>
            {verdict?.feasible ? 'Feasible' : 'Not feasible'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ink-subtle)', fontFamily: 'DM Sans' }}>
            {dateStr}
          </span>
        </div>
      )}

      {/* Trash button — hidden during confirmation */}
      {!confirming && (
        <button
          onClick={handleDeleteRequest}
          title="Delete simulation"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#8fa3b8',
            padding: '3px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8fa3b8'; }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
