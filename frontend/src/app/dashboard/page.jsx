'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { AppShell } from '../../components/AppShell';

function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam  = searchParams.get('demo') === 'true';

  const [ready,  setReady]  = useState(false);
  const [isDemo, setIsDemo] = useState(isDemoParam);

  useEffect(() => {
    // Supabase not configured → demo mode
    if (!supabase) {
      setIsDemo(true);
      setReady(true);
      return;
    }

    // Explicit demo mode via query param
    if (isDemoParam) {
      setIsDemo(true);
      setReady(true);
      return;
    }

    // Check for an active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsDemo(false);
        setReady(true);
      } else {
        router.replace('/login');
      }
    });
  }, [isDemoParam, router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '13px',
            color: 'var(--ink-muted)',
            letterSpacing: '0.05em',
          }}
        >
          Loading…
        </span>
      </div>
    );
  }

  return <AppShell isDemo={isDemo} />;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
