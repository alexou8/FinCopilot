'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Compass,
  Eye,
  EyeOff,
  LineChart,
  Loader,
  Lock,
  Mail,
  Sparkles,
  TriangleAlert,
  User,
} from 'lucide-react';
import { FinCopilotLogo } from '../../components/shared/FinCopilotLogo';
import { NeuButton } from '../../components/shared/NeuButton';
import { supabase } from '../../lib/supabase';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

const FONT = 'DM Sans, sans-serif';
const MONO = 'Space Mono, monospace';

const FEATURE_CARDS = [
  {
    icon: Bot,
    label: 'Chat onboarding',
    detail: 'Turn a messy money situation into a structured student finance profile.',
  },
  {
    icon: TriangleAlert,
    label: 'Issue detection',
    detail: 'Surface debt, rent, savings, and cash-flow risks before they become expensive.',
  },
  {
    icon: LineChart,
    label: 'Scenario testing',
    detail: 'Model moves like buying a car, moving out, or taking an unpaid internship.',
  },
  {
    icon: Compass,
    label: 'Guided research',
    detail: 'Launch browser-assisted research to compare real fixes, rates, and next steps.',
  },
];

function FeatureCard({ icon: Icon, label, detail }) {
  return (
    <div className="neu-inset-sm" style={{ padding: '16px', borderRadius: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          className="neu-raised-sm"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: 'var(--primary)' }} />
        </div>
        <p
          style={{
            fontFamily: MONO,
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </p>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.65 }}>
        {detail}
      </p>
    </div>
  );
}

