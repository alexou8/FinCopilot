'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CinematicHero } from '../components/ui/CinematicHero';
import { FinCopilotLogo } from '../components/shared/FinCopilotLogo';

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function interpolateHex(from, to, amount) {
  const progress = clamp(amount);
  const start = from.replace('#', '');
  const end = to.replace('#', '');

  const startRgb = [
    parseInt(start.slice(0, 2), 16),
    parseInt(start.slice(2, 4), 16),
    parseInt(start.slice(4, 6), 16),
  ];
  const endRgb = [
    parseInt(end.slice(0, 2), 16),
    parseInt(end.slice(2, 4), 16),
    parseInt(end.slice(4, 6), 16),
  ];

  const mixed = startRgb.map((channel, index) =>
    Math.round(channel + (endRgb[index] - channel) * progress)
  );

  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function getHeroContrastTone(scrollY) {
  const darkEnterStart = 220;
  const darkEnterEnd = 1050;
  const darkExitStart = 5200;
  const darkExitEnd = 6200;

  if (scrollY <= darkEnterStart) return 0;
  if (scrollY < darkEnterEnd) {
    return clamp((scrollY - darkEnterStart) / (darkEnterEnd - darkEnterStart));
  }
  if (scrollY <= darkExitStart) return 1;
  if (scrollY < darkExitEnd) {
    return 1 - clamp((scrollY - darkExitStart) / (darkExitEnd - darkExitStart));
  }
  return 0;
}

export default function LandingPage() {
  const [contrastTone, setContrastTone] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setContrastTone(getHeroContrastTone(window.scrollY));
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const brandColor = interpolateHex('#1e293b', '#f8fafc', contrastTone);
  const brandShadow = `0 10px 24px rgba(15, 23, 42, ${0.08 + contrastTone * 0.16})`;
  const brandRailOpacity = 0.12 + contrastTone * 0.22;
  const ctaShadow = `0 14px 28px rgba(0, 102, 102, ${0.2 + contrastTone * 0.18})`;

  return (
    <div style={{ overflowX: 'hidden', width: '100%', minHeight: '100vh', position: 'relative' }}>
      <nav
        style={{
          position: 'fixed',
          top: '20px',
          left: '28px',
          right: '28px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            pointerEvents: 'auto',
            position: 'relative',
            padding: '6px 4px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-12px',
              right: '-20px',
              top: '-6px',
              bottom: '-6px',
              borderRadius: '999px',
              background: `linear-gradient(90deg, rgba(255,255,255,${0.16 + contrastTone * 0.08}), rgba(255,255,255,0))`,
              opacity: brandRailOpacity,
              filter: 'blur(18px)',
              transition: 'opacity 220ms ease, background 220ms ease',
            }}
          />
          <div
            style={{
              position: 'relative',
              filter: `drop-shadow(0 10px 18px rgba(0, 0, 0, ${0.08 + contrastTone * 0.14}))`,
              transition: 'filter 220ms ease',
            }}
          >
            <FinCopilotLogo size={34} />
          </div>
          <span
            style={{
              position: 'relative',
              fontFamily: 'Space Mono, monospace',
              fontWeight: 700,
              fontSize: '15px',
              color: brandColor,
              letterSpacing: '0.04em',
              textShadow: brandShadow,
              transition: 'color 220ms ease, text-shadow 220ms ease',
            }}
          >
            FinCopilot
          </span>
        </Link>

        <Link
          href="/login"
          style={{
            pointerEvents: 'auto',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #009090, #004444)',
            boxShadow: ctaShadow,
            transition: 'transform 180ms ease, box-shadow 220ms ease, opacity 180ms ease',
          }}
          onMouseEnter={event => {
            event.currentTarget.style.opacity = '0.88';
            event.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={event => {
            event.currentTarget.style.opacity = '1';
            event.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Get started
        </Link>
      </nav>

      <CinematicHero />
    </div>
  );
}
