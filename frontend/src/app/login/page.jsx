'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight } from 'lucide-react';
import { FinCopilotLogo } from '../../components/shared/FinCopilotLogo';
import { NeuButton } from '../../components/shared/NeuButton';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

const FONT = 'DM Sans, sans-serif';
const MONO = 'Space Mono, monospace';

export default function LoginPage() {
  const router             = useRouter();
  const [tab, setTab]      = useState('signin');   // 'signin' | 'signup'
  const [email, setEmail]  = useState('');
  const [name, setName]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]    = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const result = tab === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password, name);

    if (result.error) {
      setError(result.error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    } else {
      // TODO: store authUser in AppContext — for now redirect to dashboard
      router.push('/dashboard');
    }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    fontFamily: FONT, fontSize: '15px', color: 'var(--ink)',
    border: 'none', outline: 'none', borderRadius: '12px',
    background: 'transparent',
  };

  return (
    <div
      style={{
        minHeight: '100dvh', width: '100vw',
        background: 'var(--surface)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: FONT,
      }}
    >
      {/* Card */}
      <div
        className="neu-raised-lg"
        style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', overflow: 'hidden' }}
      >
        {/* Brand header */}
        <div style={{ background: 'linear-gradient(145deg, var(--primary-dark), var(--primary))', padding: '32px 36px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <FinCopilotLogo size={36} />
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: '20px', color: '#fff', letterSpacing: '0.02em' }}>
              FinCopilot
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            Your semester financial decision engine
          </p>
        </div>

        {/* Form area */}
        <div style={{ padding: '28px 32px 32px' }}>
          {/* Tab switcher */}
          <div className="neu-inset-sm" style={{ display: 'flex', padding: '4px', borderRadius: '14px', gap: '2px', marginBottom: '24px' }}>
            {['signin', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', borderRadius: '10px',
                  fontFamily: FONT, fontSize: '13px', fontWeight: tab === t ? 600 : 400,
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--primary)' : 'var(--ink-muted)',
                  boxShadow: tab === t ? 'var(--shadow-out-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Name field (sign up only) */}
            {tab === 'signup' && (
              <div className="neu-inset-sm" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  required={tab === 'signup'}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div className="neu-inset-sm" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div className="neu-inset-sm" style={{ borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,33,87,0.08)', borderRadius: '10px', border: '1px solid rgba(255,33,87,0.2)' }}>
                <p style={{ fontSize: '13px', color: 'var(--danger)', fontFamily: FONT }}>{error}</p>
              </div>
            )}

            {/* Forgot password (sign in only) */}
            {tab === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                <button type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', color: 'var(--primary)', fontFamily: FONT }}>
                  {/* TODO: authService.sendPasswordReset(email) */}
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <NeuButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !email || !password}
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Please wait…</>
              ) : (
                <>{tab === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </NeuButton>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-dark)' }} />
            <span style={{ fontSize: '12px', color: 'var(--ink-subtle)', fontFamily: FONT }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--surface-dark)' }} />
          </div>

          {/* OAuth — Supabase Google */}
          <button
            type="button"
            className="neu-btn"
            style={{ width: '100%', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: FONT, fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}
            onClick={() => {
              // TODO: supabase.auth.signInWithOAuth({ provider: 'google' })
              alert('Google sign-in — configure Supabase OAuth provider to enable.');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Demo link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard?demo=true')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--ink-muted)', fontFamily: FONT }}
            >
              Continue as guest (demo mode) →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--ink-subtle)', fontFamily: FONT, textAlign: 'center' }}>
        Authentication powered by{' '}
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Supabase</span>
        {' '}· Your data is stored securely
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
