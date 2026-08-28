'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BillingSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const plan   = params.get('plan') ?? '';
  const period = params.get('period') ?? '';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); router.push('/dashboard'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E4E2DD', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '48px 32px', background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#1A1714' }}>Payment successful!</h1>
        {plan && (
          <p style={{ fontSize: 15, color: '#6B6560', marginBottom: 4 }}>
            You&apos;re now on the <strong style={{ color: '#9B5DE5', textTransform: 'capitalize' }}>{plan}</strong> plan
            {period ? ` (${period})` : ''}.
          </p>
        )}
        <p style={{ fontSize: 13, color: '#6B6560', marginTop: 8 }}>
          Your minute quota has been reset and your new limits are active.
        </p>
        <p style={{ fontSize: 12, color: '#9B9690', marginTop: 24 }}>
          Redirecting to dashboard in {countdown}s…
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ marginTop: 16, padding: '12px 28px', background: 'linear-gradient(135deg,#9B5DE5,#7c3aed)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
