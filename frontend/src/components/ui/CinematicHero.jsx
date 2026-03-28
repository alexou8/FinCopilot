'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.04; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
    color: var(--color-foreground);
    text-shadow:
      0 10px 30px color-mix(in srgb, var(--color-foreground) 20%, transparent),
      0 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent);
  }

  .text-silver-matte {
    background: linear-gradient(180deg, var(--color-foreground) 0%, color-mix(in srgb, var(--color-foreground) 40%, transparent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 10px 20px color-mix(in srgb, var(--color-foreground) 15%, transparent))
      drop-shadow(0px 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent));
  }

  .text-card-silver-matte {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0px 12px 24px rgba(0,0,0,0.8))
      drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
    background: linear-gradient(145deg, #0d2137 0%, #071018 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.9),
      0 20px 40px -20px rgba(0,0,0,0.8),
      inset 0 1px 2px rgba(255,255,255,0.12),
      inset 0 -2px 4px rgba(0,0,0,0.8);
    border: 1px solid rgba(0,128,128,0.12);
    position: relative;
  }

  .card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,128,128,0.07) 0%, transparent 40%);
    mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  /* Laptop hardware */
  .laptop-screen-shell {
    background: #1c1c1e;
    border-radius: 12px 12px 0 0;
    border: 7px solid #2a2a2c;
    box-shadow:
      inset 0 0 0 1px #3a3a3c,
      0 2px 4px rgba(0,0,0,0.6);
    overflow: hidden;
    position: relative;
  }
  .laptop-base {
    background: linear-gradient(180deg, #2a2a2c 0%, #1c1c1e 100%);
    border-radius: 0 0 12px 12px;
    box-shadow:
      0 30px 80px -10px rgba(0,0,0,0.85),
      0 10px 30px -5px rgba(0,0,0,0.7),
      inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .laptop-hinge {
    background: linear-gradient(90deg, #111 0%, #3a3a3c 30%, #3a3a3c 70%, #111 100%);
    height: 4px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.8);
  }
  .laptop-trackpad {
    background: linear-gradient(180deg, #252527 0%, #1e1e20 100%);
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.03);
  }
  .laptop-key {
    background: linear-gradient(180deg, #2e2e30 0%, #252527 100%);
    border-radius: 3px;
    border-bottom: 1px solid #111;
    box-shadow: 0 1px 0 rgba(255,255,255,0.04);
  }
  .screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 45%);
  }

  .floating-ui-badge {
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(0,128,128,0.18),
      0 25px 50px -12px rgba(0,0,0,0.8),
      inset 0 1px 1px rgba(255,255,255,0.15),
      inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-cta-light, .btn-cta-dark { transition: all 0.4s cubic-bezier(0.25,1,0.5,1); }
  .btn-cta-light {
    background: linear-gradient(180deg,#FFFFFF 0%,#F1F5F9 100%);
    color: #0F172A;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05),0 2px 4px rgba(0,0,0,0.1),0 12px 24px -4px rgba(0,0,0,0.3),inset 0 1px 1px rgba(255,255,255,1),inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-cta-light:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(0,0,0,0.05),0 6px 12px -2px rgba(0,0,0,0.15),0 20px 32px -6px rgba(0,0,0,0.4),inset 0 1px 1px rgba(255,255,255,1),inset 0 -3px 6px rgba(0,0,0,0.06); }
  .btn-cta-light:active { transform: translateY(1px); background: linear-gradient(180deg,#F1F5F9 0%,#E2E8F0 100%); }
  .btn-cta-dark {
    background: linear-gradient(180deg,#00897B 0%,#004d4d 100%);
    color: #FFFFFF;
    box-shadow: 0 0 0 1px rgba(0,128,128,0.3),0 2px 4px rgba(0,0,0,0.6),0 12px 24px -4px rgba(0,102,102,0.6),inset 0 1px 1px rgba(255,255,255,0.2),inset 0 -3px 6px rgba(0,0,0,0.4);
  }
  .btn-cta-dark:hover { transform: translateY(-3px); background: linear-gradient(180deg,#00A693 0%,#006666 100%); box-shadow: 0 0 0 1px rgba(0,128,128,0.4),0 6px 12px -2px rgba(0,0,0,0.4),0 20px 32px -6px rgba(0,102,102,0.7),inset 0 1px 1px rgba(255,255,255,0.25),inset 0 -3px 6px rgba(0,0,0,0.4); }
  .btn-cta-dark:active { transform: translateY(1px); background: #004d4d; }

  /* Progress ring — sized for r=18 (circumference ≈ 113) */
  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 113;
    stroke-dashoffset: 113;
    stroke-linecap: round;
  }
`;

export function CinematicHero({
  brandName      = 'FinCopilot',
  tagline1       = 'Master your money,',
  tagline2       = 'own your future.',
  cardHeading    = 'Financial clarity, finally.',
  cardDescription = (
    <>
      <span className="text-white font-semibold">FinCopilot</span> is the AI-powered financial companion built for university students — track spending, tackle debt, and chat your way to smarter financial decisions.
    </>
  ),
  metricValue    = 94,
  metricLabel    = 'Budget Score',
  ctaHeading     = 'Your financial future starts here.',
  ctaDescription = 'Join students using FinCopilot to conquer debt, build savings, and make every dollar count.',
  className,
  ...props
}) {
  const containerRef = useRef(null);
  const mainCardRef  = useRef(null);
  const mockupRef    = useRef(null);
  const requestRef   = useRef(0);

  // Mouse parallax + teal card sheen
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          const xVal = (e.clientX / window.innerWidth  - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, { rotationY: xVal * 8, rotationX: -yVal * 6, ease: 'power3.out', duration: 1.2 });
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, []);

  // Cinematic scroll timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const ctx = gsap.context(() => {
      gsap.set('.text-track',  { autoAlpha: 0, y: 60, scale: 0.85, filter: 'blur(20px)', rotationX: -20 });
      gsap.set('.text-days',   { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' });
      gsap.set('.main-card',   { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set(['.card-left-text', '.card-right-text', '.mockup-scroll-wrapper', '.floating-badge', '.phone-widget'], { autoAlpha: 0 });
      gsap.set('.cta-wrapper', { autoAlpha: 0, scale: 0.8, filter: 'blur(30px)' });

      gsap.timeline({ delay: 0.3 })
        .to('.text-track', { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', rotationX: 0, ease: 'expo.out' })
        .to('.text-days',  { duration: 1.4, clipPath: 'inset(0 0% 0 0)', ease: 'power4.inOut' }, '-=1.0');

      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=7000',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      })
        .to(['.hero-text-wrapper', '.bg-grid-theme'], { scale: 1.15, filter: 'blur(20px)', opacity: 0.2, ease: 'power2.inOut', duration: 2 }, 0)
        .to('.main-card', { y: 0, ease: 'power3.inOut', duration: 2 }, 0)
        .to('.main-card', { width: '100%', height: '100%', borderRadius: '0px', ease: 'power3.inOut', duration: 1.5 })
        .fromTo('.mockup-scroll-wrapper',
          { y: 300, z: -500, rotationX: 40, rotationY: -20, autoAlpha: 0, scale: 0.6 },
          { y: 0,   z: 0,    rotationX: 0,  rotationY: 0,   autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 2.5 }, '-=0.8')
        .fromTo('.phone-widget', { y: 30, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12, ease: 'back.out(1.2)', duration: 1.5 }, '-=1.5')
        .to('.progress-ring', { strokeDashoffset: 17, duration: 2, ease: 'power3.inOut' }, '-=1.2')
        .to('.counter-val', { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: 'expo.out' }, '-=2.0')
        .fromTo('.floating-badge', { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: 'back.out(1.5)', duration: 1.5, stagger: 0.2 }, '-=2.0')
        .fromTo('.card-left-text',  { x: -50, autoAlpha: 0 },            { x: 0, autoAlpha: 1, ease: 'power4.out', duration: 1.5 }, '-=1.5')
        .fromTo('.card-right-text', { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 1.5 }, '<')
        .to({}, { duration: 2.5 })
        .set('.hero-text-wrapper', { autoAlpha: 0 })
        .set('.cta-wrapper', { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to(['.mockup-scroll-wrapper', '.floating-badge', '.card-left-text', '.card-right-text'], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: 'power3.in', duration: 1.2, stagger: 0.05,
        })
        .to('.main-card', {
          width:  isMobile ? '92vw' : '85vw',
          height: isMobile ? '92vh' : '85vh',
          borderRadius: isMobile ? '32px' : '40px',
          ease: 'expo.inOut', duration: 1.8,
        }, 'pullback')
        .to('.cta-wrapper', { scale: 1, filter: 'blur(0px)', ease: 'expo.inOut', duration: 1.8 }, 'pullback')
        .to('.main-card', { y: -window.innerHeight - 300, ease: 'power3.in', duration: 1.5 });
    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-screen h-screen overflow-hidden flex items-center justify-center', className)}
      style={{ perspective: '1500px', background: 'var(--surface)', color: 'var(--ink)' }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      {/* Hero text */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <h1 className="text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2"
          style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter"
          style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
          {tagline2}
        </h1>
      </div>

      {/* CTA layer */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-silver-matte"
          style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
          {ctaHeading}
        </h2>
        <p className="mb-12 max-w-xl mx-auto font-light leading-relaxed"
          style={{ fontSize: '18px', color: 'var(--ink-muted)', fontFamily: "'Inter','DM Sans',sans-serif" }}>
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-5">
          <a href="/dashboard" className="btn-cta-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem]"
            style={{ fontFamily: "'Inter',sans-serif" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="text-left">
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: '-2px' }}>Open the</div>
              <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>App</div>
            </div>
          </a>
          <a href="/dashboard?demo=true" className="btn-cta-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem]"
            style={{ fontFamily: "'Inter',sans-serif" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '-2px' }}>See it in</div>
              <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>Demo Mode</div>
            </div>
          </a>
        </div>
      </div>

      {/* Deep card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: '1500px' }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">

            {/* Right: brand name */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h2 className="text-card-silver-matte font-black uppercase tracking-tighter text-5xl md:text-[5rem] lg:text-[7rem]"
                style={{ fontFamily: "'Inter','Space Mono',sans-serif" }}>
                {brandName}
              </h2>
            </div>

            {/* Center: Laptop mockup */}
            <div className="mockup-scroll-wrapper order-2 relative w-full h-[340px] lg:h-[520px] flex items-center justify-center z-10" style={{ perspective: '1000px' }}>
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.62] md:scale-[0.82] lg:scale-100" style={{ transformOrigin: 'center center' }}>

                {/* Entire laptop assembly */}
                <div ref={mockupRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', willChange: 'transform', transformStyle: 'preserve-3d' }}>

                  {/* ── Screen lid ── */}
                  <div className="laptop-screen-shell" style={{ width: '480px' }}>

                    {/* Camera bar */}
                    <div style={{ height: '18px', background: '#1c1c1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3a3a3c' }} />
                    </div>

                    {/* Screen glare overlay */}
                    <div className="screen-glare" style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }} aria-hidden="true" />

                    {/* ── Dashboard UI ── */}
                    <div style={{ height: '280px', background: '#03120e', display: 'flex', overflow: 'hidden', position: 'relative' }}>

                      {/* Mini nav sidebar */}
                      <div className="phone-widget" style={{ width: '48px', background: '#041610', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, borderRight: '1px solid rgba(0,128,128,0.08)' }}>
                        {/* Logo mark */}
                        <svg width="22" height="22" viewBox="0 0 40 40" fill="none" style={{ marginBottom: '8px', flexShrink: 0 }} aria-hidden="true">
                          <rect width="40" height="40" rx="10" fill="url(#mini-grad)" />
                          <defs>
                            <linearGradient id="mini-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#009090" /><stop offset="1" stopColor="#004444" />
                            </linearGradient>
                          </defs>
                          <rect x="9" y="10" width="4" height="21" rx="1.5" fill="white" />
                          <rect x="9" y="10" width="18" height="4" rx="1.5" fill="white" />
                          <rect x="9" y="18.5" width="13" height="4" rx="1.5" fill="white" />
                          <path d="M30 6L31.4 9.6L35 11L31.4 12.4L30 16L28.6 12.4L25 11L28.6 9.6Z" fill="#7FFFD4" opacity="0.9" />
                        </svg>
                        {/* Nav dots */}
                        {[true, false, false, false].map((active, i) => (
                          <div key={i} style={{ width: '28px', height: '26px', borderRadius: '7px', background: active ? 'rgba(0,128,128,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '13px', height: '13px', borderRadius: '3px', background: active ? 'rgba(0,200,150,0.7)' : 'rgba(255,255,255,0.12)' }} />
                          </div>
                        ))}
                      </div>

                      {/* Mini chat panel */}
                      <div className="phone-widget" style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px', overflow: 'hidden', borderRight: '1px solid rgba(0,128,128,0.08)' }}>
                        {/* Chat header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '7px', borderBottom: '1px solid rgba(0,128,128,0.1)', flexShrink: 0 }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(0,128,128,0.25)' }} />
                          <div style={{ height: '7px', width: '55px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px' }} />
                          <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#34d399' }} />
                        </div>
                        {/* Messages */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-end' }}>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,128,128,0.35)', flexShrink: 0 }} />
                            <div style={{ height: '28px', flex: 1, maxWidth: '85%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px 6px 6px 2px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ height: '20px', width: '60%', background: 'rgba(0,128,128,0.22)', borderRadius: '6px 6px 2px 6px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,128,128,0.35)', flexShrink: 0 }} />
                            <div style={{ height: '38px', flex: 1, maxWidth: '90%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px 6px 6px 2px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ height: '20px', width: '45%', background: 'rgba(0,128,128,0.22)', borderRadius: '6px 6px 2px 6px' }} />
                          </div>
                        </div>
                        {/* Input */}
                        <div style={{ height: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid rgba(0,128,128,0.14)', flexShrink: 0 }} />
                      </div>

                      {/* Mini profile / metrics panel */}
                      <div style={{ width: '128px', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#030f0a', flexShrink: 0 }}>

                        {/* Income */}
                        <div className="phone-widget" style={{ background: 'rgba(0,128,128,0.08)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(0,128,128,0.12)' }}>
                          <div style={{ height: '5px', width: '38px', background: 'rgba(255,255,255,0.12)', borderRadius: '3px', marginBottom: '4px' }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: '#00bfa5', fontWeight: 700 }}>$2,150</span>
                        </div>

                        {/* Budget ring + counter */}
                        <div className="phone-widget" style={{ background: 'rgba(0,128,128,0.07)', borderRadius: '6px', padding: '8px 6px', border: '1px solid rgba(0,128,128,0.1)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <svg width="52" height="52" aria-hidden="true">
                            <circle cx="26" cy="26" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                            <circle className="progress-ring" cx="26" cy="26" r="18" fill="none" stroke="#00bfa5" strokeWidth="5" />
                          </svg>
                          <span className="counter-val" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', color: '#fff', fontWeight: 700, lineHeight: 1 }}>0</span>
                          <span style={{ fontSize: '7px', color: 'rgba(0,200,150,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter',sans-serif" }}>{metricLabel}</span>
                        </div>

                        {/* Expenses */}
                        <div className="phone-widget" style={{ background: 'rgba(255,33,87,0.06)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(255,33,87,0.1)' }}>
                          <div style={{ height: '5px', width: '38px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '4px' }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: '#FF2157', fontWeight: 700 }}>-$1,980</span>
                        </div>

                        {/* Issue badge */}
                        <div className="phone-widget" style={{ background: 'rgba(254,153,0,0.06)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(254,153,0,0.1)' }}>
                          <div style={{ height: '5px', width: '32px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginBottom: '4px' }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: '#FE9900', fontWeight: 600 }}>3 issues</span>
                        </div>
                      </div>

                    </div>{/* end screen content */}
                  </div>{/* end laptop-screen-shell */}

                  {/* ── Hinge ── */}
                  <div className="laptop-hinge" style={{ width: '490px' }} />

                  {/* ── Base / keyboard ── */}
                  <div className="laptop-base" style={{ width: '500px', padding: '10px 18px 14px' }}>
                    {/* Keyboard rows (decorative) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px', marginBottom: '8px', opacity: 0.28 }}>
                      {Array.from({ length: 42 }).map((_, i) => (
                        <div key={i} className="laptop-key" style={{ height: '10px', gridColumn: i === 0 || i === 13 ? 'span 2' : 'span 1' }} />
                      ))}
                    </div>
                    {/* Trackpad */}
                    <div className="laptop-trackpad" style={{ width: '130px', height: '78px', margin: '0 auto' }} />
                  </div>

                </div>{/* end laptop assembly */}

                {/* Floating badge — top left */}
                <div className="floating-badge absolute flex top-4 lg:top-8 left-0 lg:left-[-60px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(to bottom,rgba(0,128,128,0.2),rgba(0,128,128,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,200,150,0.2)' }}>
                    <span style={{ fontSize: '16px' }} aria-hidden="true">📊</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', fontFamily: "'Inter',sans-serif" }}>Budget on track</p>
                    <p style={{ fontSize: '11px', color: 'rgba(0,200,150,0.5)', fontFamily: "'Inter',sans-serif" }}>94% score this month</p>
                  </div>
                </div>

                {/* Floating badge — bottom right */}
                <div className="floating-badge absolute flex bottom-10 lg:bottom-14 right-0 lg:right-[-60px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(to bottom,rgba(52,211,153,0.2),rgba(52,211,153,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span style={{ fontSize: '16px' }} aria-hidden="true">✨</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', fontFamily: "'Inter',sans-serif" }}>AI Insight ready</p>
                    <p style={{ fontSize: '11px', color: 'rgba(52,211,153,0.5)', fontFamily: "'Inter',sans-serif" }}>New suggestion available</p>
                  </div>
                </div>

              </div>{/* end scale wrapper */}
            </div>{/* end mockup-scroll-wrapper */}

            {/* Left: Description */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full px-4 lg:px-0">
              <h3 className="text-white font-bold mb-0 lg:mb-5 tracking-tight text-2xl md:text-3xl lg:text-4xl"
                style={{ fontFamily: "'Inter','DM Sans',sans-serif" }}>
                {cardHeading}
              </h3>
              <p className="hidden md:block font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none text-sm md:text-base lg:text-lg"
                style={{ color: 'rgba(180,220,210,0.7)', fontFamily: "'Inter','DM Sans',sans-serif" }}>
                {cardDescription}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