function AuthField({ icon: Icon, label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: MONO,
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--ink-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <Icon size={14} style={{ color: 'var(--primary)' }} />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password || (tab === 'signup' && !name.trim())) return;

    setLoading(true);
    setError(null);

    const result = tab === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password, name.trim());

    if (result.error) {
      setError(result.error.message || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleGoogleSignIn() {
    setError(null);

    if (!supabase) {
      setError('Google sign-in requires Supabase environment variables.');
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontFamily: FONT,
    fontSize: '15px',
    color: 'var(--ink)',
    border: 'none',
    outline: 'none',
    borderRadius: '14px',
    background: 'transparent',
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: '100dvh',
        width: '100vw',
        background: 'var(--surface)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: FONT,
      }}
    >
      <div className="login-ambient login-ambient-a" />
      <div className="login-ambient login-ambient-b" />
      <div className="login-grid" />

      <div className="login-shell">
        <section className="neu-raised-lg login-hero">
          <div className="login-hero-top">
            <div className="neu-raised-sm login-badge">
              <Sparkles size={14} style={{ color: 'var(--primary)' }} />
              <span>Student Money OS</span>
            </div>
          </div>

          <div className="login-hero-copy">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <FinCopilotLogo size={42} />
              <div>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '4px',
                  }}
                >
                  FinCopilot
                </p>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                  Chat through your money, catch issues early, and test major decisions.
                </p>
              </div>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.4rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: '#17324d',
                fontWeight: 800,
                marginBottom: '18px',
              }}
            >
              Student finance,
              <br />
              with more signal.
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--ink-muted)',
                lineHeight: 1.8,
                maxWidth: '560px',
              }}
            >
              Build your profile in chat, detect financial issues, compare what-if paths, and launch guided web research before you commit to the next move.
            </p>
          </div>

          <div className="login-hero-callout neu-inset-sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                className="neu-raised-sm"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Compass size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '4px',
                  }}
                >
                  New browser-assisted workflow
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  Research solutions without leaving the dashboard flow.
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
              FinCopilot can now guide issue research with a live browser companion, so recommendations are tied back to real sources and real next steps.
            </p>
          </div>

          <div className="login-feature-grid">
            {FEATURE_CARDS.map(feature => (
              <FeatureCard key={feature.label} {...feature} />
            ))}
          </div>
        </section>

        <section className="neu-raised-lg login-auth">
          <div
            style={{
              padding: '30px 30px 22px',
              borderBottom: '1px solid var(--surface-dark)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <FinCopilotLogo size={34} />
              <div>
                <h2
                  style={{
                    fontFamily: MONO,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    letterSpacing: '0.02em',
                    marginBottom: '4px',
                  }}
                >
                  Access Your Workspace
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  Sign in to keep your profile, issue analysis, simulations, and research in sync.
                </p>
              </div>
            </div>

            <div className="neu-inset-sm" style={{ display: 'flex', padding: '4px', borderRadius: '14px', gap: '2px' }}>
              {['signin', 'signup'].map(currentTab => (
                <button
                  key={currentTab}
                  type="button"
                  onClick={() => {
                    setTab(currentTab);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    fontFamily: FONT,
                    fontSize: '13px',
                    fontWeight: tab === currentTab ? 700 : 500,
                    background: tab === currentTab ? 'var(--surface)' : 'transparent',
                    color: tab === currentTab ? 'var(--primary)' : 'var(--ink-muted)',
                    boxShadow: tab === currentTab ? 'var(--shadow-out-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {currentTab === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px 30px 30px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tab === 'signup' && (
                <AuthField icon={User} label="Full name">
                  <div className="neu-inset-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <input
                      type="text"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      placeholder="Your name"
                      required
                      style={inputStyle}
                    />
                  </div>
                </AuthField>
              )}

              <AuthField icon={Mail} label="Email address">
                <div className="neu-inset-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="name@school.ca"
                    required
                    style={inputStyle}
                  />
                </div>
              </AuthField>

              <AuthField icon={Lock} label="Password">
                <div className="neu-inset-sm" style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder={tab === 'signin' ? 'Enter your password' : 'Create a password'}
                    required
                    minLength={6}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(current => !current)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </AuthField>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255,33,87,0.08)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,33,87,0.18)',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'var(--danger)', lineHeight: 1.6 }}>
                    {error}
                  </p>
                </div>
              )}

              {tab === 'signin' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '-4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ink-subtle)' }}>
                    Continue where you left off.
                  </span>
                  <button
                    type="button"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--primary)',
                      fontFamily: FONT,
                      fontWeight: 600,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <NeuButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !email || !password || (tab === 'signup' && !name.trim())}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {loading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Please wait...
                  </>
                ) : (
                  <>
                    {tab === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </NeuButton>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 18px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-dark)' }} />
              <span style={{ fontSize: '12px', color: 'var(--ink-subtle)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-dark)' }} />
            </div>

            <button
              type="button"
              className="neu-btn"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: FONT,
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
              onClick={handleGoogleSignIn}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard?demo=true')}
              style={{
                width: '100%',
                marginTop: '14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--ink-muted)',
                fontFamily: FONT,
                fontWeight: 600,
              }}
            >
              Continue as guest (demo mode) {'->'}
            </button>

            <div className="neu-inset-sm" style={{ marginTop: '18px', padding: '14px 16px', borderRadius: '16px' }}>
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ink-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px',
                }}
              >
                Auth + sync
              </p>
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                Supabase-backed authentication keeps your saved profile, chat state, and planning tools available across sessions.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes loginFloatA {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(18px, -24px, 0) scale(1.05); }
        }

        @keyframes loginFloatB {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-22px, 26px, 0) scale(1.08); }
        }

        .login-shell {
          position: relative;
          z-index: 1;
          width: min(1160px, 100%);
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
          gap: 24px;
          align-items: stretch;
        }

        .login-hero,
        .login-auth {
          position: relative;
          overflow: hidden;
        }

        .login-hero {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-height: 720px;
        }

        .login-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 16%, rgba(0, 128, 128, 0.16), transparent 30%),
            radial-gradient(circle at 88% 20%, rgba(255, 255, 255, 0.6), transparent 26%),
            linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0));
          pointer-events: none;
        }

        .login-hero-top,
        .login-hero-copy,
        .login-hero-callout,
        .login-feature-grid {
          position: relative;
          z-index: 1;
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-family: ${MONO};
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .login-hero-callout {
          padding: 18px;
          border-radius: 22px;
        }

        .login-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .login-auth {
          display: flex;
          flex-direction: column;
          min-height: 720px;
        }

        .login-ambient {
          position: absolute;
          inset: auto;
          border-radius: 999px;
          filter: blur(10px);
          opacity: 0.7;
          pointer-events: none;
        }

        .login-ambient-a {
          top: 8%;
          left: -6%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(0, 128, 128, 0.26), rgba(0, 128, 128, 0));
          animation: loginFloatA 14s ease-in-out infinite;
        }

        .login-ambient-b {
          right: -4%;
          bottom: 4%;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0));
          animation: loginFloatB 18s ease-in-out infinite;
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(90, 106, 133, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(90, 106, 133, 0.06) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(circle at center, black, transparent 82%);
          -webkit-mask-image: radial-gradient(circle at center, black, transparent 82%);
          pointer-events: none;
        }

        @media (max-width: 1080px) {
          .login-shell {
            grid-template-columns: 1fr;
            max-width: 620px;
          }

          .login-hero,
          .login-auth {
            min-height: auto;
          }
        }

        @media (max-width: 720px) {
          .login-page {
            padding: 16px;
          }

          .login-hero {
            padding: 24px;
          }

          .login-auth > div:first-child,
          .login-auth > div:last-child {
            padding-left: 24px;
            padding-right: 24px;
          }

          .login-feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
