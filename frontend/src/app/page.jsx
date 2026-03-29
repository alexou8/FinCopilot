'use client';

import Link from 'next/link';
import { CinematicHero } from '../components/ui/CinematicHero';
import { FinCopilotLogo } from '../components/shared/FinCopilotLogo';

export default function LandingPage() {
  return (
    <div style={{ overflowX: 'hidden', width: '100%', minHeight: '100vh', position: 'relative' }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: 'rgba(10, 18, 28, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Logo + wordmark */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <FinCopilotLogo size={32} />
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontWeight: 700,
            fontSize: '15px',
            color: '#ffffff',
            letterSpacing: '0.04em',
          }}>
            FinCopilot
          </span>
        </Link>

        {/* Auth button */}
        <Link
          href="/login"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            textDecoration: 'none',
            padding: '9px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #009090, #004444)',
            boxShadow: '0 2px 12px rgba(0,144,144,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Get started
        </Link>
      </nav>

      <CinematicHero />
    </div>
  );
}
