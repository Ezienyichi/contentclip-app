'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

const supabase = createClient();

function ResetPasswordInner() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  // 'verifying' | 'ready' | 'success' | 'error'
  const [stage,    setStage]    = useState<'verifying' | 'ready' | 'success' | 'error'>('verifying');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prevent double-execution in React Strict Mode / re-mounts
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    // ── DEBUG: log full URL so we can see where params land (query vs hash)
    console.log('[reset] full href:', window.location.href);
    console.log('[reset] search (query string):', window.location.search);
    console.log('[reset] hash fragment:', window.location.hash);

    const token_hash = searchParams.get('token_hash');
    const type       = searchParams.get('type');

    console.log('[reset] token_hash from searchParams:', token_hash ? token_hash.slice(0, 20) + '…' : null);
    console.log('[reset] type from searchParams:', type);

    // Also check if params are hiding in the hash fragment (some Supabase configs)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    console.log('[reset] token_hash from hash fragment:', hashParams.get('token_hash') ? hashParams.get('token_hash')!.slice(0, 20) + '…' : null);
    console.log('[reset] access_token in hash (implicit flow indicator):', hashParams.get('access_token') ? 'YES' : 'NO');

    if (!token_hash || type !== 'recovery') {
      console.warn('[reset] missing token_hash or wrong type — showing error. token_hash:', !!token_hash, 'type:', type);
      setErrorMsg('Invalid or expired reset link. Please request a new one.');
      setStage('error');
      return;
    }

    console.log('[reset] calling verifyOtp with token_hash and type=recovery…');
    // verifyOtp with token_hash works cross-device — no PKCE code verifier needed
    supabase.auth.verifyOtp({ token_hash, type: 'recovery' }).then(({ data, error }) => {
      if (error) {
        console.error('[reset] verifyOtp error:', error.message, '| status:', (error as any).status, '| full:', error);
        setErrorMsg('This reset link has expired or already been used. Please request a new one.');
        setStage('error');
      } else {
        console.log('[reset] verifyOtp success — session user:', data?.user?.email ?? 'unknown');
        setStage('ready');
      }
    });
  // searchParams is stable from useSearchParams; empty deps is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStage('success');
      await supabase.auth.signOut({ scope: 'local' });
      setTimeout(() => router.push('/auth'), 2200);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#E4E2DD',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      fontFamily:     'inherit',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     400,
        background:   '#EFECEA',
        borderRadius: radius.xl,
        padding:      '36px 32px',
        boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
        border:       '1px solid rgba(0,0,0,0.07)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', color: '#1A1714' }}>
              Vangel<span style={{ color: '#9B5DE5' }}>Clip</span>
            </span>
          </a>
        </div>

        {/* ── Verifying ── */}
        {stage === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width:         28,
              height:        28,
              borderRadius:  '50%',
              border:        '3px solid rgba(155,93,229,0.2)',
              borderTopColor:'#9B5DE5',
              animation:     'vc-spin 0.7s linear infinite',
              margin:        '0 auto 16px',
            }} />
            <p style={{ margin: 0, fontSize: 14, color: '#6B6560' }}>Verifying your link…</p>
          </div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1A1714' }}>
              Link invalid
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B6560', lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <a
              href="/auth?mode=forgot"
              style={{
                display:        'inline-block',
                padding:        '11px 24px',
                borderRadius:   radius.lg,
                background:     gradients.primary,
                color:          '#fff',
                fontSize:       14,
                fontWeight:     700,
                textDecoration: 'none',
              }}
            >
              Request new link
            </a>
          </div>
        )}

        {/* ── Password form ── */}
        {stage === 'ready' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#1A1714' }}>
                Set new password
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6B6560' }}>
                Choose a strong password for your account.
              </p>
            </div>

            {/* New password */}
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="New password (min 8 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                style={{
                  ...inputField,
                  width:        '100%',
                  boxSizing:    'border-box',
                  paddingRight: 44,
                  background:   '#F5F3EF',
                  color:        '#1A1714',
                  border:       '1px solid rgba(0,0,0,0.12)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position:   'absolute',
                  right:      12,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  fontSize:   14,
                  color:      '#6B6560',
                  padding:    0,
                  lineHeight: 1,
                }}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Confirm password */}
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{
                ...inputField,
                width:      '100%',
                boxSizing:  'border-box',
                background: '#F5F3EF',
                color:      '#1A1714',
                border:     '1px solid rgba(0,0,0,0.12)',
              }}
            />

            {errorMsg && (
              <p style={{
                margin:       0,
                fontSize:     13,
                color:        colors.error,
                background:   `${colors.error}10`,
                border:       `1px solid ${colors.error}30`,
                borderRadius: radius.md,
                padding:      '10px 14px',
              }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              style={{
                height:       48,
                borderRadius: radius.lg,
                border:       'none',
                background:   (loading || !password || !confirm) ? '#D4D0CA' : gradients.primary,
                color:        (loading || !password || !confirm) ? '#9B9590' : '#fff',
                fontSize:     15,
                fontWeight:   700,
                cursor:       (loading || !password || !confirm) ? 'not-allowed' : 'pointer',
                transition:   'opacity 0.2s',
              }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {/* ── Success ── */}
        {stage === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1A1714' }}>
              Password updated!
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B6560' }}>
              Redirecting you to sign in…
            </p>
            <div style={{
              width:         24,
              height:        24,
              borderRadius:  '50%',
              border:        '3px solid rgba(155,93,229,0.2)',
              borderTopColor:'#9B5DE5',
              animation:     'vc-spin 0.7s linear infinite',
              margin:        '0 auto',
            }} />
          </div>
        )}

        {/* Back to sign in */}
        {stage === 'ready' && (
          <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: 13, color: '#6B6560' }}>
            <a href="/auth" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to sign in
            </a>
          </p>
        )}
      </div>

      <style>{`
        @keyframes vc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#E4E2DD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(155,93,229,0.2)', borderTopColor: '#9B5DE5', animation: 'vc-spin 0.7s linear infinite' }} />
        <style>{`@keyframes vc-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}
